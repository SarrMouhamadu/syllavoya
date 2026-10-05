import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto, { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { paymentsService } from "./payments.service.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";
import { AppError } from "../../errors/AppError.js";

describe("Architecture Paiements : NabooPay exclusivement (Mobile Money Wave & OM)", () => {
  let testUserId: string;
  let testFormuleId: string;
  const createdAbonnementIds: string[] = [];
  const createdPaiementIds: string[] = [];

  const originalFetch = globalThis.fetch;

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
        telephone: "+221770000000",
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

    // Mocker fetch de manière déterministe pour éviter d'appeler l'API de prod sans accord explicite
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : input.toString();

      if (urlStr.includes("api.naboopay.com/api/v2/transactions")) {
        const authHeader = (init?.headers as Record<string, string>)?.[
          "Authorization"
        ] || (init?.headers as Record<string, string>)?.[
          "authorization"
        ];

        // Vérification de l'utilisation correcte de NABOOPAY_API_KEY
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.length < 15) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }

        const simulatedOrderId = `naboo_ord_${Date.now()}_${randomUUID().slice(0, 8)}`;
        return new Response(
          JSON.stringify({
            order_id: simulatedOrderId,
            checkout_url: `https://checkout.naboopay.com/checkout/${simulatedOrderId}`,
            amount: 5000,
            currency: "XOF",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };
  });

  after(async () => {
    // Restaurer le fetch original
    globalThis.fetch = originalFetch;

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
  // 1. INITIATION MULTI-PROVIDER & RÈGLE ZERO-FALLBACK
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
    assert.ok(payment.reference.length > 5);
    assert.ok(payment.checkout_url?.includes("checkout.naboopay.com"));
  });

  test("Règle 8 : aucun fallback vers un faux checkout lorsque la passerelle NabooPay échoue", async () => {
    const sub = await createTestSubscription();

    const prevFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ message: "Erreur interne NabooPay" }), { status: 500 });
    };

    try {
      await assert.rejects(
        async () => {
          await paymentsService.createPayment({
            userId: testUserId,
            abonnementId: sub.id,
            montant: 5000,
            formuleNom: "Voyageur Mensuel",
            provider: "NABOOPAY",
          });
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 502);
          assert.equal(err.code, "PAYMENT_GATEWAY_ERROR");
          return true;
        }
      );
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test("Exclusivité NabooPay : createPayment initialise toujours NabooPay pour Wave et Orange Money", async () => {
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
    assert.ok(payment.reference.length > 5);
    assert.ok(payment.checkout_url?.includes("checkout.naboopay.com"));
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
      provider: "NABOOPAY",
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
  // 3. EXPIRATION DES PAIEMENTS EN ATTENTE > 48 HEURES (RÈGLE 10)
  // =========================================================================
  test("Règle 10 : expiration automatique d'un paiement en attente > 48h et rejet de confirmation", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "NABOOPAY",
    });
    createdPaiementIds.push(payment.id);

    // Simuler une date de création 50 heures dans le passé
    const pastCreation = Temporal.Now.instant().subtract({ seconds: 50 * 3600 });
    await db.orm.public.Paiement
      .where({ id: payment.id })
      .update({ date_creation: pastCreation });

    // 1. isPaymentExpired doit retourner true
    const expiredCheck = paymentsService.isPaymentExpired(pastCreation);
    assert.equal(expiredCheck, true);

    // 2. getPaymentById doit mettre à jour le statut en EXPIRE
    const fetched = await paymentsService.getPaymentById(payment.id, testUserId);
    assert.equal(fetched.statut, "EXPIRE");

    // 3. confirmPaymentAndActivate doit rejeter un paiement expiré
    await assert.rejects(
      async () => {
        await paymentsService.confirmPaymentAndActivate({
          reference: payment.reference,
          confirmedMontant: 5000,
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "PAYMENT_EXPIRED");
        return true;
      }
    );

    // 4. L'abonnement ne doit pas être activé
    const subInDb = await db.orm.public.Abonnement.where({ id: sub.id }).first();
    assert.notEqual(subInDb?.statut, "ACTIF");
    assert.equal(subInDb?.statut, "EXPIRE");
  });

  test("Règle 10 : expirePendingPayments traite par lot les paiements expirés", async () => {
    const sub = await createTestSubscription();
    const payment = await paymentsService.createPayment({
      userId: testUserId,
      abonnementId: sub.id,
      montant: 5000,
      formuleNom: "Voyageur Mensuel",
      provider: "NABOOPAY",
    });
    createdPaiementIds.push(payment.id);

    const pastCreation = Temporal.Now.instant().subtract({ seconds: 52 * 3600 });
    await db.orm.public.Paiement
      .where({ id: payment.id })
      .update({ date_creation: pastCreation });

    const batchResult = await paymentsService.expirePendingPayments();
    assert.ok(batchResult.expiredCount >= 1);
    assert.ok(batchResult.expiredIds.includes(payment.id));

    const checkPaiement = await db.orm.public.Paiement.where({ id: payment.id }).first();
    assert.equal(checkPaiement?.statut, "EXPIRE");
  });

  // =========================================================================
  // 4. WEBHOOK NABOOPAY (Wave / Orange Money)
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

  test("Webhook NabooPay : traitement valide avec secret direct dans l'en-tête", async () => {
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
      selected_payment_method: "wave",
    };

    // Transmission du secret direct
    const directSecretHeader = config.naboopayWebhookSecret;

    const webhookResult = await paymentsService.handleNabooWebhook(payload, directSecretHeader);
    assert.equal(webhookResult.processed, true);
    assert.equal(webhookResult.payment_status, "CONFIRME");
    assert.equal(webhookResult.subscription_status, "ACTIF");
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
  // 5. INTÉGRATION ABONNEMENT ET FRAIS TRANSPARENTS NABOOPAY
  // =========================================================================
  test("SubscriptionsService : création d'abonnement avec NabooPay exclusivement", async () => {
    const result = await subscriptionsService.createSubscription(testUserId, testFormuleId, "NABOOPAY");
    createdAbonnementIds.push(result.subscription.id);
    createdPaiementIds.push(result.payment.id);

    assert.equal(result.provider, "NABOOPAY");
    assert.equal(result.payment.moyen_paiement, "NABOOPAY");
    assert.equal(result.canal, "MOBILE_MONEY (Wave/Orange Money)");
    assert.equal(result.payment.statut, "EN_ATTENTE");
    assert.equal(result.subscription.statut, "EN_ATTENTE");
    assert.ok(result.checkout_url?.includes("checkout.naboopay.com"));
    assert.equal(result.breakdown.frais_a_la_charge_du_client, true);
    assert.ok(result.breakdown.frais_operateur > 0);
  });
});

