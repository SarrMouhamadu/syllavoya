import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscriptionsApi, type UserSubscription } from "../api/subscriptions";
import { verificationApi, type MyVerificationResponse } from "../api/verification";
import { publicationsApi, type ApiPublication } from "../api/publications";
import { conversationsApi, type ConversationSummary } from "../api/conversations";
import {
  IconShieldCheck,
  IconSearch,
  IconMessage,
  IconCreditCard,
  IconFileText,
  IconBuilding,
  IconUser,
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
} from "../components/Icons";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [verificationData, setVerificationData] = useState<MyVerificationResponse["data"] | null>(null);
  const [myPubs, setMyPubs] = useState<ApiPublication[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Récupérer l'abonnement actif pour tous
        const subRes = await subscriptionsApi.getMySubscription().catch(() => null);
        if (isMounted && subRes?.success && subRes.data?.subscription) {
          setActiveSubscription(subRes.data.subscription);
        }

        // Récupérer les messages
        const convRes = await conversationsApi.listConversations().catch(() => null);
        if (isMounted && convRes?.success && convRes.data?.conversations) {
          setConversations(convRes.data.conversations);
        }

        // Pour les professionnels
        if (user?.role === "PROFESSIONNEL") {
          const [verifRes, pubsRes] = await Promise.all([
            verificationApi.getMyVerificationState().catch(() => null),
            publicationsApi.listMine().catch(() => null),
          ]);

          if (isMounted) {
            if (verifRes?.success && verifRes.data) {
              setVerificationData(verifRes.data);
            }
            if (pubsRes?.success && pubsRes.data?.publications) {
              setMyPubs(pubsRes.data.publications);
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  // Calcul du quota 7 jours glissants pour les professionnels
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentPubsCount = myPubs.filter(
    (p) => new Date(p.date_creation).getTime() >= sevenDaysAgo
  ).length;

  if (loading) {
    return (
      <div className="center-container">
        <LoadingSpinner message="Chargement de votre espace personnel..." size="large" />
      </div>
    );
  }

  /* ======================================================== */
  /* VUE PROFESSIONNEL                                        */
  /* ======================================================== */
  if (user.role === "PROFESSIONNEL") {
    const verifStatus = verificationData?.statut_verification || "EN_ATTENTE";
    const isVerified = verifStatus === "APPROUVEE";
    const isPending = verifStatus === "EN_ATTENTE";

    return (
      <div className="dashboard-page">
        <div className="container dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="dashboard-badge">Espace Professionnel</span>
              <h1 className="dashboard-title">
                Tableau de bord — {user.nom}
              </h1>
            </div>
            <Link to="/profile" className="btn btn-outline btn-sm">
              <IconBuilding size={16} />
              <span>Mon agence</span>
            </Link>
          </div>

          {/* 1. Statut de vérification */}
          <div className="dashboard-card verification-status-card">
            <div className="status-card-header">
              <div className="status-card-icon-wrap">
                {isVerified ? (
                  <IconShieldCheck size={28} className="icon-success" />
                ) : isPending ? (
                  <IconAlertTriangle size={28} className="icon-warning" />
                ) : (
                  <IconAlertTriangle size={28} className="icon-danger" />
                )}
              </div>
              <div className="status-card-content">
                <h2 className="status-card-title">
                  Statut de vérification :{" "}
                  <span className={`status-pill status-${verifStatus.toLowerCase()}`}>
                    {isVerified ? "Vérifié & Certifié" : isPending ? "Dossier en cours d'examen" : verifStatus}
                  </span>
                </h2>
                <p className="status-card-desc">
                  {isVerified
                    ? "Votre structure est validée par l'administration Sylla Voyage et visible par tous les voyageurs."
                    : isPending
                    ? "Votre pièce d'identité et vos informations sont actuellement en cours de vérification par notre équipe de modération."
                    : "Votre dossier requiert une attention. Veuillez contacter l'administration pour plus de détails."}
                </p>
              </div>
            </div>
          </div>

          {/* Grille d'activité professionnelle */}
          <div className="dashboard-grid pro-activity-grid">
            {/* 2. Abonnement professionnel */}
            <div className="dashboard-card activity-card">
              <div className="activity-card-icon">
                <IconCreditCard size={22} />
              </div>
              <h3 className="activity-card-title">Abonnement Professionnel</h3>
              <p className="activity-card-desc">
                {activeSubscription ? (
                  <>
                    Formule active jusqu'au{" "}
                    <strong>
                      {new Date(activeSubscription.date_fin).toLocaleDateString("fr-FR")}
                    </strong>
                  </>
                ) : (
                  "Aucun abonnement professionnel actif en cours."
                )}
              </p>
              <Link to="/subscriptions" className="card-action-link">
                {activeSubscription ? "Gérer mon abonnement" : "Souscrire un abonnement"}
                <IconArrowRight size={14} />
              </Link>
            </div>

            {/* 3. Publications & Quota 7 jours */}
            <div className="dashboard-card activity-card">
              <div className="activity-card-icon">
                <IconFileText size={22} />
              </div>
              <h3 className="activity-card-title">Publications & Quota</h3>
              <div className="quota-display">
                <span className="quota-number">{recentPubsCount} / 2</span>
                <span className="quota-label">publications ces 7 derniers jours</span>
              </div>
              <p className="activity-card-desc">
                Règle plateforme : 2 publications maximum par période glissante de 7 jours.
              </p>
              <Link to="/publications" className="card-action-link">
                Voir les publications
                <IconArrowRight size={14} />
              </Link>
            </div>

            {/* 4. Messagerie */}
            <div className="dashboard-card activity-card">
              <div className="activity-card-icon">
                <IconMessage size={22} />
              </div>
              <h3 className="activity-card-title">Messagerie</h3>
              <p className="activity-card-desc">
                {conversations.length > 0
                  ? `${conversations.length} conversation(s) active(s) avec des voyageurs.`
                  : "Aucune conversation active pour le moment. Les voyageurs initient les premiers échanges."}
              </p>
              <Link to="/messages" className="card-action-link">
                Accéder aux messages
                <IconArrowRight size={14} />
              </Link>
            </div>

            {/* 5. Agence & Profil */}
            <div className="dashboard-card activity-card">
              <div className="activity-card-icon">
                <IconBuilding size={22} />
              </div>
              <h3 className="activity-card-title">Profil de l'agence</h3>
              <p className="activity-card-desc">
                Consultez vos coordonnées enregistrées et vos informations professionnelles.
              </p>
              <Link to="/profile" className="card-action-link">
                Voir mon profil
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* VUE VOYAGEUR                                             */
  /* ======================================================== */
  return (
    <div className="dashboard-page">
      <div className="container dashboard-container">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-badge">Espace Voyageur</span>
            <h1 className="dashboard-title">
              Bonjour, {user.prenom} {user.nom}
            </h1>
            <p className="dashboard-subtitle">
              Préparez vos voyages et échangez en toute sérénité avec des professionnels certifiés.
            </p>
          </div>
          <Link to="/professionals" className="btn btn-primary btn-sm">
            <IconSearch size={16} />
            <span>Trouver un professionnel</span>
          </Link>
        </div>

        {/* État de l'abonnement voyageur */}
        <div className="dashboard-card subscription-summary-card">
          <div className="status-card-header">
            <div className="status-card-icon-wrap">
              <IconCreditCard size={28} className={activeSubscription ? "icon-success" : "icon-neutral"} />
            </div>
            <div className="status-card-content">
              <h2 className="status-card-title">
                Statut de l'abonnement :{" "}
                {activeSubscription ? (
                  <span className="status-pill status-actif">
                    <IconCheck size={12} /> Actif
                  </span>
                ) : (
                  <span className="status-pill status-inactif">Non actif</span>
                )}
              </h2>
              <p className="status-card-desc">
                {activeSubscription ? (
                  <>
                    Votre abonnement Voyageur est actif jusqu'au{" "}
                    <strong>
                      {new Date(activeSubscription.date_fin).toLocaleDateString("fr-FR")}
                    </strong>
                    . Vous pouvez contacter les professionnels en direct.
                  </>
                ) : (
                  "Souscrivez à un abonnement voyageur (5 000 FCFA/mois ou 50 000 FCFA/an) pour contacter directement les agences vérifiées."
                )}
              </p>
            </div>
            <div className="status-card-action">
              <Link
                to="/subscriptions"
                className={`btn ${activeSubscription ? "btn-outline" : "btn-primary"} btn-sm`}
              >
                {activeSubscription ? "Gérer" : "Découvrir les offres"}
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Accès rapides Voyageur */}
        <div className="dashboard-grid voyageur-grid">
          {/* 1. Professionnels */}
          <Link to="/professionals" className="dashboard-card quick-access-card">
            <div className="quick-access-icon">
              <IconSearch size={24} />
            </div>
            <h3 className="quick-access-title">Professionnels vérifiés</h3>
            <p className="quick-access-desc">
              Découvrez les agences formelles et guides touristiques certifiés par Sylla Voyage.
            </p>
            <span className="card-action-link">
              Parcourir l'annuaire
              <IconArrowRight size={14} />
            </span>
          </Link>

          {/* 2. Messagerie */}
          <Link to="/messages" className="dashboard-card quick-access-card">
            <div className="quick-access-icon">
              <IconMessage size={24} />
            </div>
            <h3 className="quick-access-title">Messages</h3>
            <p className="quick-access-desc">
              {conversations.length > 0
                ? `${conversations.length} conversation(s) en cours avec des professionnels.`
                : "Vos échanges directs avec les professionnels s'afficheront ici."}
            </p>
            <span className="card-action-link">
              Ouvrir la messagerie
              <IconArrowRight size={14} />
            </span>
          </Link>

          {/* 3. Guides & Publications */}
          <Link to="/publications" className="dashboard-card quick-access-card">
            <div className="quick-access-icon">
              <IconFileText size={24} />
            </div>
            <h3 className="quick-access-title">Guides & Conseils</h3>
            <p className="quick-access-desc">
              Consultez les informations pratiques et recommandations pour réussir votre séjour.
            </p>
            <span className="card-action-link">
              Lire les guides
              <IconArrowRight size={14} />
            </span>
          </Link>

          {/* 4. Profil */}
          <Link to="/profile" className="dashboard-card quick-access-card">
            <div className="quick-access-icon">
              <IconUser size={24} />
            </div>
            <h3 className="quick-access-title">Mon Profil</h3>
            <p className="quick-access-desc">
              Gérez vos coordonnées personnelles, téléphone et informations de compte.
            </p>
            <span className="card-action-link">
              Accéder au profil
              <IconArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
