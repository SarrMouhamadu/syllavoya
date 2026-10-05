import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";

export const ProfessionalsPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await professionalsApi.listVerified();
      if (response.success && response.data?.professionals) {
        setProfessionals(response.data.professionals);
      } else {
        setProfessionals([]);
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger la liste des professionnels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  return (
    <div className="professionals-page">
      <div className="container">
        {/* Header de section */}
        <div className="page-header">
          <span className="page-badge">🛡️ Confiance & Sécurité</span>
          <h1 className="page-title">Professionnels vérifiés</h1>
          <p className="page-subtitle">
            Toutes les structures ci-dessous ont été vérifiées et certifiées par Sylla Voyage.
          </p>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Recherche des professionnels vérifiés..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchProfessionals}
              style={{ marginTop: "12px" }}
            >
              🔄 Réessayer
            </button>
          </div>
        )}

        {/* État vide */}
        {!loading && !error && professionals.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon="🏢"
              title="Aucun professionnel vérifié pour le moment"
              description="Nos équipes sont en cours de validation de nouvelles structures partenaires. Revenez très bientôt !"
            />
          </div>
        )}

        {/* Liste des professionnels */}
        {!loading && !error && professionals.length > 0 && (
          <div className="pro-grid">
            {professionals.map((pro) => (
              <article key={pro.id} className="pro-card" id={`pro-card-${pro.id}`}>
                <div className="pro-card-header">
                  <div className="pro-avatar">
                    🏢
                  </div>
                  <div className="pro-meta">
                    <h2 className="pro-name">{pro.nom_structure}</h2>
                    <span className="badge-verified">
                      <span className="badge-icon">✓</span> Vérifié
                    </span>
                  </div>
                </div>

                <div className="pro-card-body">
                  {pro.description ? (
                    <p className="pro-description">{pro.description}</p>
                  ) : (
                    <p className="pro-description pro-desc-empty">
                      Structure certifiée sans description complémentaire.
                    </p>
                  )}

                  {pro.informations_professionnelles && (
                    <div className="pro-info-tag">
                      <span className="info-icon">📍</span>
                      <span className="info-text">{pro.informations_professionnelles}</span>
                    </div>
                  )}
                </div>

                <div className="pro-card-footer">
                  <Link
                    to={`/professionals/${pro.id}`}
                    className="btn btn-primary btn-block btn-lg"
                    id={`view-pro-${pro.id}`}
                  >
                    Voir le profil
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
