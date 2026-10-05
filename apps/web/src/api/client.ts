const TOKEN_KEY = "sylla_voyage_token";

export interface ApiUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: "VOYAGEUR" | "PROFESSIONNEL" | "ADMIN" | string;
  statut: "ACTIF" | "SUSPENDU" | string;
  created_at: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = "API_ERROR", statusCode = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignorer si localStorage non disponible
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignorer si localStorage non disponible
  }
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Normaliser l'endpoint
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        (response.status === 401
          ? "Session expirée ou identifiants invalides."
          : response.status === 403
          ? "Accès non autorisé."
          : response.status === 404
          ? "Ressource introuvable."
          : `Erreur serveur (${response.status})`);

      const errorCode = data?.error?.code || "HTTP_ERROR";
      throw new ApiError(errorMessage, errorCode, response.status);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Erreur réseau ou fetch bloqué
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez votre connexion internet.",
      "NETWORK_ERROR",
      0
    );
  }
}
