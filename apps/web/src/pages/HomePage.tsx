import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DashboardPage } from "./DashboardPage";
import {
  IconSearch,
  IconShieldCheck,
  IconMessage,
  IconArrowRight,
} from "../components/Icons";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Si l'utilisateur est connecté, afficher son tableau de bord orienté activité
  // plutôt qu'une page marketing visiteur.
  if (isAuthenticated && user) {
    return <DashboardPage />;
  }

  return (
    <div className="home-page">
      {/* Hero Section avec vidéo d'arrière-plan */}
      <section className="hero-section">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-video-bg"
          aria-hidden="true"
        >
          <source src="/avion.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay" />

        <div className="container hero-container">
          <div className="hero-badge-tag">
            <IconShieldCheck size={16} />
            <span>Structures touristiques vérifiées au Sénégal</span>
          </div>

          <h1 className="hero-title">
            Organisez votre voyage avec des professionnels vérifiés
          </h1>

          <p className="hero-description">
            Sylla Voyage met en relation les voyageurs avec des agences formelles et des guides certifiés.
            Consultez les dossiers administratifs validés et échangez en direct en toute sérénité.
          </p>

          <div className="hero-actions">
            {/* UN CTA PRINCIPAL UNIQUE */}
            <Link to="/professionals" className="btn btn-primary btn-lg" id="hero-main-cta">
              <IconSearch size={18} />
              <span>Trouver un professionnel</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section "Comment ça marche" (3 étapes maximum) */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Comment ça marche</h2>
            <p className="section-subtitle">
              Une démarche claire en trois étapes pour organiser votre séjour en toute confiance.
            </p>
          </div>

          <div className="steps-grid">
            {/* Étape 1 : Trouver */}
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon-wrap">
                <IconSearch size={24} />
              </div>
              <h3 className="step-title">Trouver</h3>
              <p className="step-desc">
                Explorez l'annuaire des agences et professionnels locaux selon votre destination et votre projet de voyage.
              </p>
            </div>

            {/* Étape 2 : Vérifier */}
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon-wrap">
                <IconShieldCheck size={24} />
              </div>
              <h3 className="step-title">Vérifier</h3>
              <p className="step-desc">
                Chaque professionnel est vérifié à partir des documents disponibles dans son dossier.
              </p>
            </div>

            {/* Étape 3 : Contacter */}
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon-wrap">
                <IconMessage size={24} />
              </div>
              <h3 className="step-title">Contacter</h3>
              <p className="step-desc">
                Initiez le premier contact directement sur la plateforme pour poser vos questions et préparer votre voyage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA finale */}
      <section className="cta-section">
        <div className="container cta-container">
          <h2 className="cta-title">Prêt à démarrer vos préparatifs ?</h2>
          <p className="cta-text">
            Accédez dès maintenant à la liste des professionnels vérifiés par nos soins.
          </p>
          <Link to="/professionals" className="btn btn-primary btn-lg">
            <span>Explorer les professionnels</span>
            <IconArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};
