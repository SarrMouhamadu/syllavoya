import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Alert";
import {
  IconLogo,
  IconCompass,
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconFileText,
} from "../components/Icons";

export const RegisterPage: React.FC = () => {
  const { register, registerProfessional, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"VOYAGEUR" | "PROFESSIONNEL">("VOYAGEUR");

  // Champs communs / Voyageur
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [motDePasseConfirmation, setMotDePasseConfirmation] = useState("");

  // Champ spécifique obligatoire Professionnel
  const [pieceIdentiteFile, setPieceIdentiteFile] = useState<File | null>(null);

  // Champs strictement facultatifs Professionnel
  const [nomStructure, setNomStructure] = useState("");
  const [rccm, setRccm] = useState("");
  const [ninea, setNinea] = useState("");
  const [licence, setLicence] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

      if (!hasValidExt) {
        setError("Format non autorisé. Formats acceptés : PDF, JPG, JPEG, PNG.");
        e.target.value = "";
        setPieceIdentiteFile(null);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setError("La taille du fichier dépasse 25 Mo (taille maximale autorisée).");
        e.target.value = "";
        setPieceIdentiteFile(null);
        return;
      }

      setPieceIdentiteFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (role === "PROFESSIONNEL") {
      // RÈGLE MÉTIER ABSOLUE : SEULEMENT 3 ÉLÉMENTS OBLIGATOIRES
      // 1. Nom
      if (!nom.trim()) {
        setError("Le nom est obligatoire.");
        return;
      }
      // 2. Numéro de téléphone
      if (!telephone.trim()) {
        setError("Le numéro de téléphone est obligatoire.");
        return;
      }
      // 3. Pièce d'identité avec fichier réel
      if (!pieceIdentiteFile) {
        setError("La pièce d'identité est obligatoire (fichier PDF, JPG ou PNG requis).");
        return;
      }

      if (motDePasse && motDePasse.length < 6) {
        setError("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }
      if (motDePasse && motDePasse !== motDePasseConfirmation) {
        setError("Les deux mots de passe ne correspondent pas.");
        return;
      }

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("nom", nom.trim());
        formData.append("telephone", telephone.trim());
        formData.append("piece_identite", pieceIdentiteFile);

        if (motDePasse) formData.append("mot_de_passe", motDePasse);
        if (prenom.trim()) formData.append("prenom", prenom.trim());
        if (email.trim()) formData.append("email", email.trim().toLowerCase());
        if (nomStructure.trim()) formData.append("nom_structure", nomStructure.trim());
        if (rccm.trim()) formData.append("rccm", rccm.trim());
        if (ninea.trim()) formData.append("ninea", ninea.trim());
        if (licence.trim()) formData.append("licence", licence.trim());

        await registerProfessional(formData);
        setSuccessNotice("Votre inscription professionnelle a été enregistrée. Redirection vers votre tableau de bord...");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      } catch (err: any) {
        setError(err?.message || "Erreur lors de la création du compte professionnel.");
      } finally {
        setLoading(false);
      }
    } else {
      // Parcours VOYAGEUR standard
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
      if (!telephone.trim()) {
        setError("Le numéro de téléphone est obligatoire.");
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
          telephone: telephone.trim(),
          role: "VOYAGEUR",
        });

        // Guidage direct du voyageur vers les offres d'abonnement
        navigate("/subscriptions", { replace: true });
      } catch (err: any) {
        setError(err?.message || "Erreur lors de la création du compte.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-auth-card">
        <div className="auth-header">
          <IconLogo size={40} className="auth-logo-svg" />
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">
            Rejoignez Sylla Voyage en quelques instants
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successNotice && <Alert type="success" message={successNotice} />}

        {/* Choix du rôle */}
        <div className="role-selector-group">
          <label className="form-label">Vous vous inscrivez en tant que :</label>
          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${role === "VOYAGEUR" ? "is-selected" : ""}`}
              onClick={() => {
                setRole("VOYAGEUR");
                setError(null);
              }}
              disabled={loading}
            >
              <div className="role-icon-box">
                <IconCompass size={22} />
              </div>
              <div className="role-info">
                <span className="role-label">Voyageur</span>
                <span className="role-desc">Pour préparer et organiser votre voyage</span>
              </div>
            </button>

            <button
              type="button"
              className={`role-option ${role === "PROFESSIONNEL" ? "is-selected" : ""}`}
              onClick={() => {
                setRole("PROFESSIONNEL");
                setError(null);
              }}
              disabled={loading}
            >
              <div className="role-icon-box">
                <IconBuilding size={22} />
              </div>
              <div className="role-info">
                <span className="role-label">Professionnel</span>
                <span className="role-desc">Agence, guide ou structure touristique</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {role === "PROFESSIONNEL" ? (
            /* ======================================================== */
            /* FORMULAIRE PROFESSIONNEL COURT (3 CHAMPS OBLIGATOIRES)   */
            /* ======================================================== */
            <div className="pro-register-section">
              <div className="form-info-notice">
                <IconCheck size={16} />
                <span>
                  <strong>Inscription simplifiée :</strong> Seuls votre Nom, Téléphone et Pièce d'identité sont requis.
                </span>
              </div>

              {/* 1. NOM (Obligatoire) */}
              <div className="form-group">
                <label htmlFor="pro-nom" className="form-label">
                  Nom complet ou Raison sociale <span className="text-danger">*</span>
                </label>
                <input
                  id="pro-nom"
                  type="text"
                  className="form-input"
                  placeholder="ex: Teranga Voyages ou Amadou Sy"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* 2. TÉLÉPHONE (Obligatoire) */}
              <div className="form-group">
                <label htmlFor="pro-tel" className="form-label">
                  Numéro de téléphone <span className="text-danger">*</span>
                </label>
                <input
                  id="pro-tel"
                  type="tel"
                  className="form-input"
                  placeholder="ex: +221 77 123 45 67 ou 771234567"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  autoComplete="tel"
                  disabled={loading}
                  required
                />
                <span className="input-hint">
                  Numéro sénégalais valide. Vous servira d'identifiant de connexion.
                </span>
              </div>

              {/* 3. PIÈCE D'IDENTITÉ (Obligatoire avec fichier réel) */}
              <div className="form-group">
                <label htmlFor="pro-piece-identite" className="form-label">
                  Pièce d'identité <span className="text-danger">* (fichier réel)</span>
                </label>
                <input
                  id="pro-piece-identite"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="form-input file-input"
                  onChange={handleFileChange}
                  disabled={loading}
                  required
                />
                <span className="input-hint">
                  Formats acceptés : PDF, JPG, PNG (Max 25 Mo).
                </span>
                {pieceIdentiteFile && (
                  <div className="file-selected-badge">
                    <IconFileText size={16} />
                    <span>{pieceIdentiteFile.name} ({(pieceIdentiteFile.size / (1024 * 1024)).toFixed(2)} Mo)</span>
                  </div>
                )}
              </div>

              {/* Mot de passe (recommandé) */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pro-password" className="form-label">
                    Mot de passe
                  </label>
                  <input
                    id="pro-password"
                    type="password"
                    className="form-input"
                    placeholder="Au moins 6 caractères"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pro-password-confirm" className="form-label">
                    Confirmer
                  </label>
                  <input
                    id="pro-password-confirm"
                    type="password"
                    className="form-input"
                    placeholder="Répétez"
                    value={motDePasseConfirmation}
                    onChange={(e) => setMotDePasseConfirmation(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Section Accordion pour les champs facultatifs */}
              <div className="optional-fields-container">
                <button
                  type="button"
                  className="optional-fields-toggle"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                >
                  <span>Informations complémentaires (facultatif)</span>
                  <IconChevronDown
                    size={16}
                    className={`accordion-icon ${showOptionalFields ? "open" : ""}`}
                  />
                </button>

                {showOptionalFields && (
                  <div className="optional-fields-body">
                    <div className="form-group">
                      <label htmlFor="pro-prenom" className="form-label">
                        Prénom du représentant
                      </label>
                      <input
                        id="pro-prenom"
                        type="text"
                        className="form-input"
                        placeholder="ex: Amadou"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pro-email" className="form-label">
                        Adresse email
                      </label>
                      <input
                        id="pro-email"
                        type="email"
                        className="form-input"
                        placeholder="ex: contact@agence.sn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pro-structure" className="form-label">
                        Nom commercial de l'agence
                      </label>
                      <input
                        id="pro-structure"
                        type="text"
                        className="form-input"
                        placeholder="ex: Teranga Voyages"
                        value={nomStructure}
                        onChange={(e) => setNomStructure(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pro-rccm" className="form-label">
                          RCCM
                        </label>
                        <input
                          id="pro-rccm"
                          type="text"
                          className="form-input"
                          placeholder="ex: SN-DKR-2023-B-0001"
                          value={rccm}
                          onChange={(e) => setRccm(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="pro-ninea" className="form-label">
                          NINEA
                        </label>
                        <input
                          id="pro-ninea"
                          type="text"
                          className="form-input"
                          placeholder="ex: 001234567"
                          value={ninea}
                          onChange={(e) => setNinea(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pro-licence" className="form-label">
                        Licence touristique
                      </label>
                      <input
                        id="pro-licence"
                        type="text"
                        className="form-input"
                        placeholder="ex: LIC-TOUR-2024"
                        value={licence}
                        onChange={(e) => setLicence(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* FORMULAIRE VOYAGEUR                                      */
            /* ======================================================== */
            <div className="voyageur-register-section">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-prenom" className="form-label">
                    Prénom <span className="text-danger">*</span>
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
                    Nom <span className="text-danger">*</span>
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
                  Adresse email <span className="text-danger">*</span>
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
                  Numéro de téléphone <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-tel"
                  type="tel"
                  className="form-input"
                  placeholder="ex: +221 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  autoComplete="tel"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-password" className="form-label">
                    Mot de passe <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className="form-input"
                    placeholder="Au moins 6 car."
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-password-confirm" className="form-label">
                    Confirmer <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reg-password-confirm"
                    type="password"
                    className="form-input"
                    placeholder="Répétez"
                    value={motDePasseConfirmation}
                    onChange={(e) => setMotDePasseConfirmation(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="register-submit-btn"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading
              ? "Inscription en cours..."
              : role === "PROFESSIONNEL"
              ? "Soumettre mon dossier professionnel"
              : "Créer mon compte Voyageur"}
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
