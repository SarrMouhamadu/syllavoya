import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth";
import { Alert } from "../components/Alert";
import { IconLogo, IconLock, IconUser, IconX, IconCheck } from "../components/Icons";

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [roleChoice, setRoleChoice] = useState<"AUTO" | "VOYAGEUR" | "PROFESSIONNEL">("AUTO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Mot de passe oublié
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifiant, setForgotIdentifiant] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Redirection si déjà connecté
  const from = (location.state as any)?.from?.pathname || "/dashboard";
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifiant.trim() || !motDePasse) {
      setError("Veuillez renseigner votre email ou téléphone et votre mot de passe.");
      return;
    }

    try {
      setLoading(true);
      await login({
        email: identifiant.trim(),
        mot_de_passe: motDePasse,
        role: roleChoice === "AUTO" ? undefined : roleChoice,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Identifiants invalides. Veuillez vérifier votre saisie.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const targetId = forgotIdentifiant.trim() || identifiant.trim();
    if (!targetId) {
      setForgotError("Veuillez renseigner votre email ou votre numéro de téléphone.");
      return;
    }

    try {
      setForgotSubmitting(true);
      const res = await authApi.forgotPassword(targetId);
      if (res.success) {
        setForgotSuccess(res.data.message);
      }
    } catch (err: any) {
      setForgotError(err?.message || "Impossible d'enregistrer la demande pour le moment.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <IconLogo size={40} className="auth-logo-svg" />
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">
            Accédez à votre compte Sylla Voyage
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-identifiant" className="form-label">
              <IconUser size={15} />
              <span>Email ou Numéro de téléphone</span>
            </label>
            <input
              id="login-identifiant"
              type="text"
              className="form-input"
              placeholder="ex: contact@agence.sn ou 77 123 45 67"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label htmlFor="login-password" className="form-label" style={{ margin: 0 }}>
                <IconLock size={15} />
                <span>Mot de passe</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifiant(identifiant);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setShowForgotModal(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: "12px",
                  color: "var(--color-primary, #0284c7)",
                  cursor: "pointer",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
                id="btn-forgot-password"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Votre mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {/* Sélecteur d'espace si multi-comptes */}
          <div className="form-group" style={{ marginBottom: "18px" }}>
            <label className="form-label" style={{ marginBottom: "6px" }}>
              <span>Espace de destination (optionnel)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              <button
                type="button"
                className={`btn btn-sm ${roleChoice === "AUTO" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "0.8rem", padding: "6px 4px" }}
                onClick={() => setRoleChoice("AUTO")}
              >
                Auto
              </button>
              <button
                type="button"
                className={`btn btn-sm ${roleChoice === "VOYAGEUR" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "0.8rem", padding: "6px 4px" }}
                onClick={() => setRoleChoice("VOYAGEUR")}
              >
                Voyageur
              </button>
              <button
                type="button"
                className={`btn btn-sm ${roleChoice === "PROFESSIONNEL" ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "0.8rem", padding: "6px 4px" }}
                onClick={() => setRoleChoice("PROFESSIONNEL")}
              >
                Professionnel
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{" "}
            <Link to="/register" className="auth-link">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      {/* Modale d'assistance Mot de passe oublié */}
      {showForgotModal && (
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
          onClick={() => !forgotSubmitting && setShowForgotModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                Récupération de mot de passe
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <IconX size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{ marginBottom: "1rem" }}>
                <Alert type="error" message={forgotError} onClose={() => setForgotError(null)} />
              </div>
            )}

            {forgotSuccess ? (
              <div>
                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "10px",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontWeight: 700 }}>
                    <IconCheck size={18} />
                    <span>Demande enregistrée</span>
                  </div>
                  {forgotSuccess}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => setShowForgotModal(false)}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit}>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  Saisissez l'adresse email ou le numéro de téléphone associé à votre compte. Notre équipe support vérifiera vos informations pour réinitialiser vos identifiants.
                </p>

                <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                  <label htmlFor="forgot-identifiant" className="form-label">
                    Email ou Numéro de téléphone
                  </label>
                  <input
                    id="forgot-identifiant"
                    type="text"
                    className="form-input"
                    placeholder="ex: contact@agence.sn ou 77 123 45 67"
                    value={forgotIdentifiant}
                    onChange={(e) => setForgotIdentifiant(e.target.value)}
                    disabled={forgotSubmitting}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotSubmitting}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={forgotSubmitting}
                    id="btn-submit-forgot"
                  >
                    {forgotSubmitting ? "Envoi..." : "Transmettre ma demande"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
