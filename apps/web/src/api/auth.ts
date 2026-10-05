import { apiFetch, type ApiUser } from "./client";

export interface LoginParams {
  email: string;
  mot_de_passe: string;
}

export interface RegisterParams {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  telephone: string;
  role?: "VOYAGEUR" | "PROFESSIONNEL";
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: ApiUser;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: ApiUser;
  };
}

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  register: async (params: RegisterParams): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  registerProfessional: async (formData: FormData): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/auth/register-pro", {
      method: "POST",
      body: formData,
    });
  },

  getMe: async (): Promise<MeResponse> => {
    return apiFetch<MeResponse>("/auth/me", {
      method: "GET",
    });
  },
};
