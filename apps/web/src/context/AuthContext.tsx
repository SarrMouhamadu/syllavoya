import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type LoginParams, type RegisterParams } from "../api/auth";
import { type ApiUser, getToken, setToken, removeToken } from "../api/client";

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  registerProfessional: (formData: FormData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Charger le profil utilisateur si un token est présent en mémoire locale
  const refreshUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        removeToken();
        setUser(null);
        setTokenState(null);
      }
    } catch {
      // Token invalide ou expiré
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (params: LoginParams): Promise<void> => {
    const response = await authApi.login(params);
    if (response.success && response.data) {
      setToken(response.data.token);
      setTokenState(response.data.token);
      setUser(response.data.user);
    }
  };

  const register = async (params: RegisterParams): Promise<void> => {
    const response = await authApi.register(params);
    if (response.success && response.data) {
      setToken(response.data.token);
      setTokenState(response.data.token);
      setUser(response.data.user);
    }
  };

  const registerProfessional = async (formData: FormData): Promise<void> => {
    const response = await authApi.registerProfessional(formData);
    if (response.success && response.data) {
      setToken(response.data.token);
      setTokenState(response.data.token);
      setUser(response.data.user);
    }
  };

  const logout = (): void => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        registerProfessional,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};
