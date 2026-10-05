import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminAuditLog } from "../../api/admin";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { Alert } from "../../components/Alert";
import { IconShieldCheck, IconFileText, IconFlag } from "../../components/Icons";

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listAuditLogs();
      if (res.success && res.data?.audit_logs) {
        setLogs(res.data.audit_logs);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger le journal d'audit. Veuillez vérifier vos autorisations administrateur."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const parseDetails = (rawDetails?: string | null) => {
    if (!rawDetails) return null;
    try {
      const parsed = JSON.parse(rawDetails);
      return parsed;
    } catch {
      return rawDetails;
    }
  };

  return (
    <div className="admin-page">
      <div className="container admin-container">
        {/* En-tête Administration */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <span className="page-badge">Console d'administration</span>
              <h1 className="page-title">Journal d'Audit</h1>
              <p className="page-subtitle">
                Traçabilité immuable des actions administratives effectuées sur la plateforme.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Admin */}
        <div className="admin-nav-tabs">
          <Link to="/admin/verifications" className="admin-tab-btn" id="tab-admin-verifications">
            <IconShieldCheck size={16} />
            <span>Vérifications</span>
          </Link>
          <Link to="/admin/publications" className="admin-tab-btn" id="tab-admin-publications">
            <IconFileText size={16} />
            <span>Publications</span>
          </Link>
          <Link to="/admin/reports" className="admin-tab-btn" id="tab-admin-reports">
            <IconFlag size={16} />
            <span>Signalements</span>
          </Link>
          <Link to="/admin/audit-logs" className="admin-tab-btn is-active" id="tab-admin-audit-logs">
            <IconFileText size={16} />
            <span>Journal d'audit ({logs.length})</span>
          </Link>
        </div>

        {/* Alerte Erreur */}
        {error && (
          <div className="mb-3">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div className="center-container py-5">
            <LoadingSpinner message="Chargement du journal d'audit..." size="large" />
          </div>
        )}

        {/* État vide */}
        {!loading && !error && logs.length === 0 && (
          <div className="py-4">
            <EmptyState
              icon={<IconFileText size={36} />}
              title="Aucune action enregistrée"
              description="Le journal d'audit ne contient encore aucune entrée."
            />
          </div>
        )}

        {/* Liste des logs d'audit */}
        {!loading && !error && logs.length > 0 && (
          <div className="admin-audit-list">
            {logs.map((log) => {
              const details = parseDetails(log.informations_complementaires);

              return (
                <div key={log.id} className="audit-log-card" id={`audit-log-${log.id}`}>
                  <div className="audit-log-header">
                    <div className="audit-header-left">
                      <span className="audit-action-badge">{log.action}</span>
                      <span className="audit-log-date">{formatDate(log.date)}</span>
                    </div>
                    <code className="audit-log-id">ID: {log.id}</code>
                  </div>

                  <div className="audit-log-body">
                    <div className="audit-meta-row">
                      <span className="audit-meta-label">Administrateur (ID) :</span>
                      <code className="audit-user-code">{log.utilisateur_id}</code>
                    </div>

                    {details && (
                      <div className="audit-details-container">
                        <span className="audit-details-title">Détails enregistrés :</span>
                        {typeof details === "object" ? (
                          <div className="audit-details-grid">
                            {Object.entries(details).map(([key, val]) => (
                              <div key={key} className="audit-detail-entry">
                                <span className="detail-key">{key} :</span>
                                <span className="detail-val">
                                  {val !== null && val !== undefined ? String(val) : "null"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre className="audit-raw-details">{details}</pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
