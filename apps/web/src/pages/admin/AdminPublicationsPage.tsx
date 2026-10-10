import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  adminApi,
  type AdminPublication,
  type PublicationDecision,
} from "../../api/admin";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { Alert } from "../../components/Alert";
import { IconCheck, IconX, IconTrash } from "../../components/Icons";
import { parsePublicationContent } from "../../api/publications";

export const AdminPublicationsPage: React.FC = () => {
  const [publications, setPublications] = useState<AdminPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Suppression d'une publication (confirmation avant suppression réelle)
  const [deleteModalPub, setDeleteModalPub] = useState<AdminPublication | null>(null);
  const [deletingPubId, setDeletingPubId] = useState<string | null>(null);

  // Filtre de statut : "EN_ATTENTE" par défaut pour afficher en priorité les publications à modérer
  const [statusFilter, setStatusFilter] = useState<string>("EN_ATTENTE");

  // Traitement d'une publication (modale de décision)
  const [activePublication, setActivePublication] = useState<AdminPublication | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<PublicationDecision>("APPROUVEE");
  const [commentaire, setCommentaire] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listPublications();
      if (res.success && res.data?.publications) {
        setPublications(res.data.publications);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger les publications. Vérifiez vos permissions administrateur."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenDecisionModal = (
    pub: AdminPublication,
    defaultDecision: PublicationDecision
  ) => {
    setActivePublication(pub);
    setSelectedDecision(defaultDecision);
    setCommentaire(pub.commentaire_moderation || "");
    setSubmitError(null);
  };

  const handleTreatPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePublication) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await adminApi.treatPublication(activePublication.id, {
        decision: selectedDecision,
        commentaire: commentaire.trim() || undefined,
      });

      if (res.success) {
        await fetchPublications();
        const label =
          selectedDecision === "APPROUVEE"
            ? "approuvée et publiée sur le site public."
            : "rejetée (l'auteur pourra la corriger).";
        setSuccessMessage(`La publication « ${activePublication.titre} » a été ${label}`);
        setActivePublication(null);
        setCommentaire("");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Échec du traitement de la modération.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPub) return;
    try {
      setDeletingPubId(deleteModalPub.id);
      setError(null);
      const res = await adminApi.deletePublication(deleteModalPub.id);
      if (res.success) {
        setSuccessMessage(`La publication « ${deleteModalPub.titre} » a été supprimée définitivement de la base de données.`);
        setDeleteModalPub(null);
        await fetchPublications();
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de supprimer la publication.");
    } finally {
      setDeletingPubId(null);
    }
  };

  // Filtrage local selon le statut sélectionné
  const filteredPublications = publications.filter((p) => {
    if (statusFilter === "ALL") return true;
    return p.statut === statusFilter;
  });

  const pendingCount = publications.filter((p) => p.statut === "EN_ATTENTE").length;
  const approvedCount = publications.filter((p) => p.statut === "APPROUVEE").length;
  const rejectedCount = publications.filter((p) => p.statut === "REJETEE").length;

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#fef3c7",
              color: "#92400e",
            }}
          >
            ⏳ En attente de modération
          </span>
        );
      case "APPROUVEE":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#dcfce7",
              color: "#166534",
            }}
          >
            <IconCheck size={12} /> Approuvée (Publique)
          </span>
        );
      case "REJETEE":
      case "REFUSEE":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#fee2e2",
              color: "#991b1b",
            }}
          >
            <IconX size={12} /> Rejetée
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#f1f5f9",
              color: "#475569",
            }}
          >
            {statut}
          </span>
        );
    }
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Fil d'Ariane */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
        <Link to="/" style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}>
          Accueil
        </Link>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ color: "#0f172a", fontSize: "14px", fontWeight: 600 }}>
          Administration
        </span>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ color: "#2563eb", fontSize: "14px", fontWeight: 600 }}>
          Modération des publications
        </span>
      </div>

      {/* En-tête */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Modération des Publications Professionnelles
            </h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "14px" }}>
              Validation du contenu et respect des chartes éditoriales avant affichage public
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              to="/admin/users"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Utilisateurs & Agences
            </Link>
            <Link
              to="/admin/verifications"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Vérifications
            </Link>
            <Link
              to="/admin/reports"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Signalements
            </Link>
            <Link
              to="/admin/audit-logs"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Journal d'audit
            </Link>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      {/* Onglets de filtrage par statut */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "1.5rem",
          paddingBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setStatusFilter("EN_ATTENTE")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: statusFilter === "EN_ATTENTE" ? "#eff6ff" : "transparent",
            color: statusFilter === "EN_ATTENTE" ? "#2563eb" : "#64748b",
            fontWeight: statusFilter === "EN_ATTENTE" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          id="tab-publications-pending"
        >
          <span>⏳ En attente</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              background: statusFilter === "EN_ATTENTE" ? "#2563eb" : "#e2e8f0",
              color: statusFilter === "EN_ATTENTE" ? "#ffffff" : "#475569",
            }}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROUVEE")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: statusFilter === "APPROUVEE" ? "#eff6ff" : "transparent",
            color: statusFilter === "APPROUVEE" ? "#2563eb" : "#64748b",
            fontWeight: statusFilter === "APPROUVEE" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          id="tab-publications-approved"
        >
          <span>Approuvées</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              background: statusFilter === "APPROUVEE" ? "#2563eb" : "#e2e8f0",
              color: statusFilter === "APPROUVEE" ? "#ffffff" : "#475569",
            }}
          >
            {approvedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REJETEE")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: statusFilter === "REJETEE" ? "#eff6ff" : "transparent",
            color: statusFilter === "REJETEE" ? "#2563eb" : "#64748b",
            fontWeight: statusFilter === "REJETEE" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          id="tab-publications-rejected"
        >
          <span>Rejetées</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              background: statusFilter === "REJETEE" ? "#2563eb" : "#e2e8f0",
              color: statusFilter === "REJETEE" ? "#ffffff" : "#475569",
            }}
          >
            {rejectedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: statusFilter === "ALL" ? "#eff6ff" : "transparent",
            color: statusFilter === "ALL" ? "#2563eb" : "#64748b",
            fontWeight: statusFilter === "ALL" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          id="tab-publications-all"
        >
          <span>Toutes</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              background: statusFilter === "ALL" ? "#2563eb" : "#e2e8f0",
              color: statusFilter === "ALL" ? "#ffffff" : "#475569",
            }}
          >
            {publications.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Chargement des publications en cours..." />
      ) : filteredPublications.length === 0 ? (
        <EmptyState
          title="Aucune publication trouvée"
          description={
            statusFilter === "EN_ATTENTE"
              ? "Toutes les publications soumises ont été modérées."
              : "Aucune publication ne correspond à ce filtre pour le moment."
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {filteredPublications.map((pub) => {
            const author = pub.professionnel;
            const user = author?.utilisateur;

            return (
              <div
                key={pub.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease",
                }}
                id={`publication-card-${pub.id}`}
              >
                {/* En-tête de la carte */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1rem",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "1rem",
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      {getStatusBadge(pub.statut)}
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Créée le {formatDate(pub.date_creation)}
                      </span>
                      {pub.date_publication && (
                        <span style={{ fontSize: "12px", color: "#166534" }}>
                          • Publiée le {formatDate(pub.date_publication)}
                        </span>
                      )}
                    </div>
                    <h2
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      {pub.titre}
                    </h2>
                  </div>

                  {/* Actions de modération */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {pub.statut !== "APPROUVEE" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(pub, "APPROUVEE")}
                        className="btn btn-primary btn-sm"
                        style={{
                          backgroundColor: "#16a34a",
                          borderColor: "#16a34a",
                          color: "#ffffff",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        id={`btn-approve-${pub.id}`}
                      >
                        <IconCheck size={14} />
                        <span>Approuver</span>
                      </button>
                    )}

                    {pub.statut !== "REJETEE" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(pub, "REJETEE")}
                        className="btn btn-secondary btn-sm"
                        style={{
                          backgroundColor: "#ffffff",
                          borderColor: "#dc2626",
                          color: "#dc2626",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        id={`btn-reject-${pub.id}`}
                      >
                        <IconX size={14} />
                        <span>Rejeter</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteModalPub(pub)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: "#b91c1c",
                        color: "#b91c1c",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      id={`btn-delete-${pub.id}`}
                    >
                      <IconTrash size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                {/* Contenu de la publication */}
                {(() => {
                  const parsed = parsePublicationContent(pub.contenu);
                  return (
                    <div style={{ marginBottom: "1.25rem" }}>
                      {parsed.photoUrl && (
                        <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                          <img
                            src={parsed.photoUrl}
                            alt={pub.titre}
                            style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}
                      <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", margin: "0 0 6px", textTransform: "uppercase" }}>
                        Contenu rédigé :
                      </h4>
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          padding: "1rem",
                          fontSize: "14px",
                          color: "#334155",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        {parsed.text}
                      </div>
                    </div>
                  );
                })()}

                {/* Information sur l'auteur professionnel */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    padding: "1rem",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Structure / Agence :</span>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                      {author?.nom_structure || "Structure non renseignée"}
                    </strong>
                    {author?.statut_verification && (
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: author.statut_verification === "VERIFIE" ? "#166534" : "#92400e",
                        }}
                      >
                        ({author.statut_verification === "VERIFIE" ? "Vérifié" : "En cours de vérification"})
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Professionnel :</span>
                    <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                      {user ? `${user.prenom || ""} ${user.nom || ""}`.trim() : "Non renseigné"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Téléphone :</span>
                    <span style={{ fontSize: "14px", color: "#0f172a" }}>
                      {user?.telephone || "Non renseigné"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Email :</span>
                    <span style={{ fontSize: "14px", color: "#0f172a" }}>
                      {user?.email && !user.email.endsWith("@syllavoyage.pro") ? user.email : "Non renseigné"}
                    </span>
                  </div>
                </div>

                {/* Commentaire de modération si disponible */}
                {pub.commentaire_moderation && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef3c7",
                      fontSize: "13px",
                      color: "#92400e",
                    }}
                  >
                    <strong>Commentaire de modération enregistré :</strong> {pub.commentaire_moderation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de traitement de la modération */}
      {activePublication && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setActivePublication(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "540px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginTop: 0, marginBottom: "0.5rem" }}>
              Décision de modération
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "1.5rem" }}>
              Publication : <strong>« {activePublication.titre} »</strong>
            </p>

            {submitError && (
              <div style={{ marginBottom: "1rem" }}>
                <Alert type="error" message={submitError} onClose={() => setSubmitError(null)} />
              </div>
            )}

            <form onSubmit={handleTreatPublication}>
              {/* Choix de la décision */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Action à appliquer :
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <label
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedDecision === "APPROUVEE" ? "#16a34a" : "#e2e8f0"}`,
                      backgroundColor: selectedDecision === "APPROUVEE" ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: selectedDecision === "APPROUVEE" ? "#166534" : "#475569",
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="APPROUVEE"
                      checked={selectedDecision === "APPROUVEE"}
                      onChange={() => setSelectedDecision("APPROUVEE")}
                      style={{ accentColor: "#16a34a" }}
                    />
                    Approuver
                  </label>

                  <label
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedDecision === "REJETEE" ? "#dc2626" : "#e2e8f0"}`,
                      backgroundColor: selectedDecision === "REJETEE" ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: selectedDecision === "REJETEE" ? "#991b1b" : "#475569",
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="REJETEE"
                      checked={selectedDecision === "REJETEE"}
                      onChange={() => setSelectedDecision("REJETEE")}
                      style={{ accentColor: "#dc2626" }}
                    />
                    Rejeter
                  </label>
                </div>
              </div>

              {/* Commentaire de modération */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="moderation-comment"
                  style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}
                >
                  Commentaire de modération (optionnel) :
                </label>
                <textarea
                  id="moderation-comment"
                  rows={3}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder={
                    selectedDecision === "APPROUVEE"
                      ? "Note interne ou félicitations..."
                      : "Expliquez le motif du refus pour guider le professionnel dans sa correction..."
                  }
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Boutons d'action */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActivePublication(null)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: selectedDecision === "APPROUVEE" ? "#16a34a" : "#dc2626",
                    borderColor: selectedDecision === "APPROUVEE" ? "#16a34a" : "#dc2626",
                  }}
                  disabled={submitting}
                  id="btn-confirm-moderation"
                >
                  {submitting
                    ? "Enregistrement..."
                    : selectedDecision === "APPROUVEE"
                    ? "Confirmer l'approbation"
                    : "Confirmer le rejet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation avant suppression définitive */}
      {deleteModalPub && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => !deletingPubId && setDeleteModalPub(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconTrash size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                  Confirmer la suppression
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Action irréversible réservée aux administrateurs
                </p>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Êtes-vous sûr de vouloir supprimer définitivement la publication « <strong>{deleteModalPub.titre}</strong> » ?
              Cette action est irréversible et supprimera réellement la publication en base de données.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteModalPub(null)}
                disabled={Boolean(deletingPubId)}
                id="btn-cancel-delete"
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingPubId)}
                id="btn-confirm-delete"
              >
                {deletingPubId ? (
                  <span>Suppression en cours...</span>
                ) : (
                  <>
                    <IconTrash size={14} />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPublicationsPage;
