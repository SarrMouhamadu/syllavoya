import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  adminApi,
  type AdminVerificationItem,
  type VerificationDecision,
} from "../../api/admin";
import { fetchDocumentBlob } from "../../api/client";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { Alert } from "../../components/Alert";
import {
  IconClock,
  IconShieldCheck,
  IconX,
  IconBan,
  IconBuilding,
  IconPhone,
  IconMail,
  IconAlertTriangle,
  IconFileText,
  IconEye,
  IconMessage,
  IconCheck,
} from "../../components/Icons";

export const AdminVerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<AdminVerificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtre de statut : "EN_ATTENTE" par défaut
  const [statusFilter, setStatusFilter] = useState<string>("EN_ATTENTE");

  // Traitement d'une vérification
  const [activeVerification, setActiveVerification] = useState<AdminVerificationItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<VerificationDecision>("APPROUVEE");
  const [selectedPlan, setSelectedPlan] = useState<"MENSUEL" | "ANNUEL">("MENSUEL");
  const [commentaire, setCommentaire] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Téléchargement / visualisation du document
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listVerifications();
      if (res.success && res.data?.verifications) {
        setVerifications(res.data.verifications);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger les demandes de vérification. Vérifiez vos droits administrateur."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

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
    verification: AdminVerificationItem,
    defaultDecision: VerificationDecision
  ) => {
    setActiveVerification(verification);
    setSelectedDecision(defaultDecision);
    setSelectedPlan("MENSUEL");
    setCommentaire("");
    setSubmitError(null);
  };

  const handleTreatVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerification) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await adminApi.treatVerification(activeVerification.id, {
        decision: selectedDecision,
        plan: selectedDecision === "APPROUVEE" ? selectedPlan : undefined,
        commentaire: commentaire.trim() || undefined,
      });

      if (res.success) {
        // Rafraîchir les données
        await fetchVerifications();
        const decisionLabels: Record<string, string> = {
          APPROUVEE: `activé et approuvé (${selectedPlan === "ANNUEL" ? "Plan Annuel : 200 000 FCFA" : "Plan Mensuel : 20 000 FCFA"})`,
          REJETEE: "rejeté",
          SUSPENDUE: "suspendu",
          REVOQUEE: "révoqué",
        };
        setSuccessMessage(
          `Dossier professionnel mis à jour : ${decisionLabels[selectedDecision] || selectedDecision}`
        );
        setActiveVerification(null);
        setCommentaire("");
      }
    } catch (err: any) {
      setSubmitError(
        err?.message || "Erreur lors du traitement de la vérification."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Consulter la pièce d'identité de manière sécurisée (avec token JWT)
  const handleViewDocument = async (documentId: string) => {
    try {
      setDownloadingDocId(documentId);
      setError(null);
      const { blob, filename, mimeType } = await fetchDocumentBlob(documentId);
      const objectUrl = URL.createObjectURL(blob);

      // Si c'est un PDF ou une image, on peut l'ouvrir directement dans un nouvel onglet
      if (mimeType.includes("pdf") || mimeType.startsWith("image/")) {
        window.open(objectUrl, "_blank");
      } else {
        // Sinon déclencher le téléchargement
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setError(
        err?.message || "Impossible d'accéder au document sécurisé. Vérifiez vos permissions."
      );
    } finally {
      setDownloadingDocId(null);
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "EN_ATTENTE") {
      return (
        v.statut === "EN_ATTENTE" ||
        v.professionnel?.statut_verification === "EN_ATTENTE"
      );
    }
    if (statusFilter === "VERIFIE") {
      return (
        v.statut === "APPROUVEE" ||
        v.statut === "ACCEPTEE" ||
        v.professionnel?.statut_verification === "VERIFIE"
      );
    }
    if (statusFilter === "REJETE") {
      return (
        v.statut === "REJETEE" ||
        v.statut === "REFUSEE" ||
        v.professionnel?.statut_verification === "REJETE" ||
        v.professionnel?.statut_verification === "REFUSE"
      );
    }
    if (statusFilter === "SUSPENDU") {
      return (
        v.statut === "SUSPENDUE" ||
        v.professionnel?.statut_verification === "SUSPENDU"
      );
    }
    return true;
  });

  const getStatusBadge = (statut?: string | null) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <span className="badge-status-pending" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <IconClock size={13} /> En attente
          </span>
        );
      case "APPROUVEE":
      case "ACCEPTEE":
      case "VERIFIE":
        return (
          <span className="badge-verified" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <IconShieldCheck size={13} /> Vérifié
          </span>
        );
      case "REJETEE":
      case "REFUSEE":
      case "REJETE":
      case "REFUSE":
        return (
          <span className="badge-status-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <IconX size={13} /> Rejeté
          </span>
        );
      case "SUSPENDUE":
      case "SUSPENDU":
        return (
          <span className="badge-status-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <IconBan size={13} /> Suspendu
          </span>
        );
      default:
        return <span className="badge-status-neutral">{statut || "Inconnu"}</span>;
    }
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Fil d'Ariane navigation admin */}
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
          Vérifications professionnels
        </span>
      </div>

      {/* En-tête avec navigation des sections admin */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Dossiers de Vérification Professionnels
            </h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "14px" }}>
              Validation des pièces d'identité et approbation des comptes professionnels
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
              to="/admin/publications"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Publications
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

      {/* Filtres par statut */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {[
          { key: "EN_ATTENTE", label: "En attente" },
          { key: "VERIFIE", label: "Vérifiés" },
          { key: "REJETE", label: "Rejetés" },
          { key: "SUSPENDU", label: "Suspendus" },
          { key: "ALL", label: "Tous les dossiers" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`btn btn-sm ${statusFilter === tab.key ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: "20px", padding: "6px 16px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des vérifications */}
      {loading ? (
        <LoadingSpinner message="Chargement des demandes de vérification..." />
      ) : filteredVerifications.length === 0 ? (
        <EmptyState
          title="Aucun dossier trouvé"
          description={
            statusFilter === "EN_ATTENTE"
              ? "Aucun professionnel n'est actuellement en attente de vérification."
              : "Aucun dossier ne correspond à ce filtre."
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredVerifications.map((item) => {
            const proStatus = item.professionnel?.statut_verification || item.statut;
            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* En-tête de la carte */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                        {item.utilisateur?.nom} {item.utilisateur?.prenom}
                      </span>
                      {getStatusBadge(proStatus)}
                    </div>
                    {item.professionnel?.nom_structure && (
                      <div style={{ fontSize: "14px", color: "#475569", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconBuilding size={14} className="text-muted" /> Structure : <strong>{item.professionnel.nom_structure}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "13px", color: "#64748b", textAlign: "right" }}>
                    <div>Date de soumission : {formatDate(item.date_debut)}</div>
                    {item.date_decision && (
                      <div>Décision : {formatDate(item.date_decision)}</div>
                    )}
                  </div>
                </div>

                {/* Coordonnées & Pièces jointes */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  {/* Coordonnées du professionnel */}
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                      Coordonnées de contact
                    </div>
                    <div style={{ color: "#334155", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                        <IconPhone size={14} /> <strong>Téléphone :</strong>
                      </span>{" "}
                      <span style={{ color: "#0369a1", fontWeight: 600 }}>
                        {item.utilisateur?.telephone || "Non renseigné"}
                      </span>
                    </div>
                    <div style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                        <IconMail size={14} /> <strong>Email :</strong>
                      </span>{" "}
                      <span>
                        {item.utilisateur?.email && !item.utilisateur.email.endsWith("@syllavoyage.pro")
                          ? item.utilisateur.email
                          : "Non renseigné"}
                      </span>
                    </div>
                  </div>

                  {/* Pièce d'identité & documents sécurisés */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#166534", marginBottom: "6px" }}>
                      Pièce d'identité soumise
                    </div>
                    {item.documents.length === 0 ? (
                      <div style={{ color: "#dc2626", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconAlertTriangle size={14} /> Aucun document enregistré
                      </div>
                    ) : (
                      item.documents.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "6px",
                            padding: "6px 8px",
                            background: "#ffffff",
                            borderRadius: "6px",
                            border: "1px solid #dcfce7",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 500, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <IconFileText size={14} /> {doc.type_document === "PIECE_IDENTITE" ? "Pièce d'identité" : doc.type_document}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              Statut : {doc.statut}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc.id)}
                            disabled={downloadingDocId === doc.id}
                            className="btn btn-sm btn-outline-primary"
                            style={{
                              fontSize: "12px",
                              padding: "4px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {downloadingDocId === doc.id ? (
                              "Chargement..."
                            ) : (
                              <>
                                <IconEye size={13} /> Consulter
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {item.commentaire && (
                  <div
                    style={{
                      background: "#fef9c3",
                      border: "1px solid #fef08a",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#854d0e",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                    }}
                  >
                    <IconMessage size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <strong>Commentaire admin :</strong> {item.commentaire}
                    </div>
                  </div>
                )}

                {/* Actions de décision */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "8px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                  }}
                >
                  {proStatus === "EN_ATTENTE" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(item, "APPROUVEE")}
                        className="btn btn-sm btn-primary"
                        style={{ background: "#16a34a", borderColor: "#16a34a", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <IconCheck size={14} /> Activer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(item, "REJETEE")}
                        className="btn btn-sm btn-danger"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <IconX size={14} /> Rejeter
                      </button>
                    </>
                  )}

                  {proStatus === "VERIFIE" && (
                    <button
                      type="button"
                      onClick={() => handleOpenDecisionModal(item, "SUSPENDUE")}
                      className="btn btn-sm btn-secondary"
                      style={{ color: "#dc2626", borderColor: "#fca5a5", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <IconBan size={14} /> Suspendre le compte
                    </button>
                  )}

                  {(proStatus === "SUSPENDU" || proStatus === "REJETE") && (
                    <button
                      type="button"
                      onClick={() => handleOpenDecisionModal(item, "APPROUVEE")}
                      className="btn btn-sm btn-primary"
                      style={{ background: "#16a34a", borderColor: "#16a34a", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <IconCheck size={14} /> Ré-approuver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de décision */}
      {activeVerification && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 12px", color: "#0f172a" }}>
              Décision pour {activeVerification.utilisateur?.nom}
            </h3>

            {submitError && <Alert type="error" message={submitError} />}

            <form onSubmit={handleTreatVerification}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>
                  Décision à appliquer
                </label>
                <select
                  value={selectedDecision}
                  onChange={(e) => setSelectedDecision(e.target.value as VerificationDecision)}
                  className="form-input"
                  style={{ width: "100%", padding: "8px 12px" }}
                >
                  <option value="APPROUVEE">Activer le professionnel (Statut : VÉRIFIÉ)</option>
                  <option value="REJETEE">Rejeter le dossier</option>
                  <option value="SUSPENDUE">Suspendre le professionnel</option>
                  <option value="REVOQUEE">Révoquer le statut professionnel</option>
                </select>
              </div>

              {selectedDecision === "APPROUVEE" && (
                <div
                  className="form-group"
                  style={{
                    marginBottom: "16px",
                    padding: "14px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, color: "#166534", marginBottom: "10px", display: "block" }}
                  >
                    Formule d'abonnement professionnel :
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#1e293b",
                        padding: "8px 12px",
                        background: selectedPlan === "MENSUEL" ? "#dcfce7" : "#ffffff",
                        border: selectedPlan === "MENSUEL" ? "1px solid #86efac" : "1px solid #e2e8f0",
                        borderRadius: "6px",
                      }}
                    >
                      <input
                        type="radio"
                        name="planChoice"
                        value="MENSUEL"
                        checked={selectedPlan === "MENSUEL"}
                        onChange={() => setSelectedPlan("MENSUEL")}
                      />
                      <span>
                        <strong>Mensuel : 20 000 FCFA</strong> (durée : 1 mois / 30 jours)
                      </span>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#1e293b",
                        padding: "8px 12px",
                        background: selectedPlan === "ANNUEL" ? "#dcfce7" : "#ffffff",
                        border: selectedPlan === "ANNUEL" ? "1px solid #86efac" : "1px solid #e2e8f0",
                        borderRadius: "6px",
                      }}
                    >
                      <input
                        type="radio"
                        name="planChoice"
                        value="ANNUEL"
                        checked={selectedPlan === "ANNUEL"}
                        onChange={() => setSelectedPlan("ANNUEL")}
                      />
                      <span>
                        <strong>Annuel : 200 000 FCFA</strong> (durée : 12 mois / 365 jours)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>
                  Commentaire / Justification (facultatif)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="ex: Dossier conforme. Activation administrative validée."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveVerification(null)}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    background:
                      selectedDecision === "APPROUVEE"
                        ? "#16a34a"
                        : selectedDecision === "REJETEE"
                        ? "#dc2626"
                        : "#2563eb",
                  }}
                >
                  {submitting
                    ? "Enregistrement..."
                    : selectedDecision === "APPROUVEE"
                    ? `Activer le professionnel (${selectedPlan === "ANNUEL" ? "200 000 FCFA" : "20 000 FCFA"})`
                    : "Confirmer la décision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
