import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { paymentsService, PaymentProvider } from "../payments/payments.service.js";
import { AppError } from "../../errors/AppError.js";

export interface PlanDTO {
  id: string;
  nom: string;
  duree: string;
  prix: number;
  frais_a_la_charge_du_client: boolean;
  frais_operateur_estimes: number;
  montant_total_estime: number;
  frais_operateur: number;
  montant_total: number;
  type_utilisateur: string;
  statut: string;
  canaux_paiement_supportes?: Array<{
    provider: PaymentProvider;
    label: string;
    methodes: string[];
    frais_estimes: number;
  }>;
}

export class SubscriptionsService {
  async listPlans(): Promise<PlanDTO[]> {
    const plans = await db.orm.public.FormuleAbonnement
      .where({ statut: "ACTIF" })
      .all();

    return plans.map((p) => {
      // Les frais opérateurs sont à la charge du client
      // - Mobile Money (NabooPay Wave/Orange Money) : ~2%
      const fraisNaboo = Math.round(p.prix * 0.02);
      const totalEstime = p.prix + fraisNaboo;

      return {
        id: p.id,
        nom: p.nom,
        duree: p.duree,
        prix: p.prix,
        frais_a_la_charge_du_client: true,
        frais_operateur_estimes: fraisNaboo,
        montant_total_estime: totalEstime,
        frais_operateur: fraisNaboo,
        montant_total: totalEstime,
        type_utilisateur: p.type_utilisateur,
        statut: p.statut,
        canaux_paiement_supportes: [
          {
            provider: "NABOOPAY",
            label: "Mobile Money (Wave / Orange Money)",
            methodes: ["WAVE", "ORANGE_MONEY"],
            frais_estimes: fraisNaboo,
          },
        ],
      };
    });
  }

  async getMySubscription(userId: string): Promise<any> {
    const subscriptions = await db.orm.public.Abonnement
      .where({ utilisateur_id: userId })
      .all();

    if (subscriptions.length === 0) {
      return null;
    }

    const now = Temporal.Now.instant();

    // Règle 11 : à la date de fin, l'abonnement devient expiré
    for (const sub of subscriptions) {
      if (sub.statut === "ACTIF") {
        const dateFinInstant = Temporal.Instant.from(sub.date_fin.toString());
        if (Temporal.Instant.compare(dateFinInstant, now) < 0) {
          sub.statut = "EXPIRE";
          await db.orm.public.Abonnement
            .where({ id: sub.id })
            .update({ statut: "EXPIRE" });
        }
      }
    }

    // Priorité à l'abonnement ACTIF valide, sinon le plus récent
    const target = subscriptions.find((s) => s.statut === "ACTIF") || subscriptions[subscriptions.length - 1]!;
    const statut = target.statut;

    const formule = await db.orm.public.FormuleAbonnement
      .where({ id: target.formule_id })
      .first();

    const paiements = await db.orm.public.Paiement
      .where({ abonnement_id: target.id })
      .all();

    for (const p of paiements) {
      if (p.statut === "EN_ATTENTE" && paymentsService.isPaymentExpired(p.date_creation)) {
        p.statut = "EXPIRE";
        await db.orm.public.Paiement
          .where({ id: p.id })
          .update({ statut: "EXPIRE" });
      }
    }


    return {
      id: target.id,
      statut,
      date_debut: target.date_debut.toString(),
      date_fin: target.date_fin.toString(),
      formule: formule ? {
        id: formule.id,
        nom: formule.nom,
        duree: formule.duree,
        prix: formule.prix,
      } : null,
      derniers_paiements: paiements.map((p) => ({
        id: p.id,
        reference: p.reference,
        montant: p.montant,
        statut: p.statut,
        moyen_paiement: p.moyen_paiement,
        date_creation: p.date_creation.toString(),
        date_confirmation: p.date_confirmation ? p.date_confirmation.toString() : null,
      })),
    };
  }

