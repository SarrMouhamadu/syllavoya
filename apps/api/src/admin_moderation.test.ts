import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "./db.js";
import { adminService } from "./modules/admin/admin.service.js";
import { publicationsService } from "./modules/publications/publications.service.js";
import { AppError } from "./errors/AppError.js";

describe("Étape 5 : Administration et Modération des Publications", () => {
  let adminUserId: string;
  let testFormuleId: string;

  const createdUserIds: string[] = [];
  const createdProIds: string[] = [];
  const createdSubIds: string[] = [];
  const cleanupPubIds: string[] = [];
  const cleanupAuditLogIds: string[] = [];

  before(async () => {
    // 1. Créer un administrateur
    adminUserId = randomUUID();
    await db.orm.public.Utilisateur.create({
      id: adminUserId,
      nom: "Admin",
      prenom: "Principal",
      email: `admin.mod.${Date.now()}@syllavoyage.com`,
      telephone: "+221770000001",
      mot_de_passe: "hashed_dummy_password",
      role: "ADMIN",
      statut: "ACTIF",
    });
    createdUserIds.push(adminUserId);

    // 2. Formule professionnelle
    const formule = await db.orm.public.FormuleAbonnement.first();
    if (!formule) {
      testFormuleId = randomUUID();
      await db.orm.public.FormuleAbonnement.create({
        id: testFormuleId,
        nom: "Pro Modération",
        duree: "MENSUEL",
        prix: 20000,
        type_utilisateur: "PROFESSIONNEL",
        statut: "ACTIF",
      });
    } else {
      testFormuleId = formule.id;
    }
  });

  after(async () => {
    for (const pid of cleanupPubIds) {
      try {
        await db.orm.public.Publication.where({ id: pid }).delete();
      } catch {}
    }
    for (const aid of cleanupAuditLogIds) {
      try {
        await db.orm.public.AuditLog.where({ id: aid }).delete();
      } catch {}
    }
    for (const sid of createdSubIds) {
      try {
        await db.orm.public.Abonnement.where({ id: sid }).delete();
      } catch {}
    }
    for (const prid of createdProIds) {
      try {
        await db.orm.public.Professionnel.where({ id: prid }).delete();
      } catch {}
    }
    for (const uid of createdUserIds) {
      try {
        await db.orm.public.Utilisateur.where({ id: uid }).delete();
      } catch {}
    }
  });

  // Helper pour créer un professionnel vérifié avec abonnement actif
  async function createVerifiedPro(name: string) {
    const uid = randomUUID();
    const pid = randomUUID();
    const sid = randomUUID();

    await db.orm.public.Utilisateur.create({
      id: uid,
      nom: name,
      prenom: "Pro",
      email: `pro.${randomUUID().slice(0, 8)}@syllavoyage.com`,
      telephone: "+221770000002",
      mot_de_passe: "hashed_dummy_password",
      role: "PROFESSIONNEL",
      statut: "ACTIF",
    });
    createdUserIds.push(uid);

    await db.orm.public.Professionnel.create({
      id: pid,
      utilisateur_id: uid,
      nom_structure: `${name} Agence`,
      statut_verification: "VERIFIE",
      created_at: Temporal.Now.instant(),
    });
    createdProIds.push(pid);

    const now = Temporal.Now.instant();
    const dateFin = now.add({ seconds: 30 * 24 * 3600 });
    await db.orm.public.Abonnement.create({
      id: sid,
      utilisateur_id: uid,
      formule_id: testFormuleId,
      date_debut: now,
      date_fin: dateFin,
      statut: "ACTIF",
    });
    createdSubIds.push(sid);

    return { userId: uid, proId: pid, name };
  }

  test("1. Admin voit une publication créée par un professionnel avec statut EN_ATTENTE", async () => {
    const pro = await createVerifiedPro("Casamance Evasion");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Circuit Casamance Découverte",
      contenu: "Séjour guidé de 5 jours en Casamance avec pirogue et campements écologiques.",
    });
    cleanupPubIds.push(pub.id);

    assert.equal(pub.statut, "EN_ATTENTE");

    const adminPubs = await adminService.listPublications();
    const found = adminPubs.find((p) => p.id === pub.id);

    assert.ok(found, "La publication doit être listée dans la console admin");
    assert.equal(found.statut, "EN_ATTENTE");
    assert.equal(found.titre, "Circuit Casamance Découverte");
    assert.equal(found.professionnel?.nom_structure, "Casamance Evasion Agence");
  });

  test("2. Admin peut approuver une publication EN_ATTENTE -> APPROUVEE avec date_publication et traçabilité audit", async () => {
    const pro = await createVerifiedPro("Gorée Histoire");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Excursion Île de Gorée",
      contenu: "Visite guidée historique de Gorée et de la Maison des Esclaves avec guide agréé.",
    });
    cleanupPubIds.push(pub.id);

    const result = await adminService.treatPublication(
      pub.id,
      { decision: "APPROUVEE", commentaire: "Conforme à la charte Sylla Voyage" },
      adminUserId
    );

    if (result.audit_log?.id) {
      cleanupAuditLogIds.push(result.audit_log.id);
    }

    assert.equal(result.statut, "APPROUVEE");
    assert.ok(result.date_publication !== null);

    // Vérification en base de données
    const checkDb = await db.orm.public.Publication.where({ id: pub.id }).first();
    assert.equal(checkDb?.statut, "APPROUVEE");
    assert.ok(checkDb?.date_publication !== null);

    // Vérification de l'entrée dans le journal d'audit
    const auditLog = await db.orm.public.AuditLog
      .where({ action: "MODERATION_PUBLICATION_APPROUVEE" })
      .first();
    assert.ok(auditLog, "Un log d'audit doit être créé pour l'approbation");
  });

  test("3. Admin peut rejeter une publication EN_ATTENTE -> REJETEE avec commentaire de modération", async () => {
    const pro = await createVerifiedPro("Sine Saloum Tours");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Offre Spéciale Incomplète",
      contenu: "Tarif promotionnel sans description du circuit.",
    });
    cleanupPubIds.push(pub.id);

    const result = await adminService.treatPublication(
      pub.id,
      {
        decision: "REJETEE",
        commentaire: "Veuillez détailler le programme du séjour et les prestations incluses.",
      },
      adminUserId
    );

    if (result.audit_log?.id) {
      cleanupAuditLogIds.push(result.audit_log.id);
    }

    assert.equal(result.statut, "REJETEE");
    assert.equal(result.date_publication, null);
    assert.equal(result.commentaire_moderation, "Veuillez détailler le programme du séjour et les prestations incluses.");

    const checkDb = await db.orm.public.Publication.where({ id: pub.id }).first();
    assert.equal(checkDb?.statut, "REJETEE");
    assert.equal(checkDb?.date_publication, null);
  });

  test("4. Publication approuvée est visible publiquement", async () => {
    const pro = await createVerifiedPro("Niokolo Safari");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Safari Parc de Niokolo Koba",
      contenu: "Safari en 4x4 au cœur de la faune sauvage du Sénégal oriental.",
    });
    cleanupPubIds.push(pub.id);

    // Avant approbation : non visible publiquement
    const beforePublicList = await publicationsService.listPublic();
    assert.ok(!beforePublicList.some((p) => p.id === pub.id));

    // Approbation par l'admin
    const treated = await adminService.treatPublication(
      pub.id,
      { decision: "APPROUVEE" },
      adminUserId
    );
    if (treated.audit_log?.id) cleanupAuditLogIds.push(treated.audit_log.id);

    // Après approbation : visible publiquement
    const afterPublicList = await publicationsService.listPublic();
    const publicPub = afterPublicList.find((p) => p.id === pub.id);
    assert.ok(publicPub, "La publication approuvée doit figurer dans le listing public");
    assert.equal(publicPub.statut, "APPROUVEE");
  });

  test("5. Publication rejetée n'est pas publiée (absente du listing public et 404 pour un tiers)", async () => {
    const pro = await createVerifiedPro("Lompoul Aventures");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Publication Refusée Test",
      contenu: "Contenu non conforme qui sera rejeté.",
    });
    cleanupPubIds.push(pub.id);

    const treated = await adminService.treatPublication(
      pub.id,
      { decision: "REJETEE", commentaire: "Non conforme" },
      adminUserId
    );
    if (treated.audit_log?.id) cleanupAuditLogIds.push(treated.audit_log.id);

    // Absente du listing public
    const publicList = await publicationsService.listPublic();
    assert.ok(!publicList.some((p) => p.id === pub.id), "Une publication rejetée ne doit pas être visible publiquement");

    // Accès direct d'un utilisateur tiers -> 404
    await assert.rejects(
      async () => {
        await publicationsService.getById(pub.id, undefined, undefined);
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 404);
        assert.equal(err.code, "PUBLICATION_NOT_FOUND");
        return true;
      }
    );
  });

  test("6. La modification d'une publication rejetée par son auteur la remet en modération (EN_ATTENTE)", async () => {
    const pro = await createVerifiedPro("Désert Lompoul");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Bivouac Désert de Lompoul (Version 1)",
      contenu: "Nuit dans le désert.",
    });
    cleanupPubIds.push(pub.id);

    // 1. Rejet par l'admin
    const treated = await adminService.treatPublication(
      pub.id,
      { decision: "REJETEE", commentaire: "Merci de préciser le transport et les repas." },
      adminUserId
    );
    if (treated.audit_log?.id) cleanupAuditLogIds.push(treated.audit_log.id);
    assert.equal(treated.statut, "REJETEE");

    // 2. Correction par l'auteur professionnel
    const updated = await publicationsService.update(
      pub.id,
      pro.userId,
      {
        titre: "Bivouac Désert de Lompoul (Corrigé)",
        contenu: "Nuit en tente mauritanienne, dîner méchoui traditionnel et transfert 4x4 inclus.",
      }
    );

    assert.equal(updated.statut, "EN_ATTENTE");
    assert.equal(updated.date_publication, null);
    assert.equal(updated.titre, "Bivouac Désert de Lompoul (Corrigé)");

    // 3. Vérification en base de données
    const checkDb = await db.orm.public.Publication.where({ id: pub.id }).first();
    assert.equal(checkDb?.statut, "EN_ATTENTE");
    assert.equal(checkDb?.date_publication, null);

    // 4. L'admin la voit à nouveau comme EN_ATTENTE
    const adminPubs = await adminService.listPublications();
    const repending = adminPubs.find((p) => p.id === pub.id);
    assert.ok(repending);
    assert.equal(repending.statut, "EN_ATTENTE");
  });

  test("7. Sécurité : Décision invalide rejetée avec 400 VALIDATION_ERROR", async () => {
    const pro = await createVerifiedPro("Security Pro");
    const pub = await publicationsService.create(pro.userId, {
      titre: "Publication Test Erreur",
      contenu: "Contenu de test.",
    });
    cleanupPubIds.push(pub.id);

    await assert.rejects(
      async () => {
        await adminService.treatPublication(
          pub.id,
          { decision: "DECISION_TOTALEMENT_INCONNUE" as any },
          adminUserId
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "VALIDATION_ERROR");
        return true;
      }
    );
  });
});
