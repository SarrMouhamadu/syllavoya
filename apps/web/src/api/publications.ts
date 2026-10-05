import { apiFetch } from "./client";

export interface ApiPublication {
  id: string;
  professionnel_id: string;
  titre: string;
  contenu: string;
  statut: string;
  date_creation: string;
  date_publication: string | null;
  professionnel?: {
    id: string;
    nom_structure: string;
  } | null;
}

export interface PublicationsListResponse {
  success: boolean;
  data: {
    publications: ApiPublication[];
  };
}

export interface PublicationDetailResponse {
  success: boolean;
  data: {
    publication: ApiPublication;
  };
}

export const publicationsApi = {
  listPublic: async (): Promise<PublicationsListResponse> => {
    return apiFetch<PublicationsListResponse>("/publications", {
      method: "GET",
    });
  },

  getById: async (id: string): Promise<PublicationDetailResponse> => {
    return apiFetch<PublicationDetailResponse>(`/publications/${id}`, {
      method: "GET",
    });
  },
};
