import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="container profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.prenom.charAt(0).toUpperCase()}
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div className="profile-identity">
              <h1 className="profile-name">
                {user.prenom} {user.nom}
              </h1>
              <span className="user-badge user-badge-role">
                {user.role === "PROFESSIONNEL"
                  ? "Compte Professionnel"
                  : user.role === "ADMIN"
                  ? "Compte Administrateur"
                  : "Compte Voyageur"}
              </span>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="detail-label">Adresse email</span>
              <span className="detail-value">{user.email}</span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Téléphone</span>
              <span className="detail-value">{user.telephone || "Non renseigné"}</span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Statut du compte</span>
              <span className="detail-value">
                <span className={`status-pill status-${user.statut.toLowerCase()}`}>
                  {user.statut === "ACTIF" ? "Actif" : user.statut}
                </span>
              </span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">Membre depuis</span>
              <span className="detail-value">
                {new Date(user.created_at).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={handleLogout}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
