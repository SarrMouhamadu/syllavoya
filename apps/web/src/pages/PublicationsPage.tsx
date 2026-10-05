import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { publicationsApi, type ApiPublication } from "../api/publications";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import {
  IconFileText,
  IconBuilding,
  IconCalendar,
  IconRefresh,
  IconArrowRight,
} from "../components/Icons";

export const PublicationsPage: React.FC = () => {
  const [publications, setPublications] = useState<ApiPublication[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError(err?.message || "Impossible de charger les publications de voyage.");
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
          <span className="page-header-badge">Guides & Conseils</span>
          <h1 className="page-title">Publications & Conseils de Voyage</h1>
          <p className="page-subtitle">
            Circuits, recommandations et informations rédigés par les professionnels certifiés de Sylla Voyage.
          </p>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement des publications de voyage..." size="large" />
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

        {/* État vide */}
        {!loading && !error && publications.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon={<IconFileText size={40} />}
              title="Aucune publication disponible pour le moment"
              description="Les professionnels vérifiés publieront très prochainement leurs itinéraires et informations de voyage."
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

              return (
                <article key={pub.id} className="pub-card" id={`pub-card-${pub.id}`}>
                  <div className="pub-card-header">
                    <span className="pub-tag">Circuit & Conseils</span>
                    {pub.professionnel && (
                      <span className="pub-author">
                        <IconBuilding size={14} />
                        <span>{pub.professionnel.nom_structure}</span>
                      </span>
                    )}
                  </div>

                  <h2 className="pub-title">{pub.titre}</h2>

                  <p className="pub-content-preview">{pub.contenu}</p>

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
                      <span>Lire la suite</span>
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
