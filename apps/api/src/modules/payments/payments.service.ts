import crypto, { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";

export type PaymentProvider = "NABOOPAY" | "BICTORYS";

export interface CreatePaymentParams {
  userId: string;
  abonnementId: string;
  montant: number;
  formuleNom: string;
  provider?: PaymentProvider;
  userEmail?: string;
  userNom?: string;
  userPrenom?: string;
  userTelephone?: string | null;
}

export interface PaymentResponse {
  id: string;
  abonnement_id: string;
  reference: string;
  montant: number;
  statut: string;
  moyen_paiement: string;
  date_creation: string;
  date_confirmation: string | null;
  checkout_url?: string;
}

export interface ConfirmPaymentOptions {
  reference: string;
  confirmedMontant?: number;
  moyenPaiement?: string;
  provider?: PaymentProvider;
}

export interface FailPaymentOptions {
  reference: string;
  reason?: string;
}

export class PaymentsService {
  private formatPayment(p: {
    id: string;
    abonnement_id: string;
    reference: string;
    montant: number;
    statut: string;
    moyen_paiement: string;
    date_creation: { toString(): string } | string | Date;
    date_confirmation: { toString(): string } | string | Date | null;
  }, checkoutUrl?: string): PaymentResponse {
    return {
      id: p.id,
      abonnement_id: p.abonnement_id,
      reference: p.reference,
      montant: p.montant,
      statut: p.statut,
      moyen_paiement: p.moyen_paiement,
      date_creation: typeof p.date_creation === "string" ? p.date_creation : p.date_creation.toString(),
      date_confirmation: p.date_confirmation ? p.date_confirmation.toString() : null,
      ...(checkoutUrl ? { checkout_url: checkoutUrl } : {}),
    };
  }

  // =========================================================================
  // WORKFLOW COMMUN ET STRICTEMENT IDEMPOTENT DE CONFIRMATION / ACTIVATION
  // =========================================================================
  async confirmPaymentAndActivate(options: ConfirmPaymentOptions): Promise<any> {
    const { reference, confirmedMontant, moyenPaiement } = options;

    // 1. Recherche du paiement par sa référence unique
    const payment = await db.orm.public.Paiement
      .where({ reference })
      .first();

    if (!payment) {
      throw new AppError(`Aucun paiement trouvé pour la référence : ${reference}`, 404, "PAYMENT_NOT_FOUND");
    }

    // 2. VÉRIFICATION D'IDEMPOTENCE STRICTE
    // Si le paiement a déjà été confirmé, ignorer le retraitement et répondre immédiatement avec succès
    if (payment.statut === "CONFIRME") {
      return {
        status: "already_processed",
        processed: false,
        reference: payment.reference,
        payment_status: "CONFIRME",
        subscription_status: "ACTIF",
        message: "Paiement déjà confirmé précédemment. Idempotence préservée.",
      };
    }

    const now = Temporal.Now.instant();
    const finalMontant = typeof confirmedMontant === "number" ? confirmedMontant : payment.montant;
    const finalMoyen = moyenPaiement || payment.moyen_paiement;

    // 3. Mise à jour atomique de l'enregistrement Paiement
    await db.orm.public.Paiement
      .where({ id: payment.id })
      .update({
        statut: "CONFIRME",
        montant: finalMontant,
        moyen_paiement: finalMoyen,
        date_confirmation: now,
      });

    // 4. Activation de l'abonnement associé côté serveur
    const abonnement = await db.orm.public.Abonnement
      .where({ id: payment.abonnement_id })
      .first();

    if (abonnement) {
      const formule = await db.orm.public.FormuleAbonnement
        .where({ id: abonnement.formule_id })
        .first();

      const durationDays = formule?.duree === "ANNUEL" ? 365 : 30;
      const durationSeconds = durationDays * 24 * 3600;
      const dateFin = now.add({ seconds: durationSeconds });

      await db.orm.public.Abonnement
        .where({ id: abonnement.id })
        .update({
          statut: "ACTIF",
          date_debut: now,
          date_fin: dateFin,
        });
    }

    return {
      status: "received",
      processed: true,
      reference: payment.reference,
      payment_status: "CONFIRME",
      subscription_status: "ACTIF",
    };
  }

  // =========================================================================
  // WORKFLOW COMMUN D'ÉCHEC DE PAIEMENT
  // =========================================================================
  async failPayment(options: FailPaymentOptions): Promise<any> {
    const { reference } = options;

    const payment = await db.orm.public.Paiement
      .where({ reference })
      .first();

    if (!payment) {
      throw new AppError(`Aucun paiement trouvé pour la référence : ${reference}`, 404, "PAYMENT_NOT_FOUND");
    }

    // Si le paiement est déjà confirmé, on ne le rétrograde pas en échec
    if (payment.statut === "CONFIRME") {
      return {
        status: "already_processed",
        processed: false,
        reference: payment.reference,
        payment_status: "CONFIRME",
        message: "Paiement déjà confirmé précédemment. Idempotence préservée.",
      };
    }

    await db.orm.public.Paiement
      .where({ id: payment.id })
      .update({
        statut: "ECHOUE",
      });

    await db.orm.public.Abonnement
      .where({ id: payment.abonnement_id })
      .update({
        statut: "ECHOUE",
      });

    return {
      status: "received",
      processed: true,
      reference: payment.reference,
      payment_status: "ECHOUE",
      subscription_status: "ECHOUE",
    };
  }

  // =========================================================================
  // CRÉATION DE PAIEMENT MULTI-PROVIDER (NabooPay vs Bictorys)
  // =========================================================================
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const paymentId = randomUUID();
    const provider: PaymentProvider = params.provider === "BICTORYS" ? "BICTORYS" : "NABOOPAY";
    const now = Temporal.Now.instant();

    let orderId: string;
    let checkoutUrl: string;
    let moyenPaiementInitial: string;

    if (provider === "BICTORYS") {
      // -------------------------------------------------------------
      // BICTORYS = Carte bancaire (Visa / Mastercard)
      // -------------------------------------------------------------
      orderId = `bic_${Date.now()}_${randomUUID().slice(0, 8)}`;
      checkoutUrl = `https://checkout.bictorys.com/pay/${orderId}`;
      moyenPaiementInitial = "BICTORYS";

      if (config.bictorysApiKey && config.bictorysApiKey.trim()) {
        try {
          const response = await fetch(`${config.bictorysBaseUrl}/pay/v1/charges`, {
            method: "POST",
            headers: {
              "X-Api-Key": config.bictorysApiKey.trim(),
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              amount: params.montant,
              currency: "XOF",
              paymentReference: orderId,
              customer: {
                name: `${params.userPrenom || "Voyageur"} ${params.userNom || "Sylla"}`.trim(),
                email: params.userEmail || "client@syllavoyage.com",
                phone: params.userTelephone || "+221770000000",
                country: "SN",
                locale: "fr-FR",
              },
              orderDetails: [
                {
                  name: `Abonnement Sylla Voyage - ${params.formuleNom}`,
                  price: params.montant,
                  quantity: 1,
                },
              ],
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as any;
            if (data.paymentReference || data.reference || data.id || data.charge_id) {
              orderId = data.paymentReference || data.reference || data.id || data.charge_id;
            }
            // Support officiel de redirectUrl pour le Hosted Checkout
            if (data.redirectUrl || data.redirect_url || data.checkout_url || data.payment_url || data.url) {
              checkoutUrl = data.redirectUrl || data.redirect_url || data.checkout_url || data.payment_url || data.url;
            }
          }
        } catch {
          // Fallback hors-ligne / environnement de test
        }
      }
    } else {
      // -------------------------------------------------------------
      // NABOOPAY = Mobile Money (Wave / Orange Money)
      // -------------------------------------------------------------
      orderId = `ord_${Date.now()}_${randomUUID().slice(0, 8)}`;
      checkoutUrl = `https://checkout.naboopay.com/checkout/${orderId}`;
      moyenPaiementInitial = "NABOOPAY";

      if (config.naboopayApiKey && config.naboopayApiKey.trim()) {
        try {
          const response = await fetch(`${config.naboopayBaseUrl}/api/v2/transactions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.naboopayApiKey.trim()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method_of_payment: ["wave", "orange_money"],
              products: [
                {
                  name: params.formuleNom,
                  price: params.montant,
                  quantity: 1,
                  description: `Abonnement Sylla Voyage - ${params.formuleNom}`,
                },
              ],
              customer: {
                first_name: params.userPrenom || "Voyageur",
                last_name: params.userNom || "Sylla",
                phone: params.userTelephone || "+221770000000",
              },
              fees_customer_side: true,
              is_escrow: false,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as { order_id?: string; checkout_url?: string };
            if (data.order_id) {
              orderId = data.order_id;
            }
            if (data.checkout_url) {
              checkoutUrl = data.checkout_url;
            }
          }
        } catch {
          // Fallback hors-ligne / environnement de test
        }
      }
    }

    const created = await db.orm.public.Paiement.create({
      id: paymentId,
      abonnement_id: params.abonnementId,
      reference: orderId,
      montant: params.montant,
      statut: "EN_ATTENTE",
      moyen_paiement: moyenPaiementInitial,
      date_creation: now,
      date_confirmation: null,
    });

    return this.formatPayment(created, checkoutUrl);
  }

  async initiatePaymentForSubscription(
    userId: string,
    abonnementId: string,
    provider: PaymentProvider = "NABOOPAY"
  ): Promise<any> {
    const subscription = await db.orm.public.Abonnement
      .where({ id: abonnementId, utilisateur_id: userId })
      .first();

    if (!subscription) {
      throw new AppError("Abonnement introuvable pour cet utilisateur", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    const formule = await db.orm.public.FormuleAbonnement
      .where({ id: subscription.formule_id })
      .first();

    if (!formule) {
      throw new AppError("Formule d'abonnement introuvable", 404, "PLAN_NOT_FOUND");
    }

    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    // Frais opérateurs indicatifs selon le canal :
    // - Mobile Money (NabooPay Wave/Orange Money) : 2%
    // - Carte bancaire (Bictorys Visa/Mastercard) : 2.5%
    const tauxFrais = provider === "BICTORYS" ? 0.025 : 0.02;
    const fraisOperateur = Math.round(formule.prix * tauxFrais);
    const montantTotal = formule.prix + fraisOperateur;

    const payment = await this.createPayment({
      userId,
      abonnementId: subscription.id,
      montant: formule.prix,
      formuleNom: formule.nom,
      provider,
      userEmail: user?.email,
      userNom: user?.nom,
      userPrenom: user?.prenom,
      userTelephone: user?.telephone,
    });

    return {
      payment,
      provider,
      canal: provider === "BICTORYS" ? "CARTE_BANCAIRE (Visa/Mastercard)" : "MOBILE_MONEY (Wave/Orange Money)",
      breakdown: {
        prix_formule: formule.prix,
        frais_a_la_charge_du_client: true,
        frais_operateur_estimes: fraisOperateur,
        montant_total_estime: montantTotal,
        frais_operateur: fraisOperateur,
        montant_total: montantTotal,
        devise: "FCFA",
      },
      checkout_url: payment.checkout_url,
    };
  }

  async getPaymentById(paymentId: string, userId: string, userRole?: string): Promise<PaymentResponse> {
    const payment = await db.orm.public.Paiement
      .where({ id: paymentId })
      .first();

    if (!payment) {
      throw new AppError("Paiement introuvable", 404, "PAYMENT_NOT_FOUND");
    }

    const abonnement = await db.orm.public.Abonnement
      .where({ id: payment.abonnement_id })
      .first();

    if (!abonnement) {
      throw new AppError("Abonnement lié au paiement introuvable", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    if (abonnement.utilisateur_id !== userId && userRole !== "ADMIN") {
      throw new AppError("Accès non autorisé à ce paiement", 403, "FORBIDDEN");
    }

    return this.formatPayment(payment);
  }

  // =========================================================================
  // WEBHOOK NABOOPAY (Wave / Orange Money)
  // =========================================================================
  async handleNabooWebhook(payload: any, signatureHeader?: string, rawBodyBuffer?: Buffer): Promise<any> {
    // 1. Vérification de la signature HMAC SHA-256
    if (config.naboopayWebhookSecret) {
      if (!signatureHeader) {
        throw new AppError("En-tête X-Signature manquant", 401, "MISSING_SIGNATURE");
      }

      const cleanSignature = signatureHeader.replace(/^sha256=/, "").trim();
      const hmac = crypto.createHmac("sha256", config.naboopayWebhookSecret);
      const computed = rawBodyBuffer
        ? hmac.update(rawBodyBuffer).digest("hex")
        : hmac.update(JSON.stringify(payload)).digest("hex");

      if (
        cleanSignature.length !== computed.length ||
        !crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(computed))
      ) {
        throw new AppError("Signature du webhook invalide", 401, "INVALID_SIGNATURE");
      }
    }

    const orderId = payload.order_id || payload.reference;
    if (!orderId) {
      throw new AppError("L'identifiant de commande (order_id) est manquant dans le webhook", 400, "VALIDATION_ERROR");
    }

    const rawStatus = (payload.transaction_status || payload.statut || "").toLowerCase();

    const isSuccess = [
      "completed",
      "paid",
      "paid_and_blocked",
      "confirme",
      "success"
    ].includes(rawStatus);

    const isFailure = [
      "failed",
      "cancelled",
      "canceled",
      "refunded",
      "echoue"
    ].includes(rawStatus);

    if (isSuccess) {
      const moyenPaiement = payload.selected_payment_method
        ? `NABOOPAY_${payload.selected_payment_method.toUpperCase()}`
        : "NABOOPAY";

      return this.confirmPaymentAndActivate({
        reference: orderId,
        confirmedMontant: typeof payload.amount === "number" ? payload.amount : undefined,
        moyenPaiement,
        provider: "NABOOPAY",
      });
    } else if (isFailure) {
      return this.failPayment({ reference: orderId });
    }

    const payment = await db.orm.public.Paiement.where({ reference: orderId }).first();
    return {
      status: "received",
      reference: orderId,
      payment_status: payment?.statut || "EN_ATTENTE",
    };
  }

  // =========================================================================
  // WEBHOOK BICTORYS (Visa / Mastercard)
  // =========================================================================
  async handleBictorysWebhook(payload: any, secretKeyHeader?: string, rawBodyBuffer?: Buffer): Promise<any> {
    // 1. Vérification officielle du secret de webhook Bictorys (X-Secret-Key)
    if (config.bictorysWebhookSecret) {
      if (!secretKeyHeader) {
        throw new AppError("En-tête X-Secret-Key manquant pour le webhook Bictorys", 401, "MISSING_SIGNATURE");
      }

      const cleanKey = secretKeyHeader.replace(/^Bearer\s+/i, "").replace(/^sha256=/, "").trim();
      const expectedSecret = config.bictorysWebhookSecret.trim();

      let isValid = false;

      // 1.1 Comparaison directe à temps constant avec le secret configuré (convention Bictorys X-Secret-Key)
      if (cleanKey.length === expectedSecret.length) {
        isValid = crypto.timingSafeEqual(Buffer.from(cleanKey), Buffer.from(expectedSecret));
      }

      // 1.2 Si signature HMAC-SHA256 transmise
      if (!isValid) {
        const hmac = crypto.createHmac("sha256", expectedSecret);
        const computed = rawBodyBuffer
          ? hmac.update(rawBodyBuffer).digest("hex")
          : hmac.update(JSON.stringify(payload)).digest("hex");

        if (cleanKey.length === computed.length) {
          isValid = crypto.timingSafeEqual(Buffer.from(cleanKey), Buffer.from(computed));
        }
      }

      if (!isValid) {
        throw new AppError("Clé ou signature du webhook Bictorys invalide", 401, "INVALID_SIGNATURE");
      }
    }

    const data = payload.data || payload;
    const reference =
      data.paymentReference ||
      data.reference ||
      data.order_id ||
      payload.paymentReference ||
      payload.reference ||
      payload.order_id ||
      payload.charge_id;

    if (!reference) {
      throw new AppError("Référence de commande manquante dans le webhook Bictorys", 400, "VALIDATION_ERROR");
    }

    const rawEvent = (payload.event || "").toLowerCase();
    const rawStatus = (data.status || payload.status || "").toLowerCase();

    const isSuccess =
      rawEvent.includes("success") ||
      rawEvent.includes("completed") ||
      ["success", "successful", "paid", "completed", "succeeded"].includes(rawStatus);

    const isFailure =
      rawEvent.includes("failed") ||
      rawEvent.includes("cancelled") ||
      rawEvent.includes("declined") ||
      ["failed", "cancelled", "canceled", "declined", "expired"].includes(rawStatus);

    if (isSuccess) {
      const brand = (data.card_brand || data.brand || "CARD").toUpperCase();
      const moyenPaiement = `BICTORYS_${brand}`;
      const confirmedMontant = typeof data.amount === "number" ? data.amount : undefined;

      return this.confirmPaymentAndActivate({
        reference,
        confirmedMontant,
        moyenPaiement,
        provider: "BICTORYS",
      });
    } else if (isFailure) {
      return this.failPayment({ reference });
    }

    const payment = await db.orm.public.Paiement.where({ reference }).first();
    return {
      status: "received",
      reference,
      payment_status: payment?.statut || "EN_ATTENTE",
    };
  }

  // Vérification de statut directement auprès de l'API NabooPay
  async verifyTransactionStatusDirectly(reference: string): Promise<any> {
    if (!config.naboopayApiKey || !config.naboopayApiKey.trim()) {
      return null;
    }

    try {
      const response = await fetch(`${config.naboopayBaseUrl}/api/v2/transactions/${reference}`, {
        headers: {
          "Authorization": `Bearer ${config.naboopayApiKey.trim()}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }
}

export const paymentsService = new PaymentsService();
