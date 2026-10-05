import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Alert";

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"VOYAGEUR" | "PROFESSIONNEL">("VOYAGEUR");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [motDePasseConfirmation, setMotDePasseConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations locales
    if (!nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    if (!prenom.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }
    if (!email.trim()) {
      setError("L'adresse email est obligatoire.");
      return;
    }
    if (!motDePasse || motDePasse.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (motDePasse !== motDePasseConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      await register({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        mot_de_passe: motDePasse,
        telephone: telephone.trim() || undefined,
        role,
      });

      // Redirection immédiate vers l'accueil après inscription réussie
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🌍</span>
          <h1 className="auth-title">Inscription</h1>
          <p className="auth-subtitle">
            Créez votre compte en quelques instants
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Sélection du type de compte (mobile-friendly) */}
          <div className="form-group">
            <label className="form-label">Type de compte</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${role === "VOYAGEUR" ? "is-selected" : ""}`}
                onClick={() => setRole("VOYAGEUR")}
                disabled={loading}
              >
                <span className="role-icon">🧳</span>
                <span className="role-label">Voyageur</span>
                <span className="role-desc">Pour préparer et organiser votre voyage</span>
              </button>

              <button
                type="button"
                className={`role-option ${role === "PROFESSIONNEL" ? "is-selected" : ""}`}
                onClick={() => setRole("PROFESSIONNEL")}
                disabled={loading}
              >
                <span className="role-icon">🏢</span>
                <span className="role-label">Professionnel</span>
                <span className="role-desc">Agence, guide ou structure de voyage</span>
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-prenom" className="form-label">
                Prénom *
              </label>
              <input
                id="reg-prenom"
                type="text"
                className="form-input"
                placeholder="ex: Amadou"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-nom" className="form-label">
                Nom *
              </label>
              <input
                id="reg-nom"
                type="text"
                className="form-input"
                placeholder="ex: Sy"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              Adresse email *
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="ex: amadou.sy@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-tel" className="form-label">
              Numéro de téléphone <span className="label-optional">(optionnel)</span>
            </label>
            <input
              id="reg-tel"
              type="tel"
              className="form-input"
              placeholder="ex: +221 77 000 00 00"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              autoComplete="tel"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Mot de passe * <span className="label-hint">(au moins 6 caractères)</span>
            </label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="Choisissez un mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password-confirm" className="form-label">
              Confirmer le mot de passe *
            </label>
            <input
              id="reg-password-confirm"
              type="password"
              className="form-input"
              placeholder="Répétez votre mot de passe"
              value={motDePasseConfirmation}
              onChange={(e) => setMotDePasseConfirmation(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
