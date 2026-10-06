import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/Alert";
import {
  IconLogo,
  IconCompass,
  IconBuilding,
  IconFileText,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
} from "../components/Icons";

export const RegisterPage: React.FC = () => {
  const { register, registerProfessional, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"VOYAGEUR" | "PROFESSIONNEL">("VOYAGEUR");
  const [proStep, setProStep] = useState<1 | 2>(1);

  // Champs communs / Voyageur
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [motDePasseConfirmation, setMotDePasseConfirmation] = useState("");

  // Champ spécifique obligatoire Professionnel : Pièce d'identité réelle
  const [pieceIdentiteFile, setPieceIdentiteFile] = useState<File | null>(null);

  // Champs strictement facultatifs Professionnel
  const [nomStructure, setNomStructure] = useState("");

  // Documents administratifs réels strictement facultatifs (aucun champ texte)
  const [rccmFile, setRccmFile] = useState<File | null>(null);
  const [nineaFile, setNineaFile] = useState<File | null>(null);
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [autreDocFile, setAutreDocFile] = useState<File | null>(null);

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

  const handleDocFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDoc: (f: File | null) => void,
    docLabel: string
  ) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

      if (!hasValidExt) {
        setError(`Format non autorisé pour "${docLabel}". Formats acceptés : PDF, JPG, JPEG, PNG.`);
        e.target.value = "";
        setDoc(null);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setError(`Le document "${docLabel}" dépasse 25 Mo (taille maximale autorisée).`);
        e.target.value = "";
        setDoc(null);
        return;
      }

      setDoc(file);
    }
  };

  const handleDocRemove = (
    inputId: string,
    setDoc: (f: File | null) => void
  ) => {
    setDoc(null);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }
  };

  const validateStep1 = () => {
    setError(null);
    if (!nom.trim()) {
      setError("Le nom complet ou raison sociale est obligatoire.");
      return false;
    }
    if (!telephone.trim()) {
      setError("Le numéro de téléphone est obligatoire.");
      return false;
    }
    if (!pieceIdentiteFile) {
      setError("La pièce d'identité est obligatoire (fichier PDF, JPG ou PNG requis).");
      return false;
    }
    if (motDePasse && motDePasse.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return false;
    }
    if (motDePasse && motDePasse !== motDePasseConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setProStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (role === "PROFESSIONNEL") {
      // Si l'utilisateur valide depuis l'étape 1 (ex: touche Entrée)
      if (proStep === 1) {
        handleNextStep();
        return;
      }

      // RÈGLE MÉTIER ABSOLUE : SEULEMENT 3 ÉLÉMENTS OBLIGATOIRES (Étape 1)
      if (!validateStep1()) {
        setProStep(1);
        return;
      }

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("nom", nom.trim());
        formData.append("telephone", telephone.trim());
        formData.append("piece_identite", pieceIdentiteFile!);

        if (motDePasse) formData.append("mot_de_passe", motDePasse);
        if (prenom.trim()) formData.append("prenom", prenom.trim());
        if (email.trim()) formData.append("email", email.trim().toLowerCase());
        if (nomStructure.trim()) formData.append("nom_structure", nomStructure.trim());
        if (rccmFile) formData.append("rccm", rccmFile.name);
        if (nineaFile) formData.append("ninea", nineaFile.name);
        if (licenceFile) formData.append("licence", licenceFile.name);
        if (autreDocFile) {
          formData.append(
            "informations_professionnelles",
            `Autre document administratif : ${autreDocFile.name}`
          );
        }

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
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Veuillez saisir une adresse email valide.");
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
        const cleanDigits = telephone.replace(/[^0-9]/g, "");
        const finalEmail = email.trim()
          ? email.trim().toLowerCase()
          : `voyageur.${cleanDigits}@syllavoyage.pro`;

        await register({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: finalEmail,
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
                setProStep(1);
                setError(null);
              }}
              disabled={loading}
            >
              <div className="role-icon-box">
                <IconCompass size={22} />
              </div>
              <div className="role-info">
                <span className="role-label">Voyageur</span>
              </div>
            </button>

            <button
              type="button"
              className={`role-option ${role === "PROFESSIONNEL" ? "is-selected" : ""}`}
              onClick={() => {
                setRole("PROFESSIONNEL");
                setProStep(1);
                setError(null);
              }}
              disabled={loading}
            >
              <div className="role-icon-box">
                <IconBuilding size={22} />
              </div>
              <div className="role-info">
                <span className="role-label">Professionnel</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {role === "PROFESSIONNEL" ? (
            /* ======================================================== */
            /* INSCRIPTION PROFESSIONNELLE EN 2 ÉTAPES                  */
            /* ======================================================== */
            <div className="pro-register-section">
              {/* Stepper indicateur d'avancement */}
              <div className="pro-stepper" aria-label="Étapes d'inscription professionnelle">
                <button
                  type="button"
                  className={`pro-step ${proStep === 1 ? "active" : "completed"}`}
                  onClick={() => setProStep(1)}
                  disabled={loading}
                >
                  <div className="pro-step-badge">
                    {proStep > 1 ? <IconCheck size={16} /> : "1"}
                  </div>
                  <div className="pro-step-text">
                    <span className="pro-step-indicator-title">Étape 1</span>
                    <span className="pro-step-indicator-sub">Responsable (obligatoire)</span>
                  </div>
                </button>

                <div className={`pro-step-divider ${proStep > 1 ? "completed" : ""}`} />

                <button
                  type="button"
                  className={`pro-step ${proStep === 2 ? "active" : ""}`}
                  onClick={() => {
                    if (validateStep1()) setProStep(2);
                  }}
                  disabled={loading}
                >
                  <div className="pro-step-badge">2</div>
                  <div className="pro-step-text">
                    <span className="pro-step-indicator-title">Étape 2</span>
                    <span className="pro-step-indicator-sub">Agence (facultatif)</span>
                  </div>
                </button>
              </div>

              {proStep === 1 ? (
                /* ======================================================== */
                /* ÉTAPE 1 : INFORMATIONS OBLIGATOIRES DU RESPONSABLE        */
                /* ======================================================== */
                <div className="pro-step-content">
                  <div className="step-section-heading">
                    <h2>Informations obligatoires du responsable</h2>
                    <span>Étape 1 sur 2</span>
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
                  </div>

                  {/* 3. PIÈCE D'IDENTITÉ (Obligatoire avec fichier) */}
                  <div className="form-group">
                    <label htmlFor="pro-piece-identite" className="form-label">
                      Pièce d'identité <span className="text-danger">*</span>
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
                    {pieceIdentiteFile && (
                      <div className="file-selected-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <IconFileText size={16} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pieceIdentiteFile.name} ({(pieceIdentiteFile.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDocRemove("pro-piece-identite", setPieceIdentiteFile)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger, #b91c1c)",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mot de passe */}
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

                  {/* Navigation Étape 1 -> Étape 2 */}
                  <div className="step-nav-actions">
                    <button
                      type="button"
                      id="pro-next-step-btn"
                      className="btn btn-primary btn-block btn-lg"
                      onClick={handleNextStep}
                      disabled={loading}
                    >
                      <span>Suivant : Informations de l'agence</span>
                      <IconArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* ÉTAPE 2 : INFORMATIONS FACULTATIVES DE L'AGENCE           */
                /* ======================================================== */
                <div className="pro-step-content">
                  <div className="step-section-heading">
                    <h2>Informations facultatives de l'agence</h2>
                    <span>Étape 2 sur 2 (Facultatif)</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pro-prenom" className="form-label">
                      Prénom du représentant <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
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
                      Adresse email <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
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
                      Nom commercial de l'agence <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
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

                  {/* 1. RCCM (Facultatif - Fichier uniquement) */}
                  <div className="form-group">
                    <label htmlFor="pro-doc-rccm" className="form-label">
                      Extrait RCCM <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
                    </label>
                    <input
                      id="pro-doc-rccm"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="form-input file-input"
                      onChange={(e) => handleDocFileChange(e, setRccmFile, "Extrait RCCM")}
                      disabled={loading}
                    />
                    {rccmFile && (
                      <div className="file-selected-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <IconFileText size={16} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rccmFile.name} ({(rccmFile.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDocRemove("pro-doc-rccm", setRccmFile)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger, #b91c1c)",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. NINEA (Facultatif - Fichier uniquement) */}
                  <div className="form-group">
                    <label htmlFor="pro-doc-ninea" className="form-label">
                      Attestation NINEA <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
                    </label>
                    <input
                      id="pro-doc-ninea"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="form-input file-input"
                      onChange={(e) => handleDocFileChange(e, setNineaFile, "Attestation NINEA")}
                      disabled={loading}
                    />
                    {nineaFile && (
                      <div className="file-selected-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <IconFileText size={16} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {nineaFile.name} ({(nineaFile.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDocRemove("pro-doc-ninea", setNineaFile)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger, #b91c1c)",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Licence touristique (Facultatif - Fichier uniquement) */}
                  <div className="form-group">
                    <label htmlFor="pro-doc-licence" className="form-label">
                      Licence touristique <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
                    </label>
                    <input
                      id="pro-doc-licence"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="form-input file-input"
                      onChange={(e) => handleDocFileChange(e, setLicenceFile, "Licence touristique")}
                      disabled={loading}
                    />
                    {licenceFile && (
                      <div className="file-selected-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <IconFileText size={16} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {licenceFile.name} ({(licenceFile.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDocRemove("pro-doc-licence", setLicenceFile)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger, #b91c1c)",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Autre document administratif (Facultatif - Fichier uniquement) */}
                  <div className="form-group">
                    <label htmlFor="pro-doc-autre" className="form-label">
                      Autre document administratif <span className="text-muted" style={{ fontWeight: "normal", fontSize: "0.8125rem" }}>(facultatif)</span>
                    </label>
                    <input
                      id="pro-doc-autre"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="form-input file-input"
                      onChange={(e) => handleDocFileChange(e, setAutreDocFile, "Autre document")}
                      disabled={loading}
                    />
                    {autreDocFile && (
                      <div className="file-selected-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          <IconFileText size={16} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {autreDocFile.name} ({(autreDocFile.size / (1024 * 1024)).toFixed(2)} Mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDocRemove("pro-doc-autre", setAutreDocFile)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger, #b91c1c)",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation Étape 2 : Retour ou Soumettre */}
                  <div className="step-nav-actions">
                    <button
                      type="button"
                      id="pro-prev-step-btn"
                      className="btn btn-outline btn-lg"
                      onClick={() => setProStep(1)}
                      disabled={loading}
                    >
                      <IconArrowLeft size={18} />
                      <span>Retour</span>
                    </button>
                    <button
                      type="submit"
                      id="register-submit-btn"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? "Inscription en cours..." : "Soumettre mon dossier professionnel"}
                    </button>
                  </div>
                </div>
              )}
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
                  Adresse email (facultatif)
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

              <button
                type="submit"
                id="register-submit-btn"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? "Inscription en cours..." : "Créer mon compte Voyageur"}
              </button>
            </div>
          )}
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
