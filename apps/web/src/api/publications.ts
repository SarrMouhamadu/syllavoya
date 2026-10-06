import { apiFetch } from "./client";

export interface ApiPublication {
  id: string;
  professionnel_id: string;
  titre: string;
  contenu: string;
  statut: string;
  date_creation: string;
  date_publication: string | null;
  commentaire_moderation?: string | null;
  commentaire?: string | null;
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

export interface PublicationComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface PublicationInteractions {
  likesCount: number;
  userLiked: boolean;
  comments: PublicationComment[];
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

  listMine: async (): Promise<PublicationsListResponse> => {
    return apiFetch<PublicationsListResponse>("/publications/me", {
      method: "GET",
    });
  },

  create: async (data: { titre: string; contenu: string }): Promise<PublicationDetailResponse> => {
    return apiFetch<PublicationDetailResponse>("/publications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { titre?: string; contenu?: string }): Promise<PublicationDetailResponse> => {
    return apiFetch<PublicationDetailResponse>(`/publications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch<{ success: boolean; message: string }>(`/publications/${id}`, {
      method: "DELETE",
    });
  },

  getInteractions: async (id: string): Promise<{ success: boolean; data: PublicationInteractions }> => {
    return apiFetch<{ success: boolean; data: PublicationInteractions }>(`/publications/${id}/interactions`, {
      method: "GET",
    });
  },

  toggleLike: async (id: string): Promise<{ success: boolean; data: { likesCount: number; userLiked: boolean } }> => {
    return apiFetch<{ success: boolean; data: { likesCount: number; userLiked: boolean } }>(`/publications/${id}/like`, {
      method: "POST",
    });
  },

  addComment: async (
    id: string,
    content: string
  ): Promise<{ success: boolean; data: { comment: PublicationComment; interactions: PublicationInteractions } }> => {
    return apiFetch<{ success: boolean; data: { comment: PublicationComment; interactions: PublicationInteractions } }>(
      `/publications/${id}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  },
};

export function parsePublicationContent(contenu: string): { text: string; photoUrl: string | null } {
  if (!contenu) return { text: "", photoUrl: null };
  const photoMatch = contenu.match(/\[PHOTO:(data:image\/[^\]]+)\]/);
  if (photoMatch) {
    return {
      text: contenu.replace(photoMatch[0], "").trim(),
      photoUrl: photoMatch[1],
    };
  }
  return { text: contenu, photoUrl: null };
}

