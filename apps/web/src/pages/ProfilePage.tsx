import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { usersApi } from "../api/users";
import {
  IconPhone,
  IconMail,
  IconShieldCheck,
  IconCreditCard,
  IconBuilding,
  IconEye,
  IconCheck,
  IconPlus,
  IconEdit,
  IconX,
} from "../components/Icons";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // État pour la modification des informations personnelles
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editNom, setEditNom] = useState<string>("");
  const [editPrenom, setEditPrenom] = useState<string>("");
  const [editTelephone, setEditTelephone] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // État spécifique pour les professionnels
  const [pro, setPro] = useState<ApiProfessional | null>(null);
  const [loadingPro, setLoadingPro] = useState<boolean>(false);
  const [structureName, setStructureName] = useState<string>("");
  const [servicesDescription, setServicesDescription] = useState<string>("");
  const [savingServices, setSavingServices] = useState<boolean>(false);
  const [servicesSuccess, setServicesSuccess] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditNom(user.nom || "");
      setEditPrenom(user.prenom || "");
      setEditTelephone(user.telephone || "");
      setEditEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "PROFESSIONNEL") {
      setLoadingPro(true);
      professionalsApi
        .getMe()
        .then((res) => {
          if (res.success && res.data?.professional) {
            setPro(res.data.professional);
            setStructureName(res.data.professional.nom_structure || "");
            setServicesDescription(res.data.professional.description || "");
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPro(false));
    }
  }, [user]);

  if (!user) {
    return null;
  }

  // Validation affichage téléphone
  const isEmail = (val?: string | null): boolean => typeof val === "string" && val.includes("@");
  const hasValidPhone = !!(user.telephone && !isEmail(user.telephone) && user.telephone.trim() !== "");
  const displayTelephone = hasValidPhone ? (user.telephone as string).trim() : "Non renseigné";

  // Traitement affichage email
  const isSystemPlaceholderEmail = !!(user.email && user.email.toLowerCase().endsWith("@syllavoyage.pro"));
  const hasRealEmail = !!(user.email && isEmail(user.email) && !isSystemPlaceholderEmail);
  const displayEmail = hasRealEmail ? user.email.trim() : "Non renseigné";

  const initials = ((user.prenom?.charAt(0) || "") + (user.nom?.charAt(0) || "")).toUpperCase() || "U";

  // Enregistrer les modifications du compte utilisateur
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      setSavingProfile(true);
      const res = await usersApi.updateProfile({
        nom: editNom.trim() || undefined,
        prenom: editPrenom.trim() || undefined,
        telephone: editTelephone.trim() || null,
        email: editEmail.trim() || undefined,
      });

      if (res.success) {
        await refreshUser();
        setProfileSuccess("Vos informations personnelles ont été mises à jour avec succès.");
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      setProfileError(err?.message || "Impossible de mettre à jour vos informations. Veuillez réessayer.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Enregistrer les services et informations de l'agence
  const handleSaveServices = async (e: React.FormEvent) => {
    e.preventDefault();
    setServicesError(null);
    setServicesSuccess(null);

    try {
      setSavingServices(true);
      const res = await professionalsApi.updateMe({
        nom_structure: structureName.trim() || undefined,
        description: servicesDescription.trim() || null,
      });

      if (res.success && res.data?.professional) {
        setPro(res.data.professional);
        setServicesSuccess(
          "Vos services ont été enregistrés avec succès. Ils sont désormais visibles sur la vitrine publique de votre agence !"
        );
      }
    } catch (err: any) {
      setServicesError(
        err?.message || "Impossible d'enregistrer vos services. Veuillez réessayer."
      );
    } finally {
      setSavingServices(false);
    }
  };

  // Raccourci pour ajouter un service courant
  const handleAddSuggestedService = (serviceName: string) => {
    setServicesDescription((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `• ${serviceName}`;
      }
      if (trimmed.includes(serviceName)) {
        return prev;
      }
      return `${trimmed}\n• ${serviceName}`;
    });
  };

  const commonServices = [
    "Billetterie & Vols",
    "Assistance Visa",
    "Réservation d'hôtels",
    "Circuits touristiques",
    "Voyages d'affaires",
    "Pèlerinage (Omra & Hajj)",
    "Permis d'étude",
    "Location de véhicules",
  ];

  return (
    <div className="profile-page" style={{ padding: "2rem 0 4rem" }}>
      <div className="container profile-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Carte 1 : Informations du compte personnel */}
        <div className="profile-card" style={{ marginBottom: "2rem" }}>
          <div className="profile-header" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="profile-avatar">{initials}</div>
              <div className="profile-identity">
                <h1 className="profile-name">
                  {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
                </h1>
                <span className="user-badge user-badge-role">
                  {user.role === "PROFESSIONNEL"
                    ? "Professionnel"
                    : user.role === "ADMIN"
                    ? "Administrateur"
                    : "Voyageur"}
                </span>
              </div>
            </div>

            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => {
                  setProfileError(null);
                  setProfileSuccess(null);
                  setIsEditingProfile(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
              >
                <IconEdit size={14} />
                <span>Modifier mes infos</span>
              </button>
            )}
          </div>

          {profileSuccess && (
            <div style={{ marginBottom: "1.25rem" }}>
              <Alert type="success" message={profileSuccess} onClose={() => setProfileSuccess(null)} />
            </div>
          )}

          {profileError && (
            <div style={{ marginBottom: "1.25rem" }}>
              <Alert type="error" message={profileError} onClose={() => setProfileError(null)} />
            </div>
          )}

          {isEditingProfile ? (
            /* Formulaire d'édition du profil */
            <form onSubmit={handleSaveProfile} style={{ marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editPrenom}
                    onChange={(e) => setEditPrenom(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={editTelephone}
                    onChange={(e) => setEditTelephone(e.target.value)}
                    placeholder="Ex: +221 77 123 45 67 ou +1 819 576 8417"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={savingProfile}
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: "pointer" }}
                >
                  <IconX size={14} />
                  <span>Annuler</span>
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  {savingProfile ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={14} />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Affichage en lecture seule */
            <div className="profile-details-grid">
              <div className="profile-detail-item" id="profile-email-item">
                <span className="detail-label">
                  <IconMail size={15} />
                  <span>Adresse email</span>
                </span>
                <span className="detail-value" id="profile-email-value">
                  {displayEmail}
                </span>
              </div>

              <div className="profile-detail-item" id="profile-phone-item">
                <span className="detail-label">
                  <IconPhone size={15} />
                  <span>Numéro de téléphone</span>
                </span>
                <span className="detail-value" id="profile-phone-value">
                  {displayTelephone}
                </span>
              </div>

              <div className="profile-detail-item">
                <span className="detail-label">
                  <IconShieldCheck size={15} />
                  <span>Statut du compte</span>
                </span>
                <span className="detail-value">
                  <span className={`status-pill status-${user.statut.toLowerCase()}`}>
                    {user.statut === "ACTIF" ? "Actif" : user.statut}
                  </span>
                </span>
              </div>

              <div className="profile-detail-item">
                <span className="detail-label">Membre depuis</span>
                <span className="detail-value">
                  {new Date(user.created_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="profile-quick-nav" style={{ marginTop: "1.5rem" }}>
            <Link to="/subscriptions" className="btn btn-outline btn-block">
              <IconCreditCard size={16} />
              <span>Gérer mon abonnement</span>
            </Link>
          </div>
        </div>

        {/* Carte 2 : Gestion des Services pour les AGENCES / PROFESSIONNELS */}
        {user.role === "PROFESSIONNEL" && (
          <div
            className="profile-card"
            style={{
              border: "1px solid #bfdbfe",
              background: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "1rem",
                paddingBottom: "1.25rem",
                borderBottom: "1px solid #e2e8f0",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconBuilding size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {structureName || "Mon Agence"}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    {pro?.statut_verification === "VERIFIE" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#15803d",
                          background: "#dcfce7",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        <IconCheck size={13} /> Agence Vérifiée
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#b45309",
                          background: "#fef3c7",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Vérification en cours
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {pro && (
                <Link
                  to={`/professionals/${pro.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  <IconEye size={16} />
                  <span>Voir ma vitrine publique</span>
                </Link>
              )}
            </div>

            {loadingPro ? (
              <div style={{ padding: "2rem 0", display: "flex", justifyContent: "center" }}>
                <LoadingSpinner message="Chargement des données de l'agence..." />
              </div>
            ) : (
              <form onSubmit={handleSaveServices}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "6px",
                    }}
                  >
                    Nom de votre agence / structure
                  </label>
                  <input
                    type="text"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#0f172a",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: "4px",
                      }}
                    >
                      Services & Prestations proposés sur votre vitrine
                    </label>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px" }}>
                    Listez ici tous les services que votre agence propose. Les utilisateurs qui visitent votre profil vitrine verront directement ces prestations.
                  </p>

                  {/* Suggestions de services rapides */}
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                      Ajouter un service en 1 clic :
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                      {commonServices.map((srv) => (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => handleAddSuggestedService(srv)}
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "#334155",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <IconPlus size={12} />
                          <span>{srv}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    value={servicesDescription}
                    onChange={(e) => setServicesDescription(e.target.value)}
                    placeholder="Exemple :&#10;• Permis d'étude & Visa étudiant&#10;• Assistance visa Canada, USA & Europe&#10;• Billetterie & Réservation de vols internationaux&#10;• Réservation d'hôtels et séjours sur-mesure&#10;• Organisation de circuits touristiques et voyages d'affaires&#10;• Pèlerinage Omra & Hajj"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#0f172a",
                      lineHeight: "1.6",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {servicesSuccess && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <Alert
                      type="success"
                      message={servicesSuccess}
                      onClose={() => setServicesSuccess(null)}
                    />
                  </div>
                )}

                {servicesError && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <Alert
                      type="error"
                      message={servicesError}
                      onClose={() => setServicesError(null)}
                    />
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={savingServices}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      padding: "10px 20px",
                    }}
                  >
                    {savingServices ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Enregistrement en cours...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={16} />
                        <span>Enregistrer mes services</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
