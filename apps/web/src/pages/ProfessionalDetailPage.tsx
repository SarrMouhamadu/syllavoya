import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { conversationsApi } from "../api/conversations";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";

export const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [pro, setPro] = useState<ApiProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire de contact
  const [premierMessage, setPremierMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const fetchProfessional = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await professionalsApi.getById(id);
      if (response.success && response.data?.professional) {
        setPro(response.data.professional);
      } else {
        setError("Professionnel introuvable.");
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger les informations de ce professionnel.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfessional();
  }, [fetchProfessional]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    if (!id) return;

    if (!premierMessage.trim()) {
      setContactError("Veuillez rédiger un court message pour vous présenter.");
      return;
    }

    try {
      setSending(true);
      const res = await conversationsApi.createConversation({
        professionnel_id: id,
        premier_message: premierMessage.trim(),
      });

      if (res.success) {
        setContactSuccess("Votre message a été transmis avec succès à ce professionnel !");
        setPremierMessage("");
      }
    } catch (err: any) {
      setContactError(err?.message || "Impossible d'initier la conversation.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pro-detail-page">
      <div className="container">
        {/* Navigation retour */}
        <div className="back-nav">
          <Link to="/professionals" className="back-link">
            ← Retour à la liste des professionnels
          </Link>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement du profil professionnel..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/professionals" className="btn btn-outline" style={{ marginTop: "12px" }}>
              Voir les autres professionnels
            </Link>
          </div>
        )}

        {/* Fiche détaillée du professionnel */}
        {!loading && !error && pro && (
          <div className="pro-detail-layout">
            {/* Colonne informations de la structure */}
            <div className="pro-detail-card">
              <div className="pro-detail-header">
                <div className="pro-detail-avatar">
                  🏢
                </div>
                <div className="pro-detail-title-group">
                  <h1 className="pro-detail-title">{pro.nom_structure}</h1>
                  <div className="badge-verified-large">
                    <span className="badge-icon">✓</span> Structure Vérifiée par Sylla Voyage
                  </div>
                </div>
              </div>

              <div className="pro-detail-sections">
                <section className="detail-section">
                  <h2 className="detail-section-title">À propos de la structure</h2>
                  {pro.description ? (
                    <p className="detail-section-content">{pro.description}</p>
                  ) : (
                    <p className="detail-section-content detail-content-empty">
                      Aucune description détaillée renseignée.
                    </p>
                  )}
                </section>

                {pro.informations_professionnelles && (
                  <section className="detail-section">
                    <h2 className="detail-section-title">Informations professionnelles & Localisation</h2>
                    <p className="detail-section-content">{pro.informations_professionnelles}</p>
                  </section>
                )}

                <section className="detail-section">
                  <h2 className="detail-section-title">Garanties Sylla Voyage</h2>
                  <ul className="guarantee-list">
                    <li>✓ Dossier administratif vérifié (RCCM, NINEA)</li>
                    <li>✓ Respect de la charte de confiance et de sécurité</li>
                    <li>✓ Premier contact toujours sous le contrôle du voyageur</li>
                  </ul>
                </section>
              </div>
            </div>

            {/* Colonne Contact / Prise de relation */}
            <aside className="contact-box-card">
              <h2 className="contact-box-title">Contacter cette structure</h2>
              <p className="contact-box-subtitle">
                Posez vos questions, demandez un devis ou préparez votre itinéraire en direct.
              </p>

              {/* Cas 1 : Utilisateur non authentifié */}
              {!isAuthenticated && (
                <div className="contact-auth-prompt">
                  <p className="auth-prompt-text">
                    Pour garantir la sécurité des échanges, vous devez être connecté pour contacter un professionnel.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="btn btn-primary btn-block btn-lg"
                    id="contact-login-btn"
                  >
                    Se connecter pour contacter
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline btn-block"
                    style={{ marginTop: "8px" }}
                  >
                    Créer un compte Voyageur
                  </Link>
                </div>
              )}

              {/* Cas 2 : Utilisateur authentifié en tant que PROFESSIONNEL */}
              {isAuthenticated && user?.role === "PROFESSIONNEL" && (
                <div className="contact-role-restriction">
                  <Alert
                    type="warning"
                    message="Règle Sylla Voyage : Seul un voyageur peut initier une prise de contact. Votre compte est actuellement enregistré comme Professionnel."
                  />
                </div>
              )}

              {/* Cas 3 : Utilisateur authentifié en tant que VOYAGEUR (ou ADMIN) */}
              {isAuthenticated && (user?.role === "VOYAGEUR" || user?.role === "ADMIN") && (
                <div className="contact-form-wrapper">
                  {contactSuccess && (
                    <Alert type="success" message={contactSuccess} />
                  )}
                  {contactError && (
                    <Alert
                      type="error"
                      message={contactError}
                      onClose={() => setContactError(null)}
                    />
                  )}

                  {!contactSuccess && (
                    <form onSubmit={handleContactSubmit} className="contact-form">
                      <div className="form-group">
                        <label htmlFor="contact-message" className="form-label">
                          Votre premier message *
                        </label>
                        <textarea
                          id="contact-message"
                          className="form-input form-textarea"
                          rows={4}
                          placeholder="Bonjour, je souhaite avoir des renseignements sur vos offres..."
                          value={premierMessage}
                          onChange={(e) => setPremierMessage(e.target.value)}
                          disabled={sending}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        id="send-contact-btn"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={sending}
                      >
                        {sending ? "Envoi en cours..." : "✉️ Envoyer le message"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
