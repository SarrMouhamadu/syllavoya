import { apiFetch } from "./client";

export type ReportDecision = "TRAITE" | "REJETE" | "RESOLU" | "CLASSE";

export interface AdminReportUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export interface AdminReport {
  id: string;
  utilisateur_id: string;
  type_cible: "PROFESSIONNEL" | "PUBLICATION" | "MESSAGE" | "UTILISATEUR" | string;
  cible_id: string;
  motif: string;
  description?: string;
  statut: "EN_ATTENTE" | "TRAITE" | "REJETE" | "RESOLU" | "CLASSE" | string;
  date_creation: string;
  signale_par: AdminReportUser | null;
}

export interface TreatReportParams {
  decision: ReportDecision;
  commentaire?: string;
}

export interface AdminAuditLog {
  id: string;
  utilisateur_id: string;
  action: string;
  date: string;
  informations_complementaires?: string | null;
}

export interface AdminVerificationDoc {
  id: string;
  type_document: string;
  fichier: string;
  statut: string;
  created_at: string;
}

export interface AdminVerificationItem {
  id: string;
  professionnel_id: string;
  statut: string;
  date_debut: string;
  date_decision: string | null;
  commentaire: string | null;
  professionnel: {
    id: string;
    nom_structure: string;
    statut_verification: string;
    description?: string | null;
  } | null;
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
  } | null;
  documents: AdminVerificationDoc[];
}

export type VerificationDecision = "APPROUVEE" | "REJETEE" | "SUSPENDUE" | "REVOQUEE";

export interface TreatVerificationParams {
  decision: VerificationDecision;
  commentaire?: string;
}

export const adminApi = {
  // Récupérer tous les signalements
  listReports: async (): Promise<{ success: boolean; data: { reports: AdminReport[] } }> => {
    return apiFetch<{ success: boolean; data: { reports: AdminReport[] } }>("/admin/reports");
  },

  // Traiter un signalement avec l'une des 4 décisions supportées par le backend
  treatReport: async (
    reportId: string,
    params: TreatReportParams
  ): Promise<{ success: boolean; data: { report: AdminReport; audit_log: AdminAuditLog } }> => {
    return apiFetch<{ success: boolean; data: { report: AdminReport; audit_log: AdminAuditLog } }>(
      `/admin/reports/${reportId}`,
      {
        method: "PATCH",
        body: JSON.stringify(params),
      }
    );
  },

  // Récupérer les logs d'audit administratifs
  listAuditLogs: async (): Promise<{ success: boolean; data: { audit_logs: AdminAuditLog[] } }> => {
    return apiFetch<{ success: boolean; data: { audit_logs: AdminAuditLog[] } }>("/admin/audit-logs");
  },

  // Récupérer les demandes de vérification des professionnels
  listVerifications: async (): Promise<{ success: boolean; data: { verifications: AdminVerificationItem[] } }> => {
    return apiFetch<{ success: boolean; data: { verifications: AdminVerificationItem[] } }>("/admin/verifications");
  },

  // Traiter une vérification (approuver, rejeter, suspendre)
  treatVerification: async (
    verificationId: string,
    params: TreatVerificationParams
  ): Promise<{ success: boolean; data: any }> => {
    return apiFetch<{ success: boolean; data: any }>(
      `/admin/verifications/${verificationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(params),
      }
    );
  },

  // Récupérer toutes les publications pour la modération administrative
  listPublications: async (): Promise<{ success: boolean; data: { publications: AdminPublication[] } }> => {
    return apiFetch<{ success: boolean; data: { publications: AdminPublication[] } }>("/admin/publications");
  },

  // Traiter une publication (approuver ou rejeter avec commentaire de modération)
  treatPublication: async (
    publicationId: string,
    params: TreatPublicationParams
  ): Promise<{ success: boolean; data: { publication: AdminPublication } }> => {
    return apiFetch<{ success: boolean; data: { publication: AdminPublication } }>(
      `/admin/publications/${publicationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(params),
      }
    );
  },
};

export interface AdminPublication {
  id: string;
  professionnel_id: string;
  titre: string;
  contenu: string;
  statut: "EN_ATTENTE" | "APPROUVEE" | "REJETEE" | string;
  date_creation: string;
  date_publication: string | null;
  commentaire_moderation?: string | null;
  professionnel: {
    id: string;
    nom_structure: string;
    statut_verification: string;
    utilisateur?: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
      telephone?: string | null;
    } | null;
  } | null;
}

export type PublicationDecision = "APPROUVEE" | "REJETEE";

export interface TreatPublicationParams {
  decision: PublicationDecision;
  commentaire?: string;
}