  async createSubscription(
    userId: string,
    formuleId: string,
    provider: PaymentProvider = "NABOOPAY"
  ): Promise<any> {
    if (!formuleId || typeof formuleId !== "string") {
      throw new AppError("L'identifiant de la formule est obligatoire", 400, "VALIDATION_ERROR");
    }

    const formule = await db.orm.public.FormuleAbonnement
      .where({ id: formuleId, statut: "ACTIF" })
      .first();

    if (!formule) {
      throw new AppError("Formule d'abonnement introuvable ou inactive", 404, "PLAN_NOT_FOUND");
    }

    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    // Frais opérateur NabooPay (Wave / OM : 2%)
    const tauxFrais = 0.02;
    const fraisOperateur = Math.round(formule.prix * tauxFrais);
    const montantTotal = formule.prix + fraisOperateur;

    const subscriptionId = randomUUID();
    const now = Temporal.Now.instant();
    const durationDays = formule.duree === "ANNUEL" ? 365 : 30;
    const dateFin = now.add({ seconds: durationDays * 24 * 3600 });

    // Règle essentielle : l'abonnement est créé en statut EN_ATTENTE
    // Il ne sera activé qu'après confirmation serveur par NabooPay
    const subscription = await db.orm.public.Abonnement.create({
      id: subscriptionId,
      utilisateur_id: userId,
      formule_id: formule.id,
      date_debut: now,
      date_fin: dateFin,
      statut: "EN_ATTENTE",
    });

    const payment = await paymentsService.createPayment({
      userId,
      abonnementId: subscription.id,
      montant: formule.prix,
      formuleNom: formule.nom,
      provider: "NABOOPAY",
      userEmail: user.email,
      userNom: user.nom,
      userPrenom: user.prenom,
      userTelephone: user.telephone,
    });

    return {
      subscription: {
        id: subscription.id,
        formule_id: subscription.formule_id,
        statut: subscription.statut,
        date_debut: subscription.date_debut.toString(),
        date_fin: subscription.date_fin.toString(),
      },
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

  async renewSubscription(
    userId: string,
    subscriptionId: string,
    provider: PaymentProvider = "NABOOPAY"
  ): Promise<any> {
    const subscription = await db.orm.public.Abonnement
      .where({ id: subscriptionId, utilisateur_id: userId })
      .first();

    if (!subscription) {
      throw new AppError("Abonnement introuvable pour ce compte", 404, "SUBSCRIPTION_NOT_FOUND");
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

    const tauxFrais = 0.02;
    const fraisOperateur = Math.round(formule.prix * tauxFrais);
    const montantTotal = formule.prix + fraisOperateur;

    // Création d'un nouveau paiement pour le renouvellement avec NabooPay
    const payment = await paymentsService.createPayment({
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
      subscription: {
        id: subscription.id,
        statut: subscription.statut,
      },
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

  /**
   * Helper central pour vérifier si un utilisateur possède un abonnement actif et non expiré.
   * Si la date de fin est dépassée, met automatiquement à jour le statut en "EXPIRE".
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    if (!userId || typeof userId !== "string") return false;

    const subscriptions = await db.orm.public.Abonnement
      .where({ utilisateur_id: userId, statut: "ACTIF" })
      .all();

    if (subscriptions.length === 0) {
      return false;
    }

    const now = Temporal.Now.instant();
    let hasValid = false;

    for (const sub of subscriptions) {
      const dateFinInstant = Temporal.Instant.from(sub.date_fin.toString());
      if (Temporal.Instant.compare(dateFinInstant, now) <= 0) {
        // Expiré
        sub.statut = "EXPIRE";
        await db.orm.public.Abonnement
          .where({ id: sub.id })
          .update({ statut: "EXPIRE" });
      } else {
        hasValid = true;
      }
    }

    return hasValid;
  }
}

export const subscriptionsService = new SubscriptionsService();

export const hasActiveSubscription = (userId: string): Promise<boolean> =>
  subscriptionsService.hasActiveSubscription(userId);
