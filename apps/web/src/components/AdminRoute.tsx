import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { IconBan } from "./Icons";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="center-container py-5">
        <LoadingSpinner message="Vérification des privilèges administrateur..." size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="container py-5 text-center">
        <div className="auth-card" style={{ maxWidth: "540px", margin: "40px auto" }}>
          <div className="empty-state-icon" style={{ color: "#dc2626" }}>
            <IconBan size={48} />
          </div>
          <h1 className="h2 text-danger mt-2">Accès Refusé (403)</h1>
          <p className="text-muted mt-2">
            Cette section d'administration est strictement réservée aux administrateurs de la plateforme Sylla Voyage.
          </p>
          <div className="mt-4">
            <Link to="/" className="btn btn-primary btn-block">
              Retourner à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
