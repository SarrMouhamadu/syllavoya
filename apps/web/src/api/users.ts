import { apiFetch } from "./client";

export interface UpdateProfileParams {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  email?: string;
}

export interface UserProfileData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  statut: string;
  created_at: string;
}

export const usersApi = {
  getProfile: async (): Promise<{ success: boolean; data: { user: UserProfileData } }> => {
    return apiFetch<{ success: boolean; data: { user: UserProfileData } }>("/users/me");
  },

  updateProfile: async (
    data: UpdateProfileParams
  ): Promise<{ success: boolean; data: { user: UserProfileData } }> => {
    return apiFetch<{ success: boolean; data: { user: UserProfileData } }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
