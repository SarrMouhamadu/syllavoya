import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { conversationsApi } from "../api/conversations";
import { subscriptionsApi } from "../api/subscriptions";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import {
  IconBuilding,
  IconShieldCheck,
  IconMapPin,
  IconCheck,
  IconArrowLeft,
  IconSend,
  IconLock,
  IconCreditCard,
} from "../components/Icons";

export const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [pro, setPro] = useState<ApiProfessional | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
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

      // Vérifier le statut de l'abonnement si l'utilisateur est un voyageur connecté
      if (isAuthenticated && user?.role === "VOYAGEUR") {
        const subRes = await subscriptionsApi.getMySubscription().catch(() => null);
        setHasSubscription(!!(subRes?.success && subRes.data?.subscription && subRes.data.subscription.statut === "ACTIF"));
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger les informations de ce professionnel.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user]);

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
        setContactSuccess("Votre message a été transmis avec succès. Vous recevrez une réponse dans votre messagerie.");
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
            <IconArrowLeft size={16} />
            <span>Retour à la liste des professionnels</span>
          </Link>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement de la fiche professionnelle..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/professionals" className="btn btn-outline" style={{ marginTop: "14px" }}>
              Voir les autres professionnels
            </Link>
          </div>
        )}

        {/* Fiche détaillée */}
        {!loading && !error && pro && (
          <div className="pro-detail-layout">
            {/* Colonne informations de la structure */}
            <div className="pro-detail-card">
              <div className="pro-detail-header">
                <div className="pro-detail-avatar">
                  <IconBuilding size={32} />
                </div>
                <div className="pro-detail-title-group">
                  <h1 className="pro-detail-title">{pro.nom_structure}</h1>
                  <div className="badge-verified-large">
                    <IconShieldCheck size={16} />
                    <span>Structure vérifiée par Sylla Voyage</span>
                  </div>
                </div>
              </div>

              <div className="pro-detail-sections">
                <section className="detail-section">
                  <h2 className="detail-section-title">Présentation</h2>
                  {pro.description ? (
                    <p className="detail-section-content">{pro.description}</p>
                  ) : (
                    <p className="detail-section-content detail-content-empty">
                      Aucune description renseignée pour cette structure.
                    </p>
                  )}
                </section>

                {pro.informations_professionnelles && (
                  <section className="detail-section">
                    <h2 className="detail-section-title">Localisation & Informations</h2>
                    <div className="detail-section-info-box">
                      <IconMapPin size={18} />
                      <p className="detail-section-content">{pro.informations_professionnelles}</p>
                    </div>
                  </section>
                )}

                <section className="detail-section">
                  <h2 className="detail-section-title">Garanties de la plateforme</h2>
                  <ul className="guarantee-list">
                    <li>
                      <IconCheck size={16} />
                      <span>Dossier administratif audité (identité, RCCM, NINEA)</span>
                    </li>
                    <li>
                      <IconCheck size={16} />
                      <span>Respect de la charte de transparence et de sécurité</span>
                    </li>
                    <li>
                      <IconCheck size={16} />
                      <span>Premier contact sous le contrôle exclusif du voyageur</span>
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            {/* Colonne Contact / Mise en relation */}
            <aside className="contact-box-card">
              <h2 className="contact-box-title">Contacter cette structure</h2>
              <p className="contact-box-subtitle">
                Posez vos questions ou demandez un devis directement à ce professionnel.
              </p>

              {/* Cas 1 : Visiteur non connecté */}
              {!isAuthenticated && (
                <div className="contact-auth-prompt">
                  <p className="auth-prompt-text">
                    Pour garantir la traçabilité et la sécurité des échanges, la connexion est requise.
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
                    style={{ marginTop: "10px" }}
                  >
                    Créer un compte Voyageur
                  </Link>
                </div>
              )}

              {/* Cas 2 : Connecté en tant que PROFESSIONNEL */}
              {isAuthenticated && user?.role === "PROFESSIONNEL" && (
                <div className="contact-role-restriction">
                  <Alert
                    type="warning"
                    message="Règle de la plateforme : Seul un voyageur peut initier une prise de contact. Votre compte est actuellement enregistré comme Professionnel."
                  />
                </div>
              )}

              {/* Cas 3 : Connecté en tant que VOYAGEUR sans abonnement actif */}
              {isAuthenticated && user?.role === "VOYAGEUR" && hasSubscription === false && (
                <div className="contact-locked-box">
                  <div className="locked-icon-wrap">
                    <IconLock size={26} />
                  </div>
                  <h3 className="locked-title">Messagerie réservée aux abonnés</h3>
                  <p className="locked-desc">
                    L'envoi de messages directs aux structures partenaires nécessite un abonnement Voyageur actif.
                  </p>
                  <div className="locked-perks">
                    <div className="locked-perk-item">
                      <IconCheck size={14} />
                      <span>Échanges illimités avec tous les professionnels</span>
                    </div>
                    <div className="locked-perk-item">
                      <IconCheck size={14} />
                      <span>Accès aux guides complets et conseils exclusifs</span>
                    </div>
                  </div>
                  <Link to="/subscriptions" className="btn btn-primary btn-block btn-lg">
                    <IconCreditCard size={16} />
                    <span>Activer mon abonnement (5 000 FCFA/mois)</span>
                  </Link>
                </div>
              )}

              {/* Cas 4 : Connecté avec abonnement actif (ou ADMIN) */}
              {isAuthenticated && (user?.role === "ADMIN" || (user?.role === "VOYAGEUR" && hasSubscription === true)) && (
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
                          Votre message d'introduction <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          className="form-input form-textarea"
                          rows={5}
                          placeholder="Bonjour, je prépare un voyage pour 2 personnes au mois prochain et souhaiterais obtenir des informations sur vos formules..."
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
                        {sending ? (
                          "Envoi en cours..."
                        ) : (
                          <>
                            <IconSend size={16} />
                            <span>Envoyer le message</span>
                          </>
                        )}
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
