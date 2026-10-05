import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconPhone, IconMail, IconShieldCheck, IconCreditCard } from "../components/Icons";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Si l'utilisateur s'est inscrit par téléphone seul, l'email stocké est un placeholder système (pro.XXXX@syllavoyage.pro).
  // Ne jamais afficher ce placeholder comme étant le réel email de l'utilisateur.
  const hasRealEmail = user.email && !user.email.endsWith("@syllavoyage.pro");
  const displayEmail = hasRealEmail ? user.email : "Non renseigné";
  const displayTelephone = user.telephone || "Non renseigné";

  const initials = ((user.prenom?.charAt(0) || "") + (user.nom?.charAt(0) || "")).toUpperCase() || "U";

  return (
    <div className="profile-page">
      <div className="container profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {initials}
            </div>
            <div className="profile-identity">
              <h1 className="profile-name">
                {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
              </h1>
              <span className="user-badge user-badge-role">
                {user.role === "PROFESSIONNEL"
                  ? "Professionnel"
                  : user.role === "ADMIN"
                  ? "Administrateur"
                  : "Voyageur"}
              </span>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="detail-label">
                <IconMail size={15} />
                <span>Adresse email</span>
              </span>
              <span className="detail-value">{displayEmail}</span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">
                <IconPhone size={15} />
                <span>Numéro de téléphone</span>
              </span>
              <span className="detail-value">{displayTelephone}</span>
            </div>

            <div className="profile-detail-item">
              <span className="detail-label">
                <IconShieldCheck size={15} />
                <span>Statut du compte</span>
              </span>
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

          <div className="profile-quick-nav">
            <Link to="/subscriptions" className="btn btn-outline btn-block">
              <IconCreditCard size={16} />
              <span>Gérer mon abonnement</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
