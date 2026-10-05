import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Alert";
import { IconLogo, IconLock, IconUser } from "../components/Icons";

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Identifiants invalides. Veuillez vérifier votre saisie.");
    } finally {
      setLoading(false);
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
            <label htmlFor="login-password" className="form-label">
              <IconLock size={15} />
              <span>Mot de passe</span>
            </label>
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
    </div>
  );
};
