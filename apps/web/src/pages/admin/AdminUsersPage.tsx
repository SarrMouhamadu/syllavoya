import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminUserItem } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { Alert } from "../../components/Alert";
import {
  IconSearch,
  IconUser,
  IconBuilding,
  IconMail,
  IconPhone,
  IconTrash,
  IconShieldCheck,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconEye,
  IconX,
} from "../../components/Icons";

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtres et recherche
  const [roleFilter, setRoleFilter] = useState<"ALL" | "VOYAGEUR" | "PROFESSIONNEL" | "ADMIN">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal de confirmation de suppression
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listUsers();
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger la liste des utilisateurs. Vérifiez vos permissions administrateur."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Statistiques de comptage
  const counts = useMemo(() => {
    let voyageurs = 0;
    let pros = 0;
    let admins = 0;
    for (const u of users) {
      if (u.role === "VOYAGEUR") voyageurs++;
      else if (u.role === "PROFESSIONNEL") pros++;
      else if (u.role === "ADMIN") admins++;
    }
    return {
      total: users.length,
      voyageurs,
      pros,
      admins,
    };
  }, [users]);

  // Filtrage
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Filtre rôle
      if (roleFilter !== "ALL" && u.role !== roleFilter) {
        return false;
      }

      // Recherche texte
      if (q) {
        const nom = (u.nom || "").toLowerCase();
        const prenom = (u.prenom || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const tel = (u.telephone || "").toLowerCase();
        const structure = (u.professionnel?.nom_structure || "").toLowerCase();

        const matches =
          nom.includes(q) ||
          prenom.includes(q) ||
          email.includes(q) ||
          tel.includes(q) ||
          structure.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      const res = await adminApi.deleteUser(userToDelete.id);

      if (res.success) {
        setSuccessMessage(
          res.message ||
            `Le compte de ${userToDelete.professionnel ? userToDelete.professionnel.nom_structure : `${userToDelete.prenom} ${userToDelete.nom}`} a été supprimé avec succès.`
        );
        setUserToDelete(null);
        await fetchUsers();
      }
    } catch (err: any) {
      setDeleteError(
        err?.message || "Erreur lors de la suppression de l'utilisateur."
      );
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
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
        <Link to="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: "14px" }}>
          Administration
        </Link>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ color: "#2563eb", fontSize: "14px", fontWeight: 600 }}>
          Utilisateurs & Agences
        </span>
      </div>

      {/* En-tête avec navigation des sections admin */}
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
              Gestion des Utilisateurs & Agences
            </h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "14px" }}>
              Consultez tous les comptes inscrits et gérez les suppressions de la plateforme
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link
              to="/admin/users"
              className="btn btn-primary btn-sm"
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

      {/* Cartes de métriques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          onClick={() => setRoleFilter("ALL")}
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: roleFilter === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Inscrits</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
            {counts.total}
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("PROFESSIONNEL")}
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: roleFilter === "PROFESSIONNEL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Agences & Pros</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>
            {counts.pros}
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("VOYAGEUR")}
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: roleFilter === "VOYAGEUR" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Voyageurs</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
            {counts.voyageurs}
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("ADMIN")}
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: roleFilter === "ADMIN" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Administrateurs</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>
            {counts.admins}
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          background: "#ffffff",
          padding: "1rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
          <IconSearch size={18} style={{ color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Rechercher par nom, agence, email, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#0f172a",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "2px",
              }}
            >
              <IconX size={16} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(
            [
              { id: "ALL", label: "Tous" },
              { id: "PROFESSIONNEL", label: "Agences" },
              { id: "VOYAGEUR", label: "Voyageurs" },
              { id: "ADMIN", label: "Admins" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={roleFilter === tab.id ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              style={{ fontSize: "13px" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des utilisateurs */}
      {loading ? (
        <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner message="Chargement des utilisateurs et agences..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur trouvé"
          description={
            searchQuery
              ? `Aucun compte ne correspond à votre recherche "${searchQuery}".`
              : "Aucun utilisateur inscrit dans cette catégorie."
          }
        />
      ) : (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>Identité / Structure</th>
                  <th style={{ padding: "12px 16px" }}>Coordonnées</th>
                  <th style={{ padding: "12px 16px" }}>Rôle & Statut</th>
                  <th style={{ padding: "12px 16px" }}>Date d'inscription</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = currentAdmin?.id === u.id;
                  const isPro = u.role === "PROFESSIONNEL";
                  const proInfo = u.professionnel;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Identité / Structure */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              background: isPro ? "#e0f2fe" : u.role === "ADMIN" ? "#f3e8ff" : "#f1f5f9",
                              color: isPro ? "#0284c7" : u.role === "ADMIN" ? "#7c3aed" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "15px",
                              flexShrink: 0,
                            }}
                          >
                            {isPro ? (
                              <IconBuilding size={20} />
                            ) : (
                              (u.prenom?.charAt(0) || u.nom?.charAt(0) || "U").toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                              {isPro && proInfo?.nom_structure
                                ? proInfo.nom_structure
                                : `${u.prenom || ""} ${u.nom}`.trim()}
                              {isCurrent && (
                                <span
                                  style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                    background: "#e2e8f0",
                                    color: "#475569",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Vous
                                </span>
                              )}
                            </div>
                            {isPro && (
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                Responsable : {u.prenom} {u.nom}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coordonnées */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                            <IconMail size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                            <span>{u.email}</span>
                          </div>
                          {u.telephone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b" }}>
                              <IconPhone size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                              <span>{u.telephone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rôle & Statut */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                          {isPro ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#e0f2fe",
                                color: "#0369a1",
                              }}
                            >
                              <IconBuilding size={12} /> Agence Professionnelle
                            </span>
                          ) : u.role === "ADMIN" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#f3e8ff",
                                color: "#6b21a8",
                              }}
                            >
                              <IconShieldCheck size={12} /> Administrateur
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              <IconUser size={12} /> Voyageur
                            </span>
                          )}

                          {isPro && proInfo && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  proInfo.statut_verification === "VERIFIE"
                                    ? "#dcfce7"
                                    : proInfo.statut_verification === "EN_ATTENTE"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  proInfo.statut_verification === "VERIFIE"
                                    ? "#15803d"
                                    : proInfo.statut_verification === "EN_ATTENTE"
                                    ? "#b45309"
                                    : "#b91c1c",
                              }}
                            >
                              {proInfo.statut_verification === "VERIFIE"
                                ? "Vérifié"
                                : proInfo.statut_verification === "EN_ATTENTE"
                                ? "En attente vérif."
                                : proInfo.statut_verification}
                            </span>
                          )}

                          {u.hasActiveSubscription && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "#e0e7ff",
                                color: "#3730a3",
                              }}
                            >
                              Abonné Actif
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date d'inscription */}
                      <td style={{ padding: "16px", color: "#64748b" }}>
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          {isPro && proInfo && (
                            <Link
                              to={`/professionals/${proInfo.id}`}
                              className="btn btn-secondary btn-sm"
                              title="Consulter la vitrine de l'agence"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                              }}
                            >
                              <IconEye size={14} />
                              <span style={{ fontSize: "12px" }}>Vitrine</span>
                            </Link>
                          )}

                          {isCurrent ? (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#94a3b8",
                                fontStyle: "italic",
                                padding: "6px 8px",
                              }}
                            >
                              Compte actif
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setUserToDelete(u);
                              }}
                              className="btn btn-sm"
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "12px",
                              }}
                              title={`Supprimer ${isPro ? "l'agence" : "l'utilisateur"}`}
                            >
                              <IconTrash size={14} />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {userToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconAlertTriangle size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Supprimer définitivement ce compte ?
                </h3>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
                  Cette action est irréversible et supprimera toutes les données associées de la plateforme Sylla Voyage.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "1.25rem",
                fontSize: "13px",
              }}
            >
              <div style={{ marginBottom: "6px" }}>
                <strong style={{ color: "#0f172a" }}>Nom / Structure : </strong>
                <span style={{ color: "#334155" }}>
                  {userToDelete.professionnel
                    ? `${userToDelete.professionnel.nom_structure} (${userToDelete.prenom} ${userToDelete.nom})`
                    : `${userToDelete.prenom} ${userToDelete.nom}`}
                </span>
              </div>
              <div style={{ marginBottom: "6px" }}>
                <strong style={{ color: "#0f172a" }}>Email : </strong>
                <span style={{ color: "#334155" }}>{userToDelete.email}</span>
              </div>
              <div>
                <strong style={{ color: "#0f172a" }}>Rôle : </strong>
                <span style={{ color: "#334155" }}>{userToDelete.role}</span>
              </div>
            </div>

            {deleteError && (
              <div style={{ marginBottom: "1rem" }}>
                <Alert type="error" message={deleteError} onClose={() => setDeleteError(null)} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="btn btn-secondary"
                style={{ cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="btn btn-danger"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {deleting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Suppression en cours...</span>
                  </>
                ) : (
                  <>
                    <IconTrash size={16} />
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
