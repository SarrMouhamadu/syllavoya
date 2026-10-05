import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscriptionsApi,
  type SubscriptionPlan,
  type UserSubscription,
  type CreateSubscriptionResult,
} from "../api/subscriptions";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";

export const SubscriptionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Données
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<UserSubscription | null>(null);

  // États de chargement et d'erreur
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sélection pour visiteurs non connectés (toggle Voyageur / Pro)
  const [unauthRole, setUnauthRole] = useState<"VOYAGEUR" | "PROFESSIONNEL">("VOYAGEUR");

  // Étape de paiement
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"NABOOPAY" | "BICTORYS">("NABOOPAY");
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<CreateSubscriptionResult | null>(null);
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);

  // Charger les formules et l'abonnement actuel
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Charger les formules disponibles
      const plansRes = await subscriptionsApi.listPlans();
      if (plansRes.success && plansRes.data?.plans) {
        setPlans(plansRes.data.plans);
      }

      // 2. Charger l'abonnement du compte si connecté
      if (isAuthenticated) {
        try {
          const subRes = await subscriptionsApi.getMySubscription();
          if (subRes.success) {
            setMySubscription(subRes.data.subscription);
          }
        } catch {
          // Erreur non bloquante pour l'abonnement
        }
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger les formules d'abonnement. Veuillez vérifier votre connexion."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage des formules selon le rôle ou le choix du visiteur
  const effectiveRole = isAuthenticated && user ? user.role : unauthRole;
  const filteredPlans = plans.filter((p) => p.type_utilisateur === effectiveRole);

  // Vérifier si l'utilisateur a un abonnement actif
  const hasActiveSub = mySubscription?.statut === "ACTIF";
  const hasExpiredSub = mySubscription?.statut === "EXPIRE";
  const hasPendingSub = mySubscription?.statut === "EN_ATTENTE";

  // Formattage date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Gestion du choix d'une formule
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion
      navigate("/login", {
        state: { from: location, message: "Connectez-vous pour souscrire à cet abonnement." },
      });
      return;
    }

    setSelectedPlan(plan);
    setPaymentResult(null);
    setPaymentVerificationStatus(null);
    setSelectedProvider("NABOOPAY"); // Défaut Wave/OM
  };

  // Récupérer le coût et les frais réels retournés par le backend pour le canal sélectionné
  const getSelectedBreakdown = () => {
    if (!selectedPlan) return null;
    const channel = selectedPlan.canaux_paiement_supportes?.find(
      (c) => c.provider === selectedProvider
    );
    const frais = channel ? channel.frais_estimes : (selectedPlan.frais_operateur ?? 0);
    const total = selectedPlan.prix + frais;
    const isBictorys = selectedProvider === "BICTORYS";
    return {
      prix: selectedPlan.prix,
      frais,
      total,
      provider: selectedProvider,
      label:
        channel?.label ||
        (isBictorys
          ? "Carte Bancaire (Visa / Mastercard)"
          : "Mobile Money (Wave / Orange Money)"),
    };
  };

  // Initialisation du paiement auprès du backend (source de vérité)
  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;

    try {
      setPaymentSubmitting(true);
      setError(null);

      // Si l'abonnement actuel a expiré et qu'on renouvelle la même formule
      let result: CreateSubscriptionResult;
      if (hasExpiredSub && mySubscription?.id && mySubscription.formule?.id === selectedPlan.id) {
        const res = await subscriptionsApi.renewSubscription(mySubscription.id, {
          provider: selectedProvider,
        });
        result = res.data;
      } else {
        const res = await subscriptionsApi.createSubscription({
          formule_id: selectedPlan.id,
          provider: selectedProvider,
        });
        result = res.data;
      }

      setPaymentResult(result);
      setPaymentVerificationStatus("EN_ATTENTE");
      // Rafraîchir l'état local depuis le serveur
      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'initialisation du paiement. Veuillez réessayer.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Vérifier la confirmation côté serveur (le frontend ne confirme jamais seul)
  const handleVerifyPayment = async () => {
    if (!paymentResult?.payment?.id) return;

    try {
      setVerifyingPayment(true);
      const res = await subscriptionsApi.getPayment(paymentResult.payment.id);
      const paymentStatus = res.data?.payment?.statut;

      if (paymentStatus === "CONFIRME") {
        setPaymentVerificationStatus("CONFIRME");
        await fetchData();
      } else if (paymentStatus === "ECHOUE") {
        setPaymentVerificationStatus("ECHOUE");
      } else {
        setPaymentVerificationStatus("EN_ATTENTE_INFO");
      }
    } catch (err: any) {
      setError("Impossible de vérifier l'état du paiement. Veuillez réessayer.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="subscriptions-page">
      <div className="container subscriptions-container">
        {/* Titre & En-tête */}
        <div className="page-header text-center">
          <span className="page-badge">Formules & Tarifs</span>
          <h1 className="page-title">Abonnements Sylla Voyage</h1>
          <p className="page-subtitle">
            Accédez à toutes les fonctionnalités et aux professionnels vérifiés en toute sécurité.
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* 1. ÉTAT DE L'ABONNEMENT POUR UTILISATEUR CONNECTÉ */}
        {isAuthenticated && user && (
          <section className="subscription-status-section" aria-label="Statut de l'abonnement">
            {user.role === "ADMIN" ? (
              <div className="sub-status-card sub-status-admin">
                <div className="sub-status-header">
                  <span className="status-badge-icon">🛡️</span>
                  <div>
                    <h3 className="sub-status-title">Compte Administrateur</h3>
                    <p className="sub-status-desc">
                      Votre compte bénéficie d'un accès administratif complet sans abonnement.
                    </p>
                  </div>
                </div>
              </div>
            ) : hasActiveSub && mySubscription ? (
              <div className="sub-status-card sub-status-active">
                <div className="sub-status-header">
                  <span className="badge-verified">✓ Abonnement Actif</span>
                  <span className="sub-role-tag">
                    {user.role === "PROFESSIONNEL" ? "Formule Professionnel" : "Formule Voyageur"}
                  </span>
                </div>
                <div className="sub-status-body">
                  <div className="sub-info-row">
                    <span className="sub-info-label">Formule actuelle :</span>
                    <strong className="sub-info-val">
                      {mySubscription.formule?.nom || "Abonnement Sylla Voyage"}
                    </strong>
                  </div>
                  <div className="sub-info-dates">
                    <div className="sub-date-block">
                      <span className="date-label">Début :</span>
                      <span className="date-val">{formatDate(mySubscription.date_debut)}</span>
                    </div>
                    <div className="sub-date-block">
                      <span className="date-label">Expiration :</span>
                      <strong className="date-val text-primary">
                        {formatDate(mySubscription.date_fin)}
                      </strong>
                    </div>
                  </div>
                  <p className="sub-status-note">
                    Votre accès aux fonctionnalités et contacts est actuellement actif.
                  </p>
                </div>
              </div>
            ) : hasExpiredSub && mySubscription ? (
              <div className="sub-status-card sub-status-expired">
                <div className="sub-status-header">
                  <span className="badge-status-expired">⚠️ Abonnement Expiré</span>
                </div>
                <div className="sub-status-body">
                  <p className="sub-status-desc">
                    Votre abonnement <strong>{mySubscription.formule?.nom || ""}</strong> est arrivé
                    à expiration le <strong>{formatDate(mySubscription.date_fin)}</strong>.
                  </p>
                  <p className="sub-status-note">
                    Renouvelez votre abonnement ci-dessous pour restaurer votre accès aux
                    fonctionnalités réservées.
                  </p>
                </div>
              </div>
            ) : hasPendingSub && mySubscription ? (
              <div className="sub-status-card sub-status-pending">
                <div className="sub-status-header">
                  <span className="badge-status-pending">⏳ Paiement en attente de confirmation</span>
                </div>
                <div className="sub-status-body">
                  <p className="sub-status-desc">
                    Une souscription est actuellement enregistrée en attente de confirmation serveur
                    par l'opérateur de paiement.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={fetchData}
                  >
                    🔄 Vérifier l'activation
                  </button>
                </div>
              </div>
            ) : (
              <div className="sub-status-card sub-status-none">
                <div className="sub-status-header">
                  <span className="badge-status-neutral">Aucun abonnement actif</span>
                </div>
                <p className="sub-status-desc">
                  Vous ne disposez pas d'abonnement actif. Choisissez une formule ci-dessous pour
                  débloquer l'accès complet.
                </p>
              </div>
            )}
          </section>
        )}

        {/* SÉLECTEUR DE RÔLE SI VISITEUR NON CONNECTÉ */}
        {!isAuthenticated && (
          <div className="role-switch-container">
            <span className="role-switch-label">Afficher les tarifs pour :</span>
            <div className="role-switch-buttons">
              <button
                type="button"
                className={`btn btn-sm ${unauthRole === "VOYAGEUR" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setUnauthRole("VOYAGEUR")}
                id="tab-role-voyageur"
              >
                🎒 Voyageurs
              </button>
              <button
                type="button"
                className={`btn btn-sm ${unauthRole === "PROFESSIONNEL" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setUnauthRole("PROFESSIONNEL")}
                id="tab-role-professionnel"
              >
                🏢 Professionnels
              </button>
            </div>
          </div>
        )}

        {/* 2. MODAL / ENCART DE PAIEMENT SÉLECTIONNÉ */}
        {selectedPlan && (
          <div className="checkout-panel" id="checkout-panel" tabIndex={-1}>
            <div className="checkout-panel-header">
              <h2 className="checkout-title">Confirmation de la formule</h2>
              <button
                type="button"
                className="checkout-close"
                onClick={() => {
                  setSelectedPlan(null);
                  setPaymentResult(null);
                }}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Si un paiement a été initié et est en attente */}
            {paymentResult ? (
              <div className="payment-initiated-view">
                <div className="payment-initiated-status">
                  <span className="payment-icon">⏳</span>
                  <h3>Paiement initié — En attente de confirmation</h3>
                  <p className="text-muted">
                    Référence : <code>{paymentResult.payment.reference}</code>
                  </p>
                </div>

                <div className="payment-summary-box">
                  <div className="summary-row">
                    <span>Formule :</span>
                    <strong>{selectedPlan.nom}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Moyen choisi :</span>
                    <strong>{paymentResult.canal}</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Montant total :</span>
                    <strong className="text-primary">
                      {paymentResult.breakdown.montant_total.toLocaleString("fr-FR")} FCFA
                    </strong>
                  </div>
                </div>

                <div className="payment-instructions">
                  <p>
                    Veuillez procéder au paiement sur la page sécurisée. Dès confirmation reçue par
                    notre serveur, votre abonnement sera activé automatiquement.
                  </p>
                </div>

                {paymentResult.checkout_url && (
                  <div className="payment-actions-group">
                    <a
                      href={paymentResult.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-block btn-lg"
                      id="btn-goto-checkout"
                    >
                      💳 Ouvrir la page de paiement sécurisée
                    </a>
                  </div>
                )}

                <div className="payment-verify-group">
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={handleVerifyPayment}
                    disabled={verifyingPayment}
                    id="btn-verify-payment"
                  >
                    {verifyingPayment ? "Vérification en cours..." : "🔄 Vérifier l'état du paiement"}
                  </button>

                  {paymentVerificationStatus === "CONFIRME" && (
                    <div className="alert alert-success mt-2">
                      ✓ Paiement validé par le serveur ! Votre abonnement est désormais actif.
                    </div>
                  )}
                  {paymentVerificationStatus === "EN_ATTENTE_INFO" && (
                    <div className="alert alert-info mt-2">
                      Paiement toujours en cours de traitement par l'opérateur. Veuillez finaliser
                      votre règlement sur la page sécurisée.
                    </div>
                  )}
                  {paymentVerificationStatus === "ECHOUE" && (
                    <div className="alert alert-error mt-2">
                      Le paiement n'a pas pu aboutir. Vous pouvez réessayer.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Écran de préparation du paiement */
              <div className="checkout-form-view">
                <div className="checkout-plan-info">
                  <span className="checkout-plan-name">{selectedPlan.nom}</span>
                  <div className="checkout-plan-price">
                    {selectedPlan.prix.toLocaleString("fr-FR")} FCFA
                    <span className="checkout-plan-duration">
                      {" "}
                      / {selectedPlan.duree === "ANNUEL" ? "an" : "mois"}
                    </span>
                  </div>
                </div>

                {/* Choix du moyen de paiement et détail transparent */}
                {(() => {
                  const nabooChannel = selectedPlan.canaux_paiement_supportes?.find(
                    (c) => c.provider === "NABOOPAY"
                  );
                  const bictorysChannel = selectedPlan.canaux_paiement_supportes?.find(
                    (c) => c.provider === "BICTORYS"
                  );
                  const b = getSelectedBreakdown();

                  return (
                    <>
                      <div className="payment-provider-select">
                        <label className="provider-select-label">
                          Choisissez votre moyen de paiement :
                        </label>
                        <div className="provider-options">
                          <label
                            className={`provider-card ${selectedProvider === "NABOOPAY" ? "is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="payment-provider"
                              value="NABOOPAY"
                              checked={selectedProvider === "NABOOPAY"}
                              onChange={() => setSelectedProvider("NABOOPAY")}
                            />
                            <div className="provider-info">
                              <span className="provider-title">📱 Mobile Money</span>
                              <span className="provider-subtitle">Wave / Orange Money (NabooPay)</span>
                              {nabooChannel && (
                                <span className="provider-fee">
                                  Frais : +{nabooChannel.frais_estimes.toLocaleString("fr-FR")} FCFA
                                </span>
                              )}
                            </div>
                          </label>

                          <label
                            className={`provider-card ${selectedProvider === "BICTORYS" ? "is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="payment-provider"
                              value="BICTORYS"
                              checked={selectedProvider === "BICTORYS"}
                              onChange={() => setSelectedProvider("BICTORYS")}
                            />
                            <div className="provider-info">
                              <span className="provider-title">💳 Carte Bancaire</span>
                              <span className="provider-subtitle">Visa / Mastercard (Bictorys)</span>
                              {bictorysChannel && (
                                <span className="provider-fee">
                                  Frais : +{bictorysChannel.frais_estimes.toLocaleString("fr-FR")} FCFA
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Détail transparent des montants réels */}
                      {b && (
                        <div className="payment-breakdown-card">
                          <div className="breakdown-title">Détail du paiement :</div>
                          <div className="breakdown-row">
                            <span>Prix de la formule :</span>
                            <span>{b.prix.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                          <div className="breakdown-row">
                            <span>Frais opérateur :</span>
                            <span>+{b.frais.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                          <div className="breakdown-row breakdown-total">
                            <strong>Total à payer :</strong>
                            <strong>{b.total.toLocaleString("fr-FR")} FCFA</strong>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="checkout-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handleConfirmPayment}
                    disabled={paymentSubmitting}
                    id="btn-confirm-payment"
                  >
                    {paymentSubmitting ? (
                      "Initialisation du paiement..."
                    ) : (
                      `Payer ${getSelectedBreakdown()?.total.toLocaleString("fr-FR")} FCFA`
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => setSelectedPlan(null)}
                    disabled={paymentSubmitting}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. GRILLE DES FORMULES DISPONIBLES */}
        {loading ? (
          <LoadingSpinner message="Chargement des formules d'abonnement..." />
        ) : filteredPlans.length === 0 ? (
          <div className="empty-plans-state">
            <span className="empty-icon">🏷️</span>
            <h3>Aucune formule disponible</h3>
            <p>Les formules pour ce rôle sont momentanément indisponibles.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {filteredPlans.map((plan) => {
              const isCurrent =
                hasActiveSub && mySubscription?.formule?.id === plan.id;
              const isMonthly = plan.duree === "MENSUEL";

              return (
                <div
                  key={plan.id}
                  className={`plan-card ${isCurrent ? "plan-card-current" : ""} ${
                    !isMonthly ? "plan-card-featured" : ""
                  }`}
                  id={`plan-card-${plan.id}`}
                >
                  {isCurrent && (
                    <div className="plan-badge-current">
                      ✓ Formule Actuelle
                    </div>
                  )}
                  {!isMonthly && !isCurrent && (
                    <div className="plan-badge-discount">
                      Meilleure Offre
                    </div>
                  )}

                  <div className="plan-card-header">
                    <h2 className="plan-name">{plan.nom}</h2>
                    <span className="plan-role-label">
                      {plan.type_utilisateur === "PROFESSIONNEL"
                        ? "Compte Professionnel"
                        : "Compte Voyageur"}
                    </span>
                  </div>

                  <div className="plan-price-block">
                    <span className="plan-price">
                      {plan.prix.toLocaleString("fr-FR")}
                    </span>
                    <span className="plan-currency">FCFA</span>
                    <span className="plan-duration">
                      / {isMonthly ? "mois" : "an"}
                    </span>
                  </div>

                  <ul className="plan-features-list">
                    <li>
                      ✓ Accès complet {isMonthly ? "pendant 30 jours" : "pendant 365 jours"}
                    </li>
                    {plan.type_utilisateur === "PROFESSIONNEL" ? (
                      <>
                        <li>✓ Visibilité dans l'annuaire des professionnels</li>
                        <li>✓ Réception des demandes de contact voyageurs</li>
                        <li>✓ Publication d'annonces et circuits validés</li>
                      </>
                    ) : (
                      <>
                        <li>✓ Mise en relation avec les professionnels vérifiés</li>
                        <li>✓ Accès aux guides complets et informations fiables</li>
                        <li>✓ Messagerie et échange de documents sécurisés</li>
                      </>
                    )}
                    <li>✓ Paiement sécurisé Wave, Orange Money et Carte</li>
                  </ul>

                  <div className="plan-action-wrapper">
                    {isCurrent ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-block btn-lg"
                        disabled
                        aria-label="Formule déjà active"
                      >
                        Formule Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-block btn-lg"
                        onClick={() => handleSelectPlan(plan)}
                        id={`btn-choose-plan-${plan.id}`}
                      >
                        {hasExpiredSub && mySubscription?.formule?.id === plan.id
                          ? "Renouveler"
                          : "Choisir cette formule"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. NOTE DE CONFIANCE & SÉCURITÉ */}
        <div className="subscription-guarantee-card">
          <div className="guarantee-icon">🔒</div>
          <div className="guarantee-content">
            <h4>Paiement 100% sécurisé et transparent</h4>
            <p>
              Toutes les transactions sont traitées par nos partenaires agréés NabooPay et
              Bictorys. Aucun numéro de carte ou code secret n'est conservé sur nos serveurs.
              L'activation de votre abonnement est confirmée automatiquement dès réception de la
              validation bancaire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
