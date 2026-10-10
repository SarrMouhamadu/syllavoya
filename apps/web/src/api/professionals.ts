import { apiFetch } from "./client";

export interface ApiProfessional {
  id: string;
  utilisateur_id: string;
  nom_structure: string;
  description: string | null;
  informations_professionnelles: string | null;
  statut_verification: string;
  created_at: string;
  telephone?: string | null;
}

export interface ProfessionalsListResponse {
  success: boolean;
  data: {
    professionals: ApiProfessional[];
  };
}

export interface ProfessionalDetailResponse {
  success: boolean;
  data: {
    professional: ApiProfessional;
  };
}

export const professionalsApi = {
  listVerified: async (): Promise<ProfessionalsListResponse> => {
    return apiFetch<ProfessionalsListResponse>("/professionals", {
      method: "GET",
    });
  },

  getById: async (id: string): Promise<ProfessionalDetailResponse> => {
    return apiFetch<ProfessionalDetailResponse>(`/professionals/${id}`, {
      method: "GET",
    });
  },

  getMe: async (): Promise<{ success: boolean; data: { professional: ApiProfessional } }> => {
    return apiFetch<{ success: boolean; data: { professional: ApiProfessional } }>("/professionals/me", {
      method: "GET",
    });
  },

  updateMe: async (data: {
    nom_structure?: string;
    description?: string | null;
    informations_professionnelles?: string | null;
  }): Promise<{ success: boolean; data: { professional: ApiProfessional } }> => {
    return apiFetch<{ success: boolean; data: { professional: ApiProfessional } }>("/professionals/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

