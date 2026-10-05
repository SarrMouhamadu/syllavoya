import { test, describe, after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "./db.js";
import { publicationsService } from "./modules/publications/publications.service.js";
import { authService } from "./modules/auth/auth.service.js";
import { AppError } from "./errors/AppError.js";

describe("Étape 3 : Publications Professionnelles — Quotas et Règles Métier", () => {
  const cleanupUserIds: string[] = [];
  const cleanupProIds: string[] = [];
  const cleanupSubIds: string[] = [];
  const cleanupPubIds: string[] = [];

  let formuleProId: string;

  before(async () => {
    // S'assurer qu'une formule d'abonnement professionnel existe
    let formule = await db.orm.public.FormuleAbonnement
      .where({ type_utilisateur: "PROFESSIONNEL" })
      .first();

    if (!formule) {
      formule = await db.orm.public.FormuleAbonnement.create({
        id: randomUUID(),
        nom: "Formule Pro Standard",
        duree: "MENSUEL",
        prix: 20000,
        type_utilisateur: "PROFESSIONNEL",
        statut: "ACTIF",
      });
    }
    formuleProId = formule.id;
  });

  after(async () => {
    // Nettoyage complet
    for (const pubId of cleanupPubIds) {
      try {
        await db.orm.public.Publication.where({ id: pubId }).delete();
      } catch {}
    }
    for (const subId of cleanupSubIds) {
      try {
        await db.orm.public.Paiement.where({ abonnement_id: subId }).delete();
        await db.orm.public.Abonnement.where({ id: subId }).delete();
      } catch {}
    }
    for (const proId of cleanupProIds) {
      try {
        await db.orm.public.Professionnel.where({ id: proId }).delete();
      } catch {}
    }
    for (const userId of cleanupUserIds) {
      try {
        await db.orm.public.Utilisateur.where({ id: userId }).delete();
      } catch {}
    }
  });

  // Helper pour créer un compte professionnel
  async function createTestProfessional(options: {
    verified: boolean;
    hasActiveSubscription: boolean;
  }) {
    const userId = randomUUID();
    const phone = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;

    await db.orm.public.Utilisateur.create({
      id: userId,
      nom: "Agence Test",
      prenom: "Mamadou",
      email: `test.pro.${Date.now()}.${Math.random().toString(36).substring(7)}@syllavoyage.com`,
      telephone: phone,
      mot_de_passe: "hashed_pwd",
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });
    cleanupUserIds.push(userId);

    const proId = randomUUID();
    await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: userId,
      nom_structure: "Agence Teranga Voyage",
      statut_verification: options.verified ? "VERIFIE" : "EN_ATTENTE",
      created_at: Temporal.Now.instant(),
    });
    cleanupProIds.push(proId);

    if (options.hasActiveSubscription) {
      const subId = randomUUID();
      const now = Temporal.Now.instant();
      await db.orm.public.Abonnement.create({
        id: subId,
        utilisateur_id: userId,
        formule_id: formuleProId,
        date_debut: now,
        date_fin: now.add({ seconds: 30 * 24 * 3600 }),
        statut: "ACTIF",
      });
      cleanupSubIds.push(subId);
    }

    return { userId, proId };
  }

  // ---------------------------------------------------------------------------
  // 1, 2, 3. Quota 2 publications sur 7 jours glissants
  // ---------------------------------------------------------------------------
  test("1, 2, 3. Quota 7 jours : 1ère et 2ème autorisées, 3ème rejetée avec 403 WEEKLY_QUOTA_EXCEEDED", async () => {
    const { userId } = await createTestProfessional({
      verified: true,
      hasActiveSubscription: true,
    });

    // 1ère publication -> succès
    const pub1 = await publicationsService.create(userId, {
      titre: "Excursion Île de Gorée",
      contenu: "Découvrez l'histoire fascinante de l'île de Gorée lors d'un circuit guidé.",
    });
    assert.ok(pub1.id);
    assert.equal(pub1.statut, "EN_ATTENTE");
    cleanupPubIds.push(pub1.id);

    // 2ème publication dans les 7 jours -> succès
    const pub2 = await publicationsService.create(userId, {
      titre: "Safari Réserve de Bandia",
      contenu: "Partez à la rencontre des girafes, rhinocéros et antilopes à Bandia.",
    });
    assert.ok(pub2.id);
    assert.equal(pub2.statut, "EN_ATTENTE");
    cleanupPubIds.push(pub2.id);

    // 3ème publication dans les 7 jours -> rejetée avec 403 WEEKLY_QUOTA_EXCEEDED
    await assert.rejects(
      async () => {
        await publicationsService.create(userId, {
          titre: "Circuit Sine Saloum (Publication en trop)",
          contenu: "Cette publication doit échouer car le quota de 2 par 7 jours est atteint.",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "WEEKLY_QUOTA_EXCEEDED");
        // Le message doit indiquer quand le professionnel pourra à nouveau publier
        assert.ok(
          err.message.includes("7 derniers jours") ||
          err.message.includes("2 publications")
        );
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Expiration de la fenêtre glissante de 7 jours
  // ---------------------------------------------------------------------------
  test("4. Après expiration de la fenêtre de 7 jours → nouvelle publication autorisée", async () => {
    const { userId, proId } = await createTestProfessional({
      verified: true,
      hasActiveSubscription: true,
    });

    const now = Temporal.Now.instant();
    const tenDaysAgo = now.subtract({ seconds: 10 * 24 * 3600 });
    const eightDaysAgo = now.subtract({ seconds: 8 * 24 * 3600 });

    // Insérer 2 anciennes publications datant de plus de 7 jours
    const oldPub1Id = randomUUID();
    await db.orm.public.Publication.create({
      id: oldPub1Id,
      professionnel_id: proId,
      titre: "Ancien circuit Sine Saloum",
      contenu: "Circuit d'il y a 10 jours.",
      statut: "APPROUVEE",
      date_creation: tenDaysAgo,
      date_publication: tenDaysAgo,
    });
    cleanupPubIds.push(oldPub1Id);

    const oldPub2Id = randomUUID();
    await db.orm.public.Publication.create({
      id: oldPub2Id,
      professionnel_id: proId,
      titre: "Ancien safari Bandia",
      contenu: "Safari d'il y a 8 jours.",
      statut: "APPROUVEE",
      date_creation: eightDaysAgo,
      date_publication: eightDaysAgo,
    });
    cleanupPubIds.push(oldPub2Id);

    // Nouvelle publication aujourd'hui -> doit être autorisée car les 2 précédentes sont hors fenêtre
    const newPub = await publicationsService.create(userId, {
      titre: "Nouveau voyage en Casamance",
      contenu: "Nouvelle offre postée après expiration de la fenêtre glissante de 7 jours.",
    });

    assert.ok(newPub.id);
    assert.equal(newPub.statut, "EN_ATTENTE");
    cleanupPubIds.push(newPub.id);
  });

  // ---------------------------------------------------------------------------
  // 5. Professionnel non vérifié → refusé
  // ---------------------------------------------------------------------------
  test("5. Professionnel non vérifié (EN_ATTENTE) → refusé avec 403", async () => {
    const { userId } = await createTestProfessional({
      verified: false, // Non vérifié
      hasActiveSubscription: true,
    });

    await assert.rejects(
      async () => {
        await publicationsService.create(userId, {
          titre: "Publication par pro non vérifié",
          contenu: "Ce contenu ne doit pas être créé.",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "FORBIDDEN");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Professionnel sans abonnement actif → refusé
  // ---------------------------------------------------------------------------
  test("6. Professionnel sans abonnement actif → refusé avec 403 SUBSCRIPTION_REQUIRED", async () => {
    const { userId } = await createTestProfessional({
      verified: true,
      hasActiveSubscription: false, // Pas d'abonnement actif
    });

    await assert.rejects(
      async () => {
        await publicationsService.create(userId, {
          titre: "Publication sans abonnement",
          contenu: "Ce contenu doit être refusé car aucun abonnement n'est actif.",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "SUBSCRIPTION_REQUIRED");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 7. Professionnel vérifié + abonnement actif + quota disponible → publication autorisée
  // ---------------------------------------------------------------------------
  test("7. Professionnel vérifié + abonnement actif + quota disponible → publication autorisée", async () => {
    const { userId } = await createTestProfessional({
      verified: true,
      hasActiveSubscription: true,
    });

    const pub = await publicationsService.create(userId, {
      titre: "Séjour aux Almadies",
      contenu: "Hébergement les pieds dans l'eau avec vue panoramique sur l'océan.",
    });

    assert.ok(pub.id);
    assert.equal(pub.statut, "EN_ATTENTE");
    cleanupPubIds.push(pub.id);
  });

  // ---------------------------------------------------------------------------
  // 8. Règle d'auteur : un professionnel ne peut pas modifier la publication d'un autre
  // ---------------------------------------------------------------------------
  test("8. Un professionnel ne peut pas modifier la publication d'un autre professionnel", async () => {
    const proA = await createTestProfessional({ verified: true, hasActiveSubscription: true });
    const proB = await createTestProfessional({ verified: true, hasActiveSubscription: true });

    // Pro A crée sa publication
    const pubA = await publicationsService.create(proA.userId, {
      titre: "Publication Auteur Original",
      contenu: "Contenu original rédigé par Pro A.",
    });
    cleanupPubIds.push(pubA.id);

    // Pro B tente de modifier la publication de Pro A -> 403 FORBIDDEN
    await assert.rejects(
      async () => {
        await publicationsService.update(pubA.id, proB.userId, {
          titre: "Titre piraté par Pro B",
          contenu: "Tentative d'altération frauduleuse.",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "FORBIDDEN");
        return true;
      }
    );

    // Pro B tente de supprimer la publication de Pro A -> 403 FORBIDDEN
    await assert.rejects(
      async () => {
        await publicationsService.delete(pubA.id, proB.userId);
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "FORBIDDEN");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 9. Modification autorisée par l'auteur & remise en modération (EN_ATTENTE)
  // ---------------------------------------------------------------------------
  test("9. Modification par l'auteur d'une publication (y compris rejetée) la remet en modération (EN_ATTENTE)", async () => {
    const pro = await createTestProfessional({ verified: true, hasActiveSubscription: true });

    const pub = await publicationsService.create(pro.userId, {
      titre: "Offre Initiale",
      contenu: "Contenu initial qui sera rejeté lors de la modération.",
    });
    cleanupPubIds.push(pub.id);

    // Simuler un rejet par la modération
    await db.orm.public.Publication
      .where({ id: pub.id })
      .update({ statut: "REFUSEE" });

    // Le professionnel corrige sa publication rejetée
    const updated = await publicationsService.update(pub.id, pro.userId, {
      titre: "Offre Corrigée et Conforme",
      contenu: "Nouveau contenu respectant scrupuleusement la charte de voyage.",
    });

    assert.equal(updated.titre, "Offre Corrigée et Conforme");
    assert.equal(updated.contenu, "Nouveau contenu respectant scrupuleusement la charte de voyage.");
    // Remise automatique dans le workflow de modération
    assert.equal(updated.statut, "EN_ATTENTE");
    assert.equal(updated.date_publication, null);
  });

  // ---------------------------------------------------------------------------
  // 10. Suppression par l'auteur autorisée
  // ---------------------------------------------------------------------------
  test("10. Suppression de publication par son auteur autorisée", async () => {
    const pro = await createTestProfessional({ verified: true, hasActiveSubscription: true });

    const pub = await publicationsService.create(pro.userId, {
      titre: "Publication Éphémère",
      contenu: "Cette publication sera supprimée par son créateur.",
    });

    // Suppression par l'auteur
    const deleteRes = await publicationsService.delete(pub.id, pro.userId);
    assert.equal(deleteRes.success, true);

    // Vérifier que la publication n'existe plus
    const inDb = await db.orm.public.Publication.where({ id: pub.id }).first();
    assert.equal(inDb, null);
  });
});
