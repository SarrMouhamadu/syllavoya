import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <span className="hero-badge">🇸🇳 Sylla Voyage</span>
          <h1 className="hero-title">
            Voyagez en toute confiance avec des professionnels vérifiés
          </h1>
          <p className="hero-description">
            La première plateforme de mise en relation directe, sécurisée et humaine entre voyageurs et structures de voyage formelles au Sénégal.
          </p>

          <div className="hero-actions">
            {isAuthenticated && user ? (
              <div className="hero-user-card">
                <p className="user-welcome">
                  👋 Ravi de vous revoir, <strong>{user.prenom} {user.nom}</strong>
                </p>
                <div className="user-actions">
                  <Link to="/profile" className="btn btn-primary btn-lg">
                    Accéder à mon profil
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hero-guest-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Commencer maintenant
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  J'ai déjà un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 Pilliers Section (Conforme docs/10-ui-guidelines.md) */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Pourquoi choisir Sylla Voyage ?</h2>
            <p className="section-subtitle">
              Une expérience pensée pour être simple, transparente et accessible sur mobile.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Professionnels vérifiés</h3>
              <p className="feature-text">
                Chaque structure est contrôlée avec ses pièces officielles (RCCM, NINEA) avant de pouvoir être contactée.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Contrôle voyageur</h3>
              <p className="feature-text">
                Aucun démarchage intempestif : seul le voyageur décide d'initier la première prise de contact.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3 className="feature-title">Paiements locaux sécurisés</h3>
              <p className="feature-text">
                Réglez en toute sérénité par Mobile Money (Wave, Orange Money) ou Carte Bancaire en FCFA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="cta-section">
        <div className="container cta-container">
          <h2 className="cta-title">Prêt à organiser votre prochain voyage ?</h2>
          <p className="cta-text">
            Rejoignez dès aujourd'hui la communauté des voyageurs et professionnels de confiance.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Créer mon compte gratuitement
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
