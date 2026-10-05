import { apiFetch } from "./client";

export interface VerificationItem {
  id: string;
  professionnel_id: string;
  statut: string;
  date_debut: string;
  date_decision: string | null;
  commentaire: string | null;
}

export interface VerificationDocument {
  id: string;
  professionnel_id: string;
  type_document: string;
  fichier: string;
  statut: string;
  created_at: string;
}

export interface MyVerificationResponse {
  success: boolean;
  data: {
    statut_verification: string;
    verifications: VerificationItem[];
    documents: VerificationDocument[];
  };
}

export const verificationApi = {
  getMyVerificationState: async (): Promise<MyVerificationResponse> => {
    return apiFetch<MyVerificationResponse>("/verification/me", {
      method: "GET",
    });
  },
};
