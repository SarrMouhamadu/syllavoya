import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminReport, type ReportDecision } from "../../api/admin";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { Alert } from "../../components/Alert";
import {
  IconShieldCheck,
  IconFileText,
  IconFlag,
  IconCheck,
  IconX,
  IconRefresh,
  IconScale,
  IconUser,
} from "../../components/Icons";

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État du signalement en cours de traitement
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<ReportDecision>("TRAITE");
  const [commentaire, setCommentaire] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listReports();
      if (res.success && res.data?.reports) {
        setReports(res.data.reports);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger les signalements. Veuillez vérifier vos droits administrateur."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Formatter la date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Traiter un signalement via PATCH /api/admin/reports/:id
  const handleTreatReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportId) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await adminApi.treatReport(activeReportId, {
        decision: selectedDecision,
        commentaire: commentaire.trim() || undefined,
      });

      if (res.success && res.data?.report) {
        // Mettre à jour l'affichage avec la réponse réelle du backend
        setReports((prev) =>
          prev.map((r) => (r.id === activeReportId ? res.data.report : r))
        );
        setSuccessMessage(`Signalement mis à jour avec le statut : ${selectedDecision}`);
        setActiveReportId(null);
        setCommentaire("");
      }
    } catch (err: any) {
      setSubmitError(
        err?.message || "Erreur lors du traitement du signalement. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Badge CSS selon statut
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <span className="badge-status-pending">
            <IconRefresh size={12} /> En attente
          </span>
        );
      case "RESOLU":
        return (
          <span className="badge-verified">
            <IconCheck size={12} /> Résolu
          </span>
        );
      case "TRAITE":
        return (
          <span className="badge-status-neutral">
            <IconCheck size={12} /> Traité
          </span>
        );
      case "REJETE":
        return (
          <span className="badge-status-expired">
            <IconX size={12} /> Rejeté
          </span>
        );
      case "CLASSE":
        return (
          <span className="badge-status-neutral">
            <IconFileText size={12} /> Classé
          </span>
        );
      default:
        return <span className="badge-status-neutral">{statut}</span>;
    }
  };

  return (
    <div className="admin-page">
      <div className="container admin-container">
        {/* En-tête Administration */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <span className="page-header-badge">Console d'administration</span>
              <h1 className="page-title">Gestion des Signalements</h1>
              <p className="page-subtitle">
                Examinez les signalements émis par les utilisateurs et appliquez les décisions requises.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Admin */}
        <div className="admin-nav-tabs">
          <Link to="/admin/users" className="admin-tab-btn" id="tab-admin-users">
            <IconUser size={16} />
            <span>Utilisateurs & Agences</span>
          </Link>
          <Link to="/admin/verifications" className="admin-tab-btn" id="tab-admin-verifications">
            <IconShieldCheck size={16} />
            <span>Vérifications</span>
          </Link>
          <Link to="/admin/publications" className="admin-tab-btn" id="tab-admin-publications">
            <IconFileText size={16} />
            <span>Publications</span>
          </Link>
          <Link to="/admin/reports" className="admin-tab-btn is-active" id="tab-admin-reports">
            <IconFlag size={16} />
            <span>Signalements ({reports.length})</span>
          </Link>
          <Link to="/admin/audit-logs" className="admin-tab-btn" id="tab-admin-audit-logs">
            <IconFileText size={16} />
            <span>Journal d'audit</span>
          </Link>
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="mb-3">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {successMessage && (
          <div className="mb-3">
            <Alert
              type="success"
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div className="center-container py-5">
            <LoadingSpinner message="Chargement des signalements..." size="large" />
          </div>
        )}

        {/* État vide */}
        {!loading && !error && reports.length === 0 && (
          <div className="py-4">
            <EmptyState
              icon={<IconShieldCheck size={36} />}
              title="Aucun signalement"
              description="Aucun signalement n'a été enregistré pour le moment."
            />
          </div>
        )}

        {/* Liste des signalements */}
        {!loading && !error && reports.length > 0 && (
          <div className="admin-reports-list">
            {reports.map((report) => {
              const isEditing = activeReportId === report.id;

              return (
                <div
                  key={report.id}
                  className={`admin-report-card ${
                    report.statut === "EN_ATTENTE" ? "report-card-pending" : ""
                  }`}
                  id={`report-card-${report.id}`}
                >
                  <div className="report-card-header">
                    <div className="report-header-left">
                      <span className="report-type-badge">
                        Type : {report.type_cible}
                      </span>
                      {getStatusBadge(report.statut)}
                    </div>
                    <span className="report-date">
                      {formatDate(report.date_creation)}
                    </span>
                  </div>

                  <div className="report-card-body">
                    <div className="report-motif-row">
                      <strong className="report-motif-title">{report.motif}</strong>
                    </div>

                    {report.description && (
                      <p className="report-description">{report.description}</p>
                    )}

                    <div className="report-metadata-grid">
                      <div className="report-meta-item">
                        <span className="meta-label">Signalé par :</span>
                        <span className="meta-val">
                          {report.signale_par
                            ? `${report.signale_par.prenom} ${report.signale_par.nom} (${report.signale_par.role})`
                            : "Utilisateur inconnu"}
                        </span>
                      </div>

                      <div className="report-meta-item">
                        <span className="meta-label">ID Cible :</span>
                        <code className="meta-code">{report.cible_id}</code>
                      </div>

                      <div className="report-meta-item">
                        <span className="meta-label">ID Signalement :</span>
                        <code className="meta-code">{report.id}</code>
                      </div>
                    </div>
                  </div>

                  {/* Formulaire de traitement inline */}
                  {isEditing ? (
                    <form onSubmit={handleTreatReport} className="report-treatment-form">
                      <h4 className="treatment-title">Prendre une décision administrative</h4>

                      {submitError && (
                        <div className="mb-2">
                          <Alert
                            type="error"
                            message={submitError}
                            onClose={() => setSubmitError(null)}
                          />
                        </div>
                      )}

                      <div className="form-group mb-2">
                        <label className="form-label" htmlFor={`decision-select-${report.id}`}>
                          Décision *
                        </label>
                        <select
                          id={`decision-select-${report.id}`}
                          className="form-input"
                          value={selectedDecision}
                          onChange={(e) =>
                            setSelectedDecision(e.target.value as ReportDecision)
                          }
                          disabled={submitting}
                        >
                          <option value="TRAITE">TRAITÉ (Signalement pris en charge)</option>
                          <option value="RESOLU">RÉSOLU (Mesure corrective appliquée)</option>
                          <option value="REJETE">REJETÉ (Signalement non fondé)</option>
                          <option value="CLASSE">CLASSÉ (Sans suite)</option>
                        </select>
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label" htmlFor={`comment-${report.id}`}>
                          Commentaire administratif (traçabilité dans le journal d'audit)
                        </label>
                        <textarea
                          id={`comment-${report.id}`}
                          className="form-input"
                          rows={2}
                          placeholder="Motif de la décision, mesures prises..."
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      <div className="treatment-actions">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={submitting}
                          id={`btn-confirm-report-${report.id}`}
                        >
                          {submitting ? "Enregistrement..." : "Valider la décision"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setActiveReportId(null);
                            setSubmitError(null);
                          }}
                          disabled={submitting}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="report-card-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setActiveReportId(report.id);
                          setSelectedDecision(
                            report.statut === "EN_ATTENTE" ? "TRAITE" : (report.statut as ReportDecision)
                          );
                          setSubmitError(null);
                        }}
                        id={`btn-treat-report-${report.id}`}
                      >
                        <IconScale size={14} />
                        <span>Traiter ce signalement</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
