import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { professionalsApi, type ApiProfessional } from "../api/professionals";
import { conversationsApi } from "../api/conversations";
import { useAuth } from "../context/AuthContext";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { LockedSubscriptionPaywall } from "../components/LockedSubscriptionPaywall";
import { formatDisplayNoEmoji } from "../utils/textUtils";
import {
  IconBuilding,
  IconShieldCheck,
  IconPhone,
  IconCheck,
  IconArrowLeft,
  IconChevronLeft,
  IconSend,
} from "../components/Icons";

const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    return `+1 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  if (cleaned.startsWith("+221") && cleaned.length === 13) {
    return `+221 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`;
  }
  return phone;
};

const parseServices = (text: string | null | undefined): string[] => {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];
  for (const line of lines) {
    if (/^services?\s*(proposés|offerts)?\s*:?$/i.test(line)) {
      continue;
    }
    const cleaned = line.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, "").trim();
    if (cleaned) {
      items.push(cleaned);
    }
  }
  return items;
};

export const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { loading: accessLoading, hasAccess } = useSubscriptionAccess();

  const [pro, setPro] = useState<ApiProfessional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire de contact
  const [premierMessage, setPremierMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  const handleOpenContactSheet = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setIsContactSheetOpen(true);
  };

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
    if (hasAccess || isAuthenticated) {
      fetchProfessional();
    }
  }, [hasAccess, isAuthenticated, fetchProfessional]);

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

        {/* État de chargement de l'accès */}
        {accessLoading && (
          <div className="center-container">
            <LoadingSpinner message="Vérification de votre abonnement..." size="large" />
          </div>
        )}

        {/* Verrouillage payant si non abonné et pas le propriétaire */}
        {!accessLoading && !hasAccess && (!pro || !user || pro.utilisateur_id !== user.id) && (
          <LockedSubscriptionPaywall
            title="Fiche de l'agence réservée aux abonnés"
            subtitle="Pour consulter les informations détaillées, les coordonnées directes et contacter cette agence, un abonnement actif est requis."
            perks={[
              "Accès complet à la fiche de l'agence et aux prestations proposées",
              "Numéro de téléphone direct et coordonnées vérifiées",
              "Prise de contact directe et messagerie privée",
              "Règlement simple et instantané via Wave ou Orange Money (5 000 FCFA/mois)",
            ]}
          />
        )}

        {/* État de chargement des données */}
        {!accessLoading && (hasAccess || (pro && user && pro.utilisateur_id === user.id)) && loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement de la fiche professionnelle..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!accessLoading && (hasAccess || (pro && user && pro.utilisateur_id === user.id)) && !loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/professionals" className="btn btn-outline" style={{ marginTop: "14px" }}>
              Voir les autres professionnels
            </Link>
          </div>
        )}

        {/* Fiche détaillée si abonné ou propriétaire */}
        {!accessLoading && (hasAccess || (pro && user && pro.utilisateur_id === user.id)) && !loading && !error && pro && (
          <>
            {/* VUE MOBILE APPLE (Fiche.dc.html) */}
            <div className="ios-fiche-mobile">
              <Link to="/professionals" className="ios-fiche-back">
                <IconChevronLeft size={22} strokeWidth={1.8} />
                <span>Annuaire</span>
              </Link>

              <div className="ios-fiche-header">
                <div className="ios-fiche-avatar">
                  <IconBuilding size={32} />
                </div>
                <div className="ios-fiche-identity">
                  <h1 className="ios-fiche-name">{formatDisplayNoEmoji(pro.nom_structure)}</h1>
                  {pro.statut_verification === "VERIFIE" && (
                    <div className="ios-fiche-verified">
                      <IconShieldCheck size={15} stroke="#1D7A3C" strokeWidth={1.8} />
                      <span>Vérifié</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services & Prestations */}
              {(() => {
                const services = parseServices(pro.description);
                if (services.length > 0) {
                  return (
                    <>
                      <div className="ios-fiche-section-label">Services</div>
                      <div className="ios-fiche-services-card">
                        {services.map((srv, idx) => (
                          <div key={idx} className="ios-fiche-service-row">
                            <span className="ios-fiche-service-icon">
                              <IconCheck size={18} strokeWidth="2.2" />
                            </span>
                            <span>{formatDisplayNoEmoji(srv)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                }
                return null;
              })()}

              {/* Coordonnées téléphoniques directes */}
              {pro.telephone && (
                <a href={`tel:${pro.telephone}`} className="ios-fiche-contact-card">
                  <span className="ios-fiche-contact-icon">
                    <IconPhone size={18} />
                  </span>
                  <span>{formatPhoneNumber(pro.telephone)}</span>
                </a>
              )}

              {/* Barre CTA fixe en bas sur mobile */}
              <div className="ios-fixed-cta-bar">
                <div className="ios-fixed-cta-inner">
                  <button
                    type="button"
                    className="ios-btn-cta"
                    onClick={handleOpenContactSheet}
                    id="mobile-contact-cta"
                  >
                    Contacter l’agence
                  </button>
                </div>
              </div>

              {/* Bottom sheet de mise en relation */}
              {isContactSheetOpen && (
                <div className="ios-sheet-overlay" onClick={() => setIsContactSheetOpen(false)}>
                  <div className="ios-sheet-body" onClick={(e) => e.stopPropagation()}>
                    <div className="ios-sheet-header">
                      <h3 className="ios-sheet-title">Contacter {formatDisplayNoEmoji(pro.nom_structure)}</h3>
                      <button
                        type="button"
                        className="ios-sheet-close"
                        onClick={() => setIsContactSheetOpen(false)}
                      >
                        Fermer
                      </button>
                    </div>

                    {isAuthenticated && user?.role === "PROFESSIONNEL" ? (
                      <Alert
                        type="warning"
                        message="Seul un compte Voyageur peut initier une prise de contact avec une agence."
                      />
                    ) : contactSuccess ? (
                      <div>
                        <Alert type="success" message={contactSuccess} />
                        <Link
                          to="/messages"
                          className="ios-btn-cta"
                          style={{ marginTop: "14px" }}
                        >
                          Accéder à mes messages
                        </Link>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit}>
                        {contactError && (
                          <Alert
                            type="error"
                            message={contactError}
                            onClose={() => setContactError(null)}
                          />
                        )}
                        <textarea
                          className="ios-sheet-textarea"
                          placeholder="Bonjour, je souhaite des renseignements sur vos offres..."
                          value={premierMessage}
                          onChange={(e) => setPremierMessage(e.target.value)}
                          disabled={sending}
                          required
                        />
                        <button
                          type="submit"
                          className="ios-btn-cta"
                          disabled={sending || !premierMessage.trim()}
                        >
                          {sending ? "Envoi en cours..." : "Envoyer le message"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VUE DESKTOP EXISTANTE */}
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
                {/* Services & Prestations proposés par l'agence */}
                <section className="detail-section" style={{ marginBottom: "1.75rem" }}>
                  <h2 className="detail-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
                    <IconShieldCheck size={20} style={{ color: "#2563eb" }} />
                    <span>Services & Prestations proposés</span>
                  </h2>

                  {pro.description ? (
                    (() => {
                      const services = parseServices(pro.description);
                      if (services.length > 0) {
                        return (
                          <div
                            className="professional-services-grid"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                              gap: "10px",
                              marginTop: "12px",
                            }}
                          >
                            {services.map((srv, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  padding: "10px 14px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#0f172a",
                                }}
                              >
                                <div
                                  style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: "#dcfce7",
                                    color: "#16a34a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <IconCheck size={13} />
                                </div>
                                <span>{srv}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <p className="detail-section-content" style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {pro.description}
                        </p>
                      );
                    })()
                  ) : (
                    <p className="detail-section-content detail-content-empty">
                      Cette agence n'a pas encore détaillé ses services sur sa vitrine.
                    </p>
                  )}
                </section>

                {pro.informations_professionnelles &&
                !pro.informations_professionnelles.toLowerCase().includes("12345") &&
                !pro.informations_professionnelles.toLowerCase().includes("licence") && (
                  <section className="detail-section">
                    <h2 className="detail-section-title">Activité & Informations</h2>
                    <div className="detail-section-info-box">
                      <IconBuilding size={18} />
                      <p className="detail-section-content">{pro.informations_professionnelles}</p>
                    </div>
                  </section>
                )}

                {pro.telephone && (
                  <section className="detail-section">
                    <h2 className="detail-section-title">Contact téléphonique</h2>
                    <div className="detail-section-info-box">
                      <IconPhone size={18} />
                      <a
                        href={`tel:${pro.telephone}`}
                        className="detail-section-content"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {formatPhoneNumber(pro.telephone)}
                      </a>
                    </div>
                  </section>
                )}

                <section className="detail-section">
                  <h2 className="detail-section-title">Garanties de la plateforme</h2>
                  <ul className="guarantee-list">
                    <li>
                      <IconCheck size={16} />
                      <span>Pièce d'identité et justificatifs audités par l'administration</span>
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

              {/* Cas 3 : Connecté avec abonnement actif (ou ADMIN) */}
              {isAuthenticated && (user?.role === "ADMIN" || user?.role === "VOYAGEUR") && (
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
        </>
      )}
      </div>
    </div>
  );
};
