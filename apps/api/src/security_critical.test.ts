import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "./db.js";
import { authService } from "./modules/auth/auth.service.js";
import { loginRateLimiter } from "./modules/auth/login-rate-limiter.js";
import { validateAndNormalizeSenegalPhone } from "./utils/phone.js";
import { conversationsService } from "./modules/conversations/conversations.service.js";
import { publicationsService } from "./modules/publications/publications.service.js";
import { AppError } from "./errors/AppError.js";

describe("Étape 1 : Sécurité et contrôle d'accès critiques", () => {
  const cleanupUserIds: string[] = [];
  const cleanupProIds: string[] = [];
  const cleanupSubIds: string[] = [];
  const cleanupPubIds: string[] = [];
  const cleanupConvIds: string[] = [];

  after(async () => {
    // Nettoyage complet
    for (const pubId of cleanupPubIds) {
      try {
        await db.orm.public.Publication.where({ id: pubId }).delete();
      } catch {}
    }
    for (const convId of cleanupConvIds) {
      try {
        await db.orm.public.Message.where({ conversation_id: convId }).delete();
        await db.orm.public.Conversation.where({ id: convId }).delete();
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

  // ---------------------------------------------------------------------------
  // 1. Rate limiting login
  // ---------------------------------------------------------------------------
  test("1. Rate limiting login : max 5 tentatives échouées par IP/email sur 15 min, puis 429", async () => {
    const testIp = "192.168.1.100";
    const testEmail = `test.ratelimit.${Date.now()}@syllavoyage.com`;
    const password = "correct_password123";

    // Créer un utilisateur légitime
    const reg = await authService.register({
      nom: "Limit",
      prenom: "Test",
      email: testEmail,
      mot_de_passe: password,
      telephone: "+221 77 111 22 33",
    });
    cleanupUserIds.push(reg.user.id);

    // Réinitialiser le limiter pour cet IP/email au départ
    loginRateLimiter.reset(testIp, testEmail);

    // 5 tentatives consécutives avec mot de passe erroné -> doivent échouer avec 401 (INVALID_CREDENTIALS)
    for (let i = 1; i <= 5; i++) {
      await assert.rejects(
        async () => {
          await authService.login(
            { email: testEmail, mot_de_passe: "wrong_password" },
            testIp
          );
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 401, `Tentative ${i} doit retourner 401`);
          assert.strictEqual(err.code, "INVALID_CREDENTIALS");
          return true;
        }
      );
    }

    // 6ème tentative (dépassement du quota de 5 échecs) -> doit renvoyer 429 TOO_MANY_REQUESTS
    await assert.rejects(
      async () => {
        await authService.login(
          { email: testEmail, mot_de_passe: password }, // même avec le bon mot de passe, l'accès est bloqué
          testIp
        );
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 429, "Après 5 échecs, la tentative suivante doit retourner 429");
        assert.strictEqual(err.code, "TOO_MANY_REQUESTS");
        assert.match(err.message, /Trop de tentatives/);
        return true;
      }
    );

    // Réinitialiser le limiter (ou attendre la fin de la fenêtre) et tester un login valide
    loginRateLimiter.reset(testIp, testEmail);
    const validLogin = await authService.login(
      { email: testEmail, mot_de_passe: password },
      testIp
    );
    assert.ok(validLogin.token);
    assert.strictEqual(validLogin.user.email, testEmail.toLowerCase());
  });

  // ---------------------------------------------------------------------------
  // 2. Téléphone sénégalais : obligatoire, validation et normalisation
  // ---------------------------------------------------------------------------
  test("2. Téléphone : rejet des formats invalides et normalisation E.164 (+221...)", async () => {
    // Formats manifestement invalides
    const invalidPhones = [
      "",
      "   ",
      "abcdef",
      "12345",
      "+33612345678", // format français, non sénégalais
      "123456789", // 9 chiffres mais préfixe non sénégalais
      "77 123 45", // trop court
      "77 123 45 67 89", // trop long
    ];

    for (const badPhone of invalidPhones) {
      assert.throws(
        () => validateAndNormalizeSenegalPhone(badPhone),
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, "INVALID_PHONE");
          return true;
        },
        `Le numéro '${badPhone}' aurait dû être rejeté`
      );
    }

    // Rejet lors de l'inscription si téléphone invalide ou manquant
    await assert.rejects(
      async () => {
        await authService.register({
          nom: "Test",
          prenom: "Phone",
          email: `badphone.${Date.now()}@syllavoyage.com`,
          mot_de_passe: "password123",
          telephone: "0102030405", // invalide
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, "INVALID_PHONE");
        return true;
      }
    );

    // Formats sénégalais valides avec normalisation vers +221XXXXXXXXX
    const validInputs = [
      { input: "+221 77 123 45 67", expected: "+221771234567" },
      { input: "00221 78 987 65 43", expected: "+221789876543" },
      { input: "76 555 44 33", expected: "+221765554433" },
      { input: "70.111.22.33", expected: "+221701112233" },
      { input: "33-821-22-23", expected: "+221338212223" },
    ];

    for (const item of validInputs) {
      const normalized = validateAndNormalizeSenegalPhone(item.input);
      assert.strictEqual(normalized, item.expected);
    }

    // Inscription avec numéro sénégalais valide -> doit stocker le format normalisé
    const validEmail = `validphone.${Date.now()}@syllavoyage.com`;
    const registered = await authService.register({
      nom: "Sow",
      prenom: "Aminata",
      email: validEmail,
      mot_de_passe: "password123",
      telephone: "77 800 12 34",
    });
    cleanupUserIds.push(registered.user.id);

    assert.strictEqual(registered.user.telephone, "+221778001234");
  });

  // ---------------------------------------------------------------------------
  // 3. Voyageur sans abonnement : accès refusé aux fonctionnalités réservées
  // ---------------------------------------------------------------------------
  test("3. Voyageur sans abonnement : rejet de la prise de contact avec 403 SUBSCRIPTION_REQUIRED", async () => {
    // Créer un voyageur sans abonnement
    const voyageurId = randomUUID();
    await db.orm.public.Utilisateur.create({
      id: voyageurId,
      nom: "Voyageur",
      prenom: "SansAbonnement",
      email: `voyageur.no.sub.${Date.now()}@syllavoyage.com`,
      telephone: "+221771230001",
      mot_de_passe: "hashed",
      role: "VOYAGEUR",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });
    cleanupUserIds.push(voyageurId);

    // Créer un professionnel vérifié
    const proUserId = randomUUID();
    await db.orm.public.Utilisateur.create({
      id: proUserId,
      nom: "Agence",
      prenom: "Pro",
      email: `pro.${Date.now()}@syllavoyage.com`,
      telephone: "+221781230002",
      mot_de_passe: "hashed",
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });
    cleanupUserIds.push(proUserId);

    const proId = randomUUID();
    await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: proUserId,
      nom_structure: "Dakar Travel Tours",
      statut_verification: "VERIFIE",
      created_at: Temporal.Now.instant(),
    });
    cleanupProIds.push(proId);

    // Tentative d'initiation de conversation par le voyageur sans abonnement -> 403 SUBSCRIPTION_REQUIRED
    await assert.rejects(
      async () => {
        await conversationsService.createConversation(voyageurId, "VOYAGEUR", {
          professionnel_id: proId,
          premier_message: "Bonjour, je souhaite un devis.",
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "SUBSCRIPTION_REQUIRED");
        assert.match(err.message, /abonnement voyageur actif/i);
        return true;
      }
    );

    // Créer une formule et activer un abonnement pour ce voyageur
    let formule = await db.orm.public.FormuleAbonnement.first();
    if (!formule) {
      const fId = randomUUID();
      formule = await db.orm.public.FormuleAbonnement.create({
        id: fId,
        nom: "Voyageur Mensuel",
        duree: "MENSUEL",
        prix: 5000,
        type_utilisateur: "VOYAGEUR",
        statut: "ACTIF",
      });
    }

    const subId = randomUUID();
    const now = Temporal.Now.instant();
    await db.orm.public.Abonnement.create({
      id: subId,
      utilisateur_id: voyageurId,
      formule_id: formule.id,
      date_debut: now,
      date_fin: now.add({ seconds: 30 * 24 * 3600 }),
      statut: "ACTIF",
    });
    cleanupSubIds.push(subId);

    // Maintenant qu'il a un abonnement actif, la conversation peut être initiée avec succès
    const result = await conversationsService.createConversation(voyageurId, "VOYAGEUR", {
      professionnel_id: proId,
      premier_message: "Bonjour, j'ai maintenant un abonnement actif.",
    });
    assert.ok(result.conversation.id);
    cleanupConvIds.push(result.conversation.id);
  });

  // ---------------------------------------------------------------------------
  // 4. Professionnel sans abonnement : rejet de la publication avec 403 SUBSCRIPTION_REQUIRED
  // ---------------------------------------------------------------------------
  test("4. Professionnel sans abonnement : rejet de la publication avec 403 SUBSCRIPTION_REQUIRED", async () => {
    // Créer un utilisateur professionnel
    const proUserId = randomUUID();
    await db.orm.public.Utilisateur.create({
      id: proUserId,
      nom: "Guide",
      prenom: "Moussa",
      email: `moussa.guide.${Date.now()}@syllavoyage.com`,
      telephone: "+221774445566",
      mot_de_passe: "hashed",
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });
    cleanupUserIds.push(proUserId);

    // Structure vérifiée mais SANS abonnement actif
    const proId = randomUUID();
    await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: proUserId,
      nom_structure: "Sine Saloum Excursions",
      statut_verification: "VERIFIE",
      created_at: Temporal.Now.instant(),
    });
    cleanupProIds.push(proId);

    // Tentative de publication -> 403 SUBSCRIPTION_REQUIRED
    await assert.rejects(
      async () => {
        await publicationsService.create(proUserId, {
          titre: "Excursion Delta du Saloum",
          contenu: "Découvrez la faune et la flore du Sine Saloum en pirogue traditionnelle.",
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "SUBSCRIPTION_REQUIRED");
        assert.match(err.message, /abonnement professionnel actif/i);
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Quota 7 jours : max 1 publication par semaine
  // ---------------------------------------------------------------------------
  test("5. Quota 7 jours : rejet de la seconde publication avec 403 WEEKLY_QUOTA_EXCEEDED", async () => {
    const proUserId = randomUUID();
    await db.orm.public.Utilisateur.create({
      id: proUserId,
      nom: "Agence",
      prenom: "Teranga",
      email: `teranga.${Date.now()}@syllavoyage.com`,
      telephone: "+221773334455",
      mot_de_passe: "hashed",
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });
    cleanupUserIds.push(proUserId);

    const proId = randomUUID();
    await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: proUserId,
      nom_structure: "Teranga Safaris",
      statut_verification: "VERIFIE",
      created_at: Temporal.Now.instant(),
    });
    cleanupProIds.push(proId);

    // Donner un abonnement professionnel actif
    let formulePro = await db.orm.public.FormuleAbonnement.where({ type_utilisateur: "PROFESSIONNEL" }).first();
    if (!formulePro) {
      formulePro = await db.orm.public.FormuleAbonnement.create({
        id: randomUUID(),
        nom: "Pro Mensuel",
        duree: "MENSUEL",
        prix: 20000,
        type_utilisateur: "PROFESSIONNEL",
        statut: "ACTIF",
      });
    }

    const subId = randomUUID();
    const now = Temporal.Now.instant();
    await db.orm.public.Abonnement.create({
      id: subId,
      utilisateur_id: proUserId,
      formule_id: formulePro.id,
      date_debut: now,
      date_fin: now.add({ seconds: 30 * 24 * 3600 }),
      statut: "ACTIF",
    });
    cleanupSubIds.push(subId);

    // 1ère publication -> doit réussir
    const pub1 = await publicationsService.create(proUserId, {
      titre: "Safari Bandia Première Édition",
      contenu: "Rejoignez notre safari exclusif dans la réserve de Bandia ce week-end.",
    });
    assert.ok(pub1.id);
    assert.strictEqual(pub1.statut, "EN_ATTENTE");
    cleanupPubIds.push(pub1.id);

    // 2ème publication dans les 7 jours -> doit également réussir (règle des 2 publications max)
    const pub2 = await publicationsService.create(proUserId, {
      titre: "Safari Bandia Deuxième Édition",
      contenu: "Seconde session safari disponible pour le week-end prochain.",
    });
    assert.ok(pub2.id);
    assert.strictEqual(pub2.statut, "EN_ATTENTE");
    cleanupPubIds.push(pub2.id);

    // 3ème publication immédiate (dans la même fenêtre glissante de 7 jours) -> rejet 403 WEEKLY_QUOTA_EXCEEDED
    await assert.rejects(
      async () => {
        await publicationsService.create(proUserId, {
          titre: "Troisième Safari trop tôt",
          contenu: "Cette publication doit être rejetée car la limite de 2 publications sur 7 jours est atteinte.",
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "WEEKLY_QUOTA_EXCEEDED");
        assert.match(err.message, /7 derniers jours/i);
        return true;
      }
    );
  });
});
