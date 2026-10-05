import { apiFetch } from "./client";

export interface PaymentChannel {
  provider: "NABOOPAY";
  label: string;
  methodes: string[];
  frais_estimes: number;
}

export interface SubscriptionPlan {
  id: string;
  nom: string;
  duree: "MENSUEL" | "ANNUEL" | string;
  prix: number;
  frais_a_la_charge_du_client: boolean;
  frais_operateur_estimes: number;
  montant_total_estime: number;
  frais_operateur: number;
  montant_total: number;
  type_utilisateur: "VOYAGEUR" | "PROFESSIONNEL" | string;
  statut: "ACTIF" | string;
  canaux_paiement_supportes?: PaymentChannel[];
}

export interface SubscriptionPayment {
  id: string;
  reference: string;
  montant: number;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | string;
  moyen_paiement: string;
  date_creation: string;
  date_confirmation: string | null;
  checkout_url?: string;
}

export interface UserSubscription {
  id: string;
  statut: "ACTIF" | "EXPIRE" | "EN_ATTENTE" | "ECHOUE" | string;
  date_debut: string;
  date_fin: string;
  formule: {
    id: string;
    nom: string;
    duree: string;
    prix: number;
  } | null;
  derniers_paiements?: SubscriptionPayment[];
}

export interface PaymentBreakdown {
  prix_formule: number;
  frais_a_la_charge_du_client: boolean;
  frais_operateur_estimes: number;
  montant_total_estime: number;
  frais_operateur: number;
  montant_total: number;
  devise: string;
}

export interface CreateSubscriptionResult {
  subscription: {
    id: string;
    formule_id?: string;
    statut: string;
    date_debut?: string;
    date_fin?: string;
  };
  payment: SubscriptionPayment;
  provider: "NABOOPAY";
  canal: string;
  breakdown: PaymentBreakdown;
  checkout_url?: string;
}

export interface CreateSubscriptionParams {
  formule_id: string;
  provider?: "NABOOPAY";
}

export interface RenewSubscriptionParams {
  provider?: "NABOOPAY";
}

export const subscriptionsApi = {
  // Récupérer toutes les formules actives (public)
  async listPlans(): Promise<{ success: boolean; data: { plans: SubscriptionPlan[] } }> {
    return apiFetch<{ success: boolean; data: { plans: SubscriptionPlan[] } }>("/subscriptions/plans");
  },

  // Récupérer l'abonnement du compte connecté
  async getMySubscription(): Promise<{ success: boolean; data: { subscription: UserSubscription | null } }> {
    return apiFetch<{ success: boolean; data: { subscription: UserSubscription | null } }>("/subscriptions/me");
  },

  // Créer une souscription (initialise l'abonnement EN_ATTENTE + le paiement)
  async createSubscription(params: CreateSubscriptionParams): Promise<{ success: boolean; data: CreateSubscriptionResult }> {
    return apiFetch<{ success: boolean; data: CreateSubscriptionResult }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Renouveler un abonnement existant
  async renewSubscription(subscriptionId: string, params: RenewSubscriptionParams = {}): Promise<{ success: boolean; data: CreateSubscriptionResult }> {
    return apiFetch<{ success: boolean; data: CreateSubscriptionResult }>(`/subscriptions/${subscriptionId}/renew`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Consulter l'état d'un paiement côté serveur (source de vérité)
  async getPayment(paymentId: string): Promise<{ success: boolean; data: { payment: SubscriptionPayment } }> {
    return apiFetch<{ success: boolean; data: { payment: SubscriptionPayment } }>(`/payments/${paymentId}`);
  },
};
