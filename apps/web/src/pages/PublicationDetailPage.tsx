import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { publicationsApi, type ApiPublication } from "../api/publications";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";

export const PublicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [pub, setPub] = useState<ApiPublication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublication = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await publicationsApi.getById(id);
      if (res.success && res.data?.publication) {
        setPub(res.data.publication);
      } else {
        setError("Publication introuvable.");
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger cette publication.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPublication();
  }, [fetchPublication]);

  const displayDate = pub?.date_publication || pub?.date_creation;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="pub-detail-page">
      <div className="container">
        {/* Navigation retour */}
        <div className="back-nav">
          <Link to="/publications" className="back-link">
            ← Retour à la liste des publications
          </Link>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement de la publication..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/publications" className="btn btn-outline" style={{ marginTop: "12px" }}>
              Consulter les autres publications
            </Link>
          </div>
        )}

        {/* Fiche détaillée de la publication */}
        {!loading && !error && pub && (
          <article className="pub-detail-card">
            <header className="pub-detail-header">
              <div className="pub-detail-meta-top">
                <span className="badge-verified">
                  <span className="badge-icon">✓</span> Publication approuvée
                </span>
                {formattedDate && (
                  <time className="pub-date">Publié le {formattedDate}</time>
                )}
              </div>

              <h1 className="pub-detail-title">{pub.titre}</h1>

              {pub.professionnel && (
                <div className="pub-author-card">
                  <div className="pub-author-avatar">🏢</div>
                  <div className="pub-author-info">
                    <span className="pub-author-label">Proposé par la structure</span>
                    <strong className="pub-author-name">
                      {pub.professionnel.nom_structure}
                    </strong>
                  </div>
                  <Link
                    to={`/professionals/${pub.professionnel_id}`}
                    className="btn btn-outline btn-sm pub-author-btn"
                  >
                    Voir le profil
                  </Link>
                </div>
              )}
            </header>

            <div className="pub-detail-body">
              <p className="pub-detail-content">{pub.contenu}</p>
            </div>

            {pub.professionnel && (
              <footer className="pub-detail-footer">
                <div className="pub-cta-box">
                  <h3 className="pub-cta-title">Ce programme vous intéresse ?</h3>
                  <p className="pub-cta-text">
                    Prenez contact directement avec <strong>{pub.professionnel.nom_structure}</strong> pour réserver ou poser vos questions.
                  </p>
                  <Link
                    to={`/professionals/${pub.professionnel_id}`}
                    className="btn btn-primary btn-lg btn-block"
                  >
                    Contacter cette structure
                  </Link>
                </div>
              </footer>
            )}
          </article>
        )}
      </div>
    </div>
  );
};
