import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { publicationsApi, parsePublicationContent, type ApiPublication } from "../api/publications";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";
import { PublicationInteractions } from "../components/PublicationInteractions";
import {
  IconFileText,
  IconBuilding,
  IconCalendar,
  IconRefresh,
  IconArrowRight,
  IconLock,
  IconShieldCheck,
} from "../components/Icons";

export const PublicationsPage: React.FC = () => {
  const { loading: accessLoading, hasAccess } = useSubscriptionAccess();
  const [publications, setPublications] = useState<ApiPublication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicationsApi.listPublic();
      if (res.success && res.data?.publications) {
        setPublications(res.data.publications);
      } else {
        setPublications([]);
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger les offres et publications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  return (
    <div className="publications-page">
      <div className="container">
        {/* Header de section */}
        <div className="page-header">
          <span className="page-header-badge">Offres & Actualités</span>
          <h1 className="page-title">Offres & Publications de Voyage</h1>
          <p className="page-subtitle">
            Découvrez toutes les offres de séjours, circuits et annonces partagés par l'administration et les agences vérifiées de Sylla Voyage.
          </p>
        </div>

        {/* État de chargement des publications */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement des offres et publications de voyage..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchPublications}
              style={{ marginTop: "14px" }}
            >
              <IconRefresh size={16} />
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {/* Bannière discrète d'abonnement si non abonné */}
        {!accessLoading && !hasAccess && !loading && !error && publications.length > 0 && (
          <div className="traveler-sub-banner" style={{ marginBottom: "28px" }}>
            <div className="traveler-sub-banner-text">
              <IconLock size={18} />
              <span>Abonnez-vous pour contacter directement les agences et débloquer tous les détails exclusifs.</span>
            </div>
            <Link to="/subscriptions" className="btn btn-primary btn-sm">
              Découvrir les offres (5 000 FCFA/mois)
            </Link>
          </div>
        )}

        {/* État vide */}
        {!loading && !error && publications.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon={<IconFileText size={40} />}
              title="Aucune offre publiée pour le moment"
              description="Les agences vérifiées et l'administration publieront très prochainement leurs séjours et opportunités de voyage."
            />
          </div>
        )}

        {/* Liste des publications */}
        {!loading && !error && publications.length > 0 && (
          <div className="pub-grid">
            {publications.map((pub) => {
              const displayDate = pub.date_publication || pub.date_creation;
              const formattedDate = displayDate
                ? new Date(displayDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : null;

              const parsed = parsePublicationContent(pub.contenu);
              const isOfficialAdmin =
                pub.professionnel?.nom_structure?.toLowerCase().includes("admin") ||
                pub.professionnel?.nom_structure === "Administration Sylla Voyage";

              return (
                <article key={pub.id} className="pub-card" id={`pub-card-${pub.id}`}>
                  {parsed.photoUrl && (
                    <div className="pub-card-media">
                      <img src={parsed.photoUrl} alt={pub.titre} className="pub-card-img" />
                    </div>
                  )}

                  <div className="pub-card-header">
                    <span className={`pub-tag ${isOfficialAdmin ? "pub-tag-official" : ""}`}>
                      {isOfficialAdmin ? "Officiel Sylla Voyage" : "Offre d'agence"}
                    </span>
                    {pub.professionnel && (
                      <span className="pub-author">
                        <IconBuilding size={14} />
                        <span>{pub.professionnel.nom_structure}</span>
                        {!isOfficialAdmin && (
                          <IconShieldCheck size={13} style={{ color: "var(--color-primary)", marginLeft: "4px" }} />
                        )}
                      </span>
                    )}
                  </div>

                  <h2 className="pub-title">{pub.titre}</h2>

                  <p className="pub-content-preview">{parsed.text}</p>

                  {/* Likes & Commentaires */}
                  <PublicationInteractions publicationId={pub.id} compact />

                  <div className="pub-card-footer">
                    {formattedDate && (
                      <span className="pub-date">
                        <IconCalendar size={14} />
                        <span>Publié le {formattedDate}</span>
                      </span>
                    )}
                    <Link
                      to={`/publications/${pub.id}`}
                      className="btn btn-primary btn-block btn-lg"
                      id={`read-pub-${pub.id}`}
                    >
                      <span>Consulter l'offre</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

