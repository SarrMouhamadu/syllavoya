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
};
