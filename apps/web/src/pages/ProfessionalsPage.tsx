import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { LockedSubscriptionPaywall } from "../components/LockedSubscriptionPaywall";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";
import {
  IconSearch,
  IconShieldCheck,
  IconBuilding,
  IconMapPin,
  IconArrowRight,
  IconRefresh,
} from "../components/Icons";

export const ProfessionalsPage: React.FC = () => {
  const { loading: accessLoading, hasAccess } = useSubscriptionAccess();
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (hasAccess) {
      fetchProfessionals();
    }
  }, [hasAccess, fetchProfessionals]);

  // Filtrage local en temps réel sur les données réelles
  const filteredProfessionals = useMemo(() => {
    if (!searchTerm.trim()) return professionals;
    const term = searchTerm.toLowerCase();
    return professionals.filter((pro) => {
      const name = pro.nom_structure?.toLowerCase() || "";
      const info = pro.informations_professionnelles?.toLowerCase() || "";
      const desc = pro.description?.toLowerCase() || "";
      return name.includes(term) || info.includes(term) || desc.includes(term);
    });
  }, [professionals, searchTerm]);

  return (
    <div className="professionals-page">
      <div className="container">
        {/* En-tête de section */}
        <div className="page-header">
          <div className="page-header-badge">
            <IconShieldCheck size={16} />
            <span>Annuaire Officiel</span>
          </div>
          <h1 className="page-title">Professionnels du voyage vérifiés</h1>
          <p className="page-subtitle">
            Consultez les structures et guides enregistrés dont le dossier administratif a été formellement validé par Sylla Voyage.
          </p>

          {/* Si l'utilisateur n'a pas accès, on ne propose pas la recherche */}
          {hasAccess && (
            <div className="search-bar-wrap">
              <div className="search-input-box">
                <IconSearch size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher par nom d'agence, ville ou activité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher un professionnel"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm("")}
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* État de chargement de l'accès */}
        {accessLoading && (
          <div className="center-container">
            <LoadingSpinner message="Vérification de votre statut d'accès..." size="large" />
          </div>
        )}

        {/* Verrouillage payant si non abonné */}
        {!accessLoading && !hasAccess && (
          <LockedSubscriptionPaywall
            title="Accès aux agences de voyage réservé aux abonnés"
            subtitle="Pour consulter l'annuaire complet des agences vérifiées et entrer en contact, un abonnement actif est requis."
            perks={[
              "Accès illimité à l'annuaire des agences et guides certifiés",
              "Consultation des coordonnées et des fiches complètes",
              "Messagerie directe et demandes de devis sécurisées",
              "Règlement simple et instantané via Wave ou Orange Money (5 000 FCFA/mois)",
            ]}
          />
        )}

        {/* État de chargement des données si abonné */}
        {!accessLoading && hasAccess && loading && (
          <div className="center-container">
            <LoadingSpinner message="Recherche des professionnels vérifiés..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!accessLoading && hasAccess && !loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchProfessionals}
              style={{ marginTop: "14px" }}
            >
              <IconRefresh size={16} />
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {/* État vide si aucune agence en base */}
        {!accessLoading && hasAccess && !loading && !error && professionals.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon={<IconBuilding size={40} />}
              title="Aucun professionnel vérifié pour le moment"
              description="Notre équipe procède actuellement à l'audit de nouvelles structures partenaires. Les agences validées apparaîtront ici."
            />
          </div>
        )}

        {/* État vide si aucun résultat de recherche */}
        {!accessLoading && hasAccess && !loading && !error && professionals.length > 0 && filteredProfessionals.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon={<IconSearch size={40} />}
              title="Aucun résultat pour cette recherche"
              description={`Aucun professionnel ne correspond aux termes "${searchTerm}".`}
              actionText="Réinitialiser la recherche"
              onAction={() => setSearchTerm("")}
            />
          </div>
        )}

        {/* Grille de cartes réelles entièrement cliquables */}
        {!accessLoading && hasAccess && !loading && !error && filteredProfessionals.length > 0 && (
          <div className="pro-grid">
            {filteredProfessionals.map((pro) => (
              <Link
                key={pro.id}
                to={`/professionals/${pro.id}`}
                className="pro-card-link"
                id={`pro-card-${pro.id}`}
              >
                <article className="pro-card">
                  <div className="pro-card-header">
                    <div className="pro-avatar">
                      <IconBuilding size={24} />
                    </div>
                    <div className="pro-meta">
                      <h2 className="pro-name">{pro.nom_structure}</h2>
                      <span className="badge-verified">
                        <IconShieldCheck size={14} />
                        <span>Vérifié</span>
                      </span>
                    </div>
                  </div>

                  <div className="pro-card-body">
                    {pro.description && !pro.description.toLowerCase().includes("12345") && !pro.description.toLowerCase().includes("licence") ? (
                      <p className="pro-description">{pro.description}</p>
                    ) : null}

                    {pro.informations_professionnelles &&
                    !pro.informations_professionnelles.toLowerCase().includes("12345") &&
                    !pro.informations_professionnelles.toLowerCase().includes("licence") ? (
                      <div className="pro-info-tag">
                        <IconMapPin size={14} />
                        <span className="info-text">{pro.informations_professionnelles}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="pro-card-footer">
                    <span className="view-profile-cta">
                      <span>Consulter la fiche</span>
                      <IconArrowRight size={14} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
