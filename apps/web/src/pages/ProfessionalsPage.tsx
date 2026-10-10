import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { LockedSubscriptionPaywall } from "../components/LockedSubscriptionPaywall";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";
import { formatDisplayNoEmoji } from "../utils/textUtils";
import {
  IconSearch,
  IconShieldCheck,
  IconBuilding,
  IconRefresh,
  IconChevronRight,
  IconX,
} from "../components/Icons";

const DESTINATIONS = ["Tous", "Canada", "Sénégal", "Chine"];

export const ProfessionalsPage: React.FC = () => {
  const { loading: accessLoading, hasAccess } = useSubscriptionAccess();
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string>("Tous");
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

  // Filtrage local côté client (recherche textuelle + pastilles destinations)
  const filteredProfessionals = useMemo(() => {
    let list = professionals;

    // Filtre pastille destination (côté client sans modifier l'API)
    if (selectedDestination !== "Tous") {
      const destTerm = selectedDestination.toLowerCase();
      list = list.filter((pro) => {
        const text = `${pro.nom_structure || ""} ${pro.informations_professionnelles || ""} ${pro.description || ""}`.toLowerCase();
        return text.includes(destTerm);
      });
    }

    // Filtre champ de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((pro) => {
        const name = pro.nom_structure?.toLowerCase() || "";
        const info = pro.informations_professionnelles?.toLowerCase() || "";
        const desc = pro.description?.toLowerCase() || "";
        return name.includes(term) || info.includes(term) || desc.includes(term);
      });
    }

    return list;
  }, [professionals, searchTerm, selectedDestination]);

  // Génération d'une ligne de résumé courte et épurée (style SF / Apple)
  const getShortSummary = (pro: ApiProfessional): string => {
    if (pro.informations_professionnelles && !pro.informations_professionnelles.toLowerCase().includes("12345")) {
      return formatDisplayNoEmoji(pro.informations_professionnelles);
    }
    if (pro.description && !pro.description.toLowerCase().includes("12345")) {
      const lines = pro.description.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const cleaned = lines[0].replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, "").trim();
        return formatDisplayNoEmoji(cleaned.slice(0, 50));
      }
    }
    return "Agence de voyage vérifiée";
  };

  return (
    <div className="professionals-page">
      <div className="container">
        {/* En-tête épuré style Apple : Grand Titre « Explorer » */}
        <div className="explorer-header">
          <h1 className="ios-large-title">Explorer</h1>

          {/* Si l'utilisateur a accès, barre de recherche et filtres */}
          {hasAccess && (
            <>
              {/* Champ de recherche arrondi gris #E3E3E8 */}
              <div className="ios-search-box">
                <IconSearch size={18} className="ios-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="ios-search-input"
                  placeholder="Agence, ville, destination"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher une agence, une ville ou une destination"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="ios-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Effacer la recherche"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>

              {/* Filtres en pastilles horizontales (Tous, Canada, Sénégal, Chine) */}
              <div className="ios-filter-pills" role="tablist" aria-label="Filtrer par destination">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    role="tab"
                    aria-selected={selectedDestination === dest}
                    className={`ios-filter-pill ${selectedDestination === dest ? "is-active" : ""}`}
                    onClick={() => setSelectedDestination(dest)}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </>
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
            title="Débloquez l'annuaire"
            subtitle="Accès réservé aux membres pour contacter les agences vérifiées."
            perks={[
              "Annuaire complet des agences vérifiées",
              "Coordonnées directes et fiches détaillées",
              "Messagerie directe et demandes de devis",
              "Offres de voyage vérifiées en temps réel",
            ]}
          />
        )}

        {/* État de chargement des données si abonné */}
        {!accessLoading && hasAccess && loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement des agences..." size="large" />
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
              style={{ marginTop: "14px", minHeight: "44px" }}
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
              title="Aucune agence pour le moment"
              description="Les structures partenaires validées apparaîtront ici."
            />
          </div>
        )}

        {/* État vide si aucun résultat de recherche / filtre */}
        {!accessLoading && hasAccess && !loading && !error && professionals.length > 0 && filteredProfessionals.length === 0 && (
          <div className="state-container">
            <EmptyState
              icon={<IconSearch size={40} />}
              title="Aucun résultat trouvé"
              description={`Aucune agence ne correspond à vos critères de recherche.`}
              actionText="Réinitialiser les filtres"
              onAction={() => {
                setSearchTerm("");
                setSelectedDestination("Tous");
              }}
            />
          </div>
        )}

        {/* Liste des cartes d'agences épurées Apple */}
        {!accessLoading && hasAccess && !loading && !error && filteredProfessionals.length > 0 && (
          <div className="pro-grid" role="list">
            {filteredProfessionals.map((pro) => (
              <Link
                key={pro.id}
                to={`/professionals/${pro.id}`}
                className="ios-agency-card"
                id={`pro-card-${pro.id}`}
                role="listitem"
                aria-label={`Consulter la fiche de ${pro.nom_structure}`}
              >
                <div className="ios-agency-avatar" aria-hidden="true">
                  <IconBuilding size={24} strokeWidth="1.8" />
                </div>

                <div className="ios-agency-content">
                  <h2 className="ios-agency-name">{formatDisplayNoEmoji(pro.nom_structure)}</h2>
                  <p className="ios-agency-subtitle">{getShortSummary(pro)}</p>
                  <div className="ios-agency-verified">
                    <IconShieldCheck size={14} strokeWidth="1.8" />
                    <span>Vérifié</span>
                  </div>
                </div>

                <div className="ios-agency-chevron" aria-hidden="true">
                  <IconChevronRight size={18} strokeWidth="1.8" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
