import crypto, { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";

export type PaymentProvider = "NABOOPAY";

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
  // =========================================================================
  // GESTION DE L'EXPIRATION DES PAIEMENTS (> 48 HEURES)
  // =========================================================================
  isPaymentExpired(dateCreation: { toString(): string } | string | Date): boolean {
    try {
      const now = Temporal.Now.instant();
      let creationInstant: Temporal.Instant;

      if (dateCreation instanceof Date) {
        creationInstant = Temporal.Instant.fromEpochMilliseconds(dateCreation.getTime());
      } else {
        const creationStr = typeof dateCreation === "string" ? dateCreation : dateCreation.toString();
        creationInstant = Temporal.Instant.from(creationStr);
      }

      // Règle 10 : expiration stricte si en attente depuis plus de 48 heures (172 800 secondes)
      const expiresAt = creationInstant.add({ seconds: 48 * 3600 });
      return Temporal.Instant.compare(expiresAt, now) <= 0;
    } catch {
      return false;
    }
  }

  async expirePendingPayments(): Promise<{ expiredCount: number; expiredIds: string[] }> {
    const pendingPayments = await db.orm.public.Paiement
      .where({ statut: "EN_ATTENTE" })
      .all();

    const expiredIds: string[] = [];
    for (const payment of pendingPayments) {
      if (this.isPaymentExpired(payment.date_creation)) {
        await db.orm.public.Paiement
          .where({ id: payment.id })
          .update({ statut: "EXPIRE" });

        await db.orm.public.Abonnement
          .where({ id: payment.abonnement_id, statut: "EN_ATTENTE" })
          .update({ statut: "EXPIRE" });

        expiredIds.push(payment.id);
      }
    }

    return { expiredCount: expiredIds.length, expiredIds };
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

    // Règle 10 : Si le paiement est en attente depuis > 48h, il est expiré et ne peut plus être confirmé
    if (payment.statut === "EN_ATTENTE" && this.isPaymentExpired(payment.date_creation)) {
      await db.orm.public.Paiement
        .where({ id: payment.id })
        .update({ statut: "EXPIRE" });

      await db.orm.public.Abonnement
        .where({ id: payment.abonnement_id, statut: "EN_ATTENTE" })
        .update({ statut: "EXPIRE" });

      throw new AppError(
        "Ce paiement est expiré (délai de 48 heures dépassé). L'abonnement ne peut pas être activé.",
        400,
        "PAYMENT_EXPIRED"
      );
    }

    if (payment.statut === "EXPIRE") {
      throw new AppError(
        "Ce paiement a expiré. Impossible de l'activer.",
        400,
        "PAYMENT_EXPIRED"
      );
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

    // 4. Activation de l'abonnement associé côté serveur (uniquement après confirmation réelle)
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
  // CRÉATION DE PAIEMENT (NabooPay - Mobile Money Wave & Orange Money)
  // =========================================================================
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const paymentId = randomUUID();
    const now = Temporal.Now.instant();

    let orderId: string;
    let checkoutUrl: string;
    const moyenPaiementInitial = "NABOOPAY";

    if (config.naboopayApiKey && config.naboopayApiKey.trim()) {
      try {
        const response = await fetch(`${config.naboopayBaseUrl}/api/v2/transactions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.naboopayApiKey.trim()}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
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

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new AppError(
            `Échec de création de la transaction NabooPay (${response.status}): ${errText || response.statusText}`,
            502,
            "PAYMENT_GATEWAY_ERROR"
          );
        }

        const data = (await response.json()) as { order_id?: string; checkout_url?: string };
        if (!data.order_id || !data.checkout_url) {
          throw new AppError(
            "Réponse invalide de la passerelle NabooPay (order_id ou checkout_url manquant)",
            502,
            "PAYMENT_GATEWAY_ERROR"
          );
        }

        orderId = data.order_id;
        checkoutUrl = data.checkout_url;
      } catch (error: any) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(
          `Impossible de communiquer avec la passerelle NabooPay: ${error?.message || "Erreur réseau"}`,
          502,
          "PAYMENT_GATEWAY_ERROR"
        );
      }
    } else {
      // Uniquement si AUCUNE clé n'est configurée (mode test hors-ligne / fallback dev sans clé)
      orderId = `ord_${Date.now()}_${randomUUID().slice(0, 8)}`;
      checkoutUrl = `https://checkout.naboopay.com/checkout/${orderId}`;
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
    _provider: PaymentProvider = "NABOOPAY"
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

    // Frais opérateurs NabooPay (Wave / OM : 2%)
    const tauxFrais = 0.02;
    const fraisOperateur = Math.round(formule.prix * tauxFrais);
    const montantTotal = formule.prix + fraisOperateur;

    const payment = await this.createPayment({
      userId,
      abonnementId: subscription.id,
      montant: formule.prix,
      formuleNom: formule.nom,
      provider: "NABOOPAY",
      userEmail: user?.email,
      userNom: user?.nom,
      userPrenom: user?.prenom,
      userTelephone: user?.telephone,
    });

    return {
      payment,
      provider: "NABOOPAY",
      canal: "MOBILE_MONEY (Wave/Orange Money)",
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

    // Auto-expiration si le paiement est en attente depuis plus de 48 heures
    if (payment.statut === "EN_ATTENTE" && this.isPaymentExpired(payment.date_creation)) {
      await db.orm.public.Paiement
        .where({ id: payment.id })
        .update({ statut: "EXPIRE" });
      payment.statut = "EXPIRE";

      await db.orm.public.Abonnement
        .where({ id: abonnement.id, statut: "EN_ATTENTE" })
        .update({ statut: "EXPIRE" });
    }

    return this.formatPayment(payment);
  }

  // =========================================================================
  // WEBHOOK NABOOPAY (Wave / Orange Money)
  // =========================================================================
  async handleNabooWebhook(payload: any, signatureHeader?: string, rawBodyBuffer?: Buffer): Promise<any> {
    const orderId = payload.order_id || payload.reference;
    if (!orderId) {
      throw new AppError("L'identifiant de commande (order_id) est manquant dans le webhook", 400, "VALIDATION_ERROR");
    }

    // 1. Vérification de la signature HMAC SHA-256 ou clé secrète
    let isSignatureValid = false;
    if (config.naboopayWebhookSecret && signatureHeader) {
      const cleanSignature = signatureHeader.replace(/^Bearer\s+/i, "").replace(/^sha256=/, "").trim();
      const expectedSecret = config.naboopayWebhookSecret.trim();

      // 1.1 Comparaison directe à temps constant avec le secret configuré
      if (cleanSignature.length === expectedSecret.length) {
        isSignatureValid = crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(expectedSecret));
      }

      // 1.2 Signature HMAC SHA-256
      if (!isSignatureValid) {
        const hmac = crypto.createHmac("sha256", expectedSecret);
        const computed = rawBodyBuffer
          ? hmac.update(rawBodyBuffer).digest("hex")
          : hmac.update(JSON.stringify(payload)).digest("hex");

        if (cleanSignature.length === computed.length) {
          isSignatureValid = crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(computed));
        }
      }
    }

    // 1.3 Si le secret local n'est pas validé, valider formellement la transaction auprès de l'API NabooPay (clé d'API secrète)
    if (!isSignatureValid) {
      const directTx = await this.verifyTransactionStatusDirectly(orderId);
      if (!directTx) {
        throw new AppError("Signature du webhook invalide et transaction non confirmée par NabooPay", 401, "INVALID_SIGNATURE");
      }
      payload = { ...payload, ...directTx };
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

    const isExpired = [
      "expired",
      "expire"
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
    } else if (isExpired) {
      const payment = await db.orm.public.Paiement.where({ reference: orderId }).first();
      if (payment && payment.statut !== "CONFIRME") {
        await db.orm.public.Paiement.where({ id: payment.id }).update({ statut: "EXPIRE" });
        await db.orm.public.Abonnement.where({ id: payment.abonnement_id, statut: "EN_ATTENTE" }).update({ statut: "EXPIRE" });
      }
      return {
        status: "expired",
        reference: orderId,
        payment_status: "EXPIRE",
      };
    }

    const payment = await db.orm.public.Paiement.where({ reference: orderId }).first();
    return {
      status: "received",
      reference: orderId,
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

  /**
   * Réconcilie automatiquement un paiement EN_ATTENTE en interrogeant l'API NabooPay.
   * Si NabooPay confirme que la transaction est "paid", active immédiatement le paiement et l'abonnement.
   */
  async verifyAndReconcilePayment(reference: string): Promise<any> {
    if (!reference || typeof reference !== "string") return null;

    const payment = await db.orm.public.Paiement
      .where({ reference })
      .first();

    if (!payment) return null;
    if (payment.statut === "CONFIRME") {
      return { status: "already_processed", subscription_status: "ACTIF" };
    }
    if (payment.statut !== "EN_ATTENTE") return null;

    const tx = await this.verifyTransactionStatusDirectly(reference);
    if (!tx) return null;

    const rawStatus = (tx.transaction_status || tx.statut || "").toLowerCase();
    const isSuccess = [
      "completed",
      "paid",
      "paid_and_blocked",
      "confirme",
      "success",
    ].includes(rawStatus);

    const isFailure = [
      "failed",
      "cancelled",
      "canceled",
      "refunded",
      "echoue",
    ].includes(rawStatus);

    if (isSuccess) {
      const moyenPaiement = tx.selected_payment_method
        ? `NABOOPAY_${String(tx.selected_payment_method).toUpperCase()}`
        : (payment.moyen_paiement || "NABOOPAY");

      return this.confirmPaymentAndActivate({
        reference,
        confirmedMontant: typeof tx.amount === "number" ? tx.amount : payment.montant,
        moyenPaiement,
        provider: "NABOOPAY",
      });
    } else if (isFailure) {
      return this.failPayment({ reference });
    }

    return null;
  }
}

export const paymentsService = new PaymentsService();
