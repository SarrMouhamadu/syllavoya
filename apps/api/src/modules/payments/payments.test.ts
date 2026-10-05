import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto, { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { paymentsService } from "./payments.service.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";
import { AppError } from "../../errors/AppError.js";

describe("Architecture Paiements : NabooPay (Wave/OM) & Bictorys (Carte)", () => {
  let testUserId: string;
  let testFormuleId: string;
  const createdAbonnementIds: string[] = [];
  const createdPaiementIds: string[] = [];

  before(async () => {
    // 1. Récupérer ou créer un utilisateur de test
    let user = await db.orm.public.Utilisateur.where({ email: "test.payments@syllavoyage.com" }).first();
    if (!user) {
      testUserId = randomUUID();
      user = await db.orm.public.Utilisateur.create({
        id: testUserId,
        nom: "Paiement",
        prenom: "Testeur",
        email: "test.payments@syllavoyage.com",
        mot_de_passe: "hashed_dummy_password",
        role: "VOYAGEUR",
        statut: "ACTIF",
      });
    } else {
      testUserId = user.id;
    }

    // 2. Récupérer une formule existante
    const formule = await db.orm.public.FormuleAbonnement.first();
    if (!formule) {
      testFormuleId = randomUUID();
      await db.orm.public.FormuleAbonnement.create({
        id: testFormuleId,
        nom: "Formule Test",
        duree: "MENSUEL",
        prix: 5000,
        type_utilisateur: "VOYAGEUR",
        statut: "ACTIF",
      });
    } else {
      testFormuleId = formule.id;
    }
  });

  after(async () => {
    // Nettoyage des données créées pendant le test
    for (const pid of createdPaiementIds) {
      try {
        await db.orm.public.Paiement.where({ id: pid }).delete();
      } catch {}
    }
    for (const aid of createdAbonnementIds) {
      try {
        await db.orm.public.Abonnement.where({ id: aid }).delete();
      } catch {}
    }
    try {
      await db.orm.public.Utilisateur.where({ email: "test.payments@syllavoyage.com" }).delete();
    } catch {}

    setTimeout(() => {
      process.exit(0);
    }, 100);
  });

  // Helper pour créer un abonnement de test
  async function createTestSubscription() {
    const subId = randomUUID();
    const now = Temporal.Now.instant();
    const dateFin = now.add({ seconds: 30 * 24 * 3600 });

    const sub = await db.orm.public.Abonnement.create({
      id: subId,
      utilisateur_id: testUserId,
      formule_id: testFormuleId,
      date_debut: now,
      date_fin: dateFin,
      statut: "EN_ATTENTE",
    });

    createdAbonnementIds.push(sub.id);
    return sub;
  }

  // =========================================================================
  // 1. INITIATION MULTI-PROVIDER
  // =========================================================================
  test("NabooPay : initiation d'un paiement Mobile Money (Wave / Orange Money)", async () => {
    const sub = await createTestSubscription();

    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "NABOOPAY",
    });

    createdPaiementIds.push(payment.id);

    assert.equal(payment.moyen_paiement, "NABOOPAY");
    assert.equal(payment.statut, "EN_ATTENTE");
    assert.match(payment.reference, /^ord_/);
    assert.ok(payment.checkout_url?.includes("checkout.naboopay.com"));
  });

  test("Bictorys : initiation d'un paiement Carte Bancaire (Visa / Mastercard)", async () => {
    const sub = await createTestSubscription();

    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "BICTORYS",
    });

    createdPaiementIds.push(payment.id);

    assert.equal(payment.moyen_paiement, "BICTORYS");
    assert.equal(payment.statut, "EN_ATTENTE");
    assert.match(payment.reference, /^bic_/);
    assert.ok(payment.checkout_url?.includes("checkout.bictorys.com"));
  });

  // =========================================================================
  // 2. WORKFLOW COMMUN ET STRICTEMENT IDEMPOTENT
  // =========================================================================
  test("Workflow commun : confirmation réussie et activation de l'abonnement", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "NABOOPAY",
    });
    createdPaiementIds.push(payment.id);

    // 1ère confirmation
    const result = await paymentsService.confirmPaymentAndActivate({
      reference: payment.reference,
      confirmedMontant: 5000,
      moyenPaiement: "NABOOPAY_WAVE",
      provider: "NABOOPAY",
    });

    assert.equal(result.processed, true);
    assert.equal(result.payment_status, "CONFIRME");
    assert.equal(result.subscription_status, "ACTIF");

    // Vérification en base de données
    const updatedPayment = await db.orm.public.Paiement.where({ id: payment.id }).first();
    assert.equal(updatedPayment?.statut, "CONFIRME");
    assert.equal(updatedPayment?.moyen_paiement, "NABOOPAY_WAVE");
    assert.ok(updatedPayment?.date_confirmation !== null);

    const updatedSub = await db.orm.public.Abonnement.where({ id: sub.id }).first();
    assert.equal(updatedSub?.statut, "ACTIF");

    // 2ème confirmation identique -> Idempotence stricte
    const replayResult = await paymentsService.confirmPaymentAndActivate({
      reference: payment.reference,
      confirmedMontant: 5000,
      moyenPaiement: "NABOOPAY_WAVE",
      provider: "NABOOPAY",
    });

    assert.equal(replayResult.status, "already_processed");
    assert.equal(replayResult.processed, false);
    assert.equal(replayResult.payment_status, "CONFIRME");
  });

  test("Workflow commun : échec du paiement et passage à ECHOUE", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "BICTORYS",
    });
    createdPaiementIds.push(payment.id);

    const result = await paymentsService.failPayment({ reference: payment.reference });

    assert.equal(result.processed, true);
    assert.equal(result.payment_status, "ECHOUE");
    assert.equal(result.subscription_status, "ECHOUE");

    const updatedPayment = await db.orm.public.Paiement.where({ id: payment.id }).first();
    assert.equal(updatedPayment?.statut, "ECHOUE");

    const updatedSub = await db.orm.public.Abonnement.where({ id: sub.id }).first();
    assert.equal(updatedSub?.statut, "ECHOUE");
  });

  test("Workflow commun : référence inexistante renvoie une erreur 404", async () => {
    await assert.rejects(
      async () => {
        await paymentsService.confirmPaymentAndActivate({
          reference: "reference_totalement_inconnue_xyz",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 404);
        assert.equal(err.code, "PAYMENT_NOT_FOUND");
        return true;
      }
    );
  });

  // =========================================================================
  // 3. WEBHOOK NABOOPAY (Wave / Orange Money)
  // =========================================================================
  test("Webhook NabooPay : traitement valide avec signature HMAC et idempotence", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "NABOOPAY",
    });
    createdPaiementIds.push(payment.id);

    const payload = {
      order_id: payment.reference,
      amount: 5000,
      transaction_status: "paid",
      selected_payment_method: "orange_money",
    };

    const rawBodyBuffer = Buffer.from(JSON.stringify(payload));
    const hmac = crypto.createHmac("sha256", config.naboopayWebhookSecret);
    const signature = `sha256=${hmac.update(rawBodyBuffer).digest("hex")}`;

    // 1. Premier passage du webhook
    const webhookResult = await paymentsService.handleNabooWebhook(payload, signature, rawBodyBuffer);
    assert.equal(webhookResult.processed, true);
    assert.equal(webhookResult.payment_status, "CONFIRME");
    assert.equal(webhookResult.subscription_status, "ACTIF");

    const checkPaiement = await db.orm.public.Paiement.where({ id: payment.id }).first();
    assert.equal(checkPaiement?.statut, "CONFIRME");
    assert.equal(checkPaiement?.moyen_paiement, "NABOOPAY_ORANGE_MONEY");

    // 2. Deuxième passage (rediffusion / retry NabooPay) -> Idempotent
    const replayWebhook = await paymentsService.handleNabooWebhook(payload, signature, rawBodyBuffer);
    assert.equal(replayWebhook.status, "already_processed");
    assert.equal(replayWebhook.processed, false);
  });

  test("Webhook NabooPay : rejet si signature HMAC invalide", async () => {
    const payload = {
      order_id: "ord_dummy_fake",
      transaction_status: "paid",
    };

    await assert.rejects(
      async () => {
        await paymentsService.handleNabooWebhook(payload, "sha256=fausse_signature_corrompue");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, "INVALID_SIGNATURE");
        return true;
      }
    );
  });

  // =========================================================================
  // 4. WEBHOOK BICTORYS (Visa / Mastercard)
  // =========================================================================
  test("Webhook Bictorys : traitement officiel avec en-tête X-Secret-Key et paymentReference", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 20000,
      formuleNom: "Professionnel Mensuel",
      provider: "BICTORYS",
    });
    createdPaiementIds.push(payment.id);

    // Payload conforme Bictorys avec paymentReference
    const payload = {
      event: "charge.success",
      data: {
        paymentReference: payment.reference,
        amount: 20000,
        status: "paid",
        card_brand: "mastercard",
        currency: "XOF",
      },
    };

    // Authentification officielle Bictorys via X-Secret-Key
    const secretKeyHeader = config.bictorysWebhookSecret;

    // 1. Premier passage du webhook Bictorys
    const webhookResult = await paymentsService.handleBictorysWebhook(payload, secretKeyHeader);
    assert.equal(webhookResult.processed, true);
    assert.equal(webhookResult.payment_status, "CONFIRME");
    assert.equal(webhookResult.subscription_status, "ACTIF");

    const checkPaiement = await db.orm.public.Paiement.where({ id: payment.id }).first();
    assert.equal(checkPaiement?.statut, "CONFIRME");
    assert.equal(checkPaiement?.moyen_paiement, "BICTORYS_MASTERCARD");

    // 2. Deuxième passage (rediffusion / retry Bictorys) -> Idempotent
    const replayWebhook = await paymentsService.handleBictorysWebhook(payload, secretKeyHeader);
    assert.equal(replayWebhook.status, "already_processed");
    assert.equal(replayWebhook.processed, false);
  });

  test("Webhook Bictorys : traitement valide avec signature HMAC SHA-256", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "BICTORYS",
    });
    createdPaiementIds.push(payment.id);

    const payload = {
      event: "charge.success",
      data: {
        reference: payment.reference,
        amount: 5000,
        status: "paid",
        card_brand: "visa",
        currency: "XOF",
      },
    };

    const rawBodyBuffer = Buffer.from(JSON.stringify(payload));
    const hmac = crypto.createHmac("sha256", config.bictorysWebhookSecret);
    const signature = `sha256=${hmac.update(rawBodyBuffer).digest("hex")}`;

    const webhookResult = await paymentsService.handleBictorysWebhook(payload, signature, rawBodyBuffer);
    assert.equal(webhookResult.processed, true);
    assert.equal(webhookResult.payment_status, "CONFIRME");
    assert.equal(webhookResult.subscription_status, "ACTIF");
  });

  test("Webhook Bictorys : rejet si en-tête X-Secret-Key manquant", async () => {
    const payload = {
      event: "charge.success",
      data: {
        reference: "bic_dummy_missing_header",
        status: "paid",
      },
    };

    await assert.rejects(
      async () => {
        await paymentsService.handleBictorysWebhook(payload, undefined);
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, "MISSING_SIGNATURE");
        return true;
      }
    );
  });

  test("Webhook Bictorys : rejet si secret ou signature invalide", async () => {
    const payload = {
      event: "charge.success",
      data: {
        reference: "bic_dummy_fake",
        status: "paid",
      },
    };

    await assert.rejects(
      async () => {
        await paymentsService.handleBictorysWebhook(payload, "invalid_secret_key_12345");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, "INVALID_SIGNATURE");
        return true;
      }
    );
  });

  // =========================================================================
  // 5. INTÉGRATION ABONNEMENT ET FRAIS TRANSPARENTS
  // =========================================================================
  test("SubscriptionsService : création d'abonnement avec choix Bictorys (Carte)", async () => {
    const result = await subscriptionsService.createSubscription(testUserId, testFormuleId, "BICTORYS");
    createdAbonnementIds.push(result.subscription.id);
    createdPaiementIds.push(result.payment.id);

    assert.equal(result.provider, "BICTORYS");
    assert.equal(result.payment.moyen_paiement, "BICTORYS");
    assert.equal(result.payment.statut, "EN_ATTENTE");
    assert.equal(result.subscription.statut, "EN_ATTENTE");
    assert.ok(result.checkout_url?.includes("checkout.bictorys.com"));
    assert.equal(result.breakdown.frais_a_la_charge_du_client, true);
    assert.ok(result.breakdown.frais_operateur > 0);
  });
});
