import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscriptionsApi,
  type SubscriptionPlan,
  type UserSubscription,
  type CreateSubscriptionResult,
  type PaymentChannel,
} from "../api/subscriptions";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import {
  IconShieldCheck,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconCompass,
  IconBuilding,
  IconX,
  IconCreditCard,
  IconPhone,
  IconFileText,
  IconLock,
} from "../components/Icons";

export const SubscriptionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Formule en cours de sélection pour paiement
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider] = useState<"NABOOPAY">("NABOOPAY");
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<CreateSubscriptionResult | null>(null);

  // État de vérification manuelle d'un paiement en cours
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState<string | null>(null);

  // Rôle sélectionné pour les visiteurs non connectés
  const [unauthRole, setUnauthRole] = useState<"VOYAGEUR" | "PROFESSIONNEL">("VOYAGEUR");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer toutes les formules actives
      const plansRes = await subscriptionsApi.listPlans();
      if (plansRes.success && plansRes.data?.plans) {
        setPlans(plansRes.data.plans);
      }

      // 2. Si connecté, récupérer son abonnement actif/récent
      if (isAuthenticated) {
        try {
          const subRes = await subscriptionsApi.getMySubscription();
          if (subRes.success && subRes.data?.subscription) {
            setMySubscription(subRes.data.subscription);
          }
        } catch {
          // Aucun abonnement actif
          setMySubscription(null);
        }
      }
    } catch (err: any) {
      setError(
        err?.message || "Impossible de charger les offres d'abonnement. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrer les formules selon le rôle de l'utilisateur ou le filtre visiteur
  const effectiveRole = isAuthenticated && user ? user.role : unauthRole;
  const filteredPlans = plans.filter((p) => {
    if (effectiveRole === "ADMIN") return true;
    return p.type_utilisateur === effectiveRole;
  });

  const hasActiveSub = mySubscription?.statut === "ACTIF";
  const hasExpiredSub = mySubscription?.statut === "EXPIRE";
  const hasPendingSub = mySubscription?.statut === "EN_ATTENTE_PAIEMENT";

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: "/subscriptions" } },
      });
      return;
    }
    setSelectedPlan(plan);
    setPaymentResult(null);
    setPaymentVerificationStatus(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    try {
      setPaymentSubmitting(true);
      setError(null);
      const res = await subscriptionsApi.createSubscription({
        formule_id: selectedPlan.id,
        provider: selectedProvider,
      });
      if (res.success && res.data) {
        setPaymentResult(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'initialisation du paiement.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentResult?.payment?.id) return;
    try {
      setVerifyingPayment(true);
      const res = await subscriptionsApi.getPayment(paymentResult.payment.id);
      if (res.success && res.data?.payment) {
        setPaymentVerificationStatus(res.data.payment.statut);
        if (res.data.payment.statut === "CONFIRME") {
          await fetchData();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de vérifier le paiement pour le moment.");
    } finally {
      setVerifyingPayment(false);
    }
  };


  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getSelectedBreakdown = () => {
    if (!selectedPlan) return null;
    const channel = selectedPlan.canaux_paiement_supportes?.find(
      (c: PaymentChannel) => c.provider === selectedProvider
    );
    if (!channel) return null;
    return {
      prix: selectedPlan.prix,
      frais: channel.frais_estimes,
      total: selectedPlan.montant_total || (selectedPlan.prix + (selectedPlan.frais_a_la_charge_du_client ? channel.frais_estimes : 0)),
      provider: selectedProvider,
      canalNom: channel.label,
    };
  };

  return (
    <div className="subscriptions-page">
      <div className="container subscriptions-container">
        {/* En-tête de section */}
        <div className="page-header">
          <span className="page-header-badge">Abonnements & Tarifs</span>
          <h1 className="page-title">Nos Formules d'Abonnement</h1>
          <p className="page-subtitle">
            Accédez aux services certifiés de Sylla Voyage selon votre profil. Tarifs transparents, sans engagement caché.
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
                  <IconShieldCheck size={24} className="icon-success" />
                  <div>
                    <h3 className="sub-status-title">Compte Administrateur</h3>
                    <p className="sub-status-desc">
                      Votre compte bénéficie d'un accès administratif complet sans restriction d'abonnement.
                    </p>
                  </div>
                </div>
              </div>
            ) : hasActiveSub && mySubscription ? (
              <div className="sub-status-card sub-status-active">
                <div className="sub-status-header">
                  <span className="badge-verified">
                    <IconCheck size={14} />
                    <span>Abonnement Actif</span>
                  </span>
                  <span className="sub-role-tag">
                    {user.role === "PROFESSIONNEL" ? "Formule Professionnel" : "Formule Voyageur"}
                  </span>
                </div>
                <div className="sub-status-body">
                  <div className="sub-info-row">
                    <span className="sub-info-label">Formule :</span>
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
                </div>
              </div>
            ) : hasExpiredSub && mySubscription ? (
              <div className="sub-status-card sub-status-expired">
                <div className="sub-status-header">
                  <span className="badge-status-expired">
                    <IconAlertTriangle size={14} />
                    <span>Abonnement Expiré</span>
                  </span>
                </div>
                <div className="sub-status-body">
                  <p className="sub-status-desc">
                    Votre abonnement <strong>{mySubscription.formule?.nom || ""}</strong> est arrivé
                    à expiration le <strong>{formatDate(mySubscription.date_fin)}</strong>.
                  </p>
                  <p className="sub-status-note">
                    Renouvelez votre formule ci-dessous pour restaurer vos accès.
                  </p>
                </div>
              </div>
            ) : hasPendingSub && mySubscription ? (
              <div className="sub-status-card sub-status-pending">
                <div className="sub-status-header">
                  <span className="badge-status-pending">
                    <IconRefresh size={14} />
                    <span>Paiement en cours de confirmation</span>
                  </span>
                </div>
                <div className="sub-status-body">
                  <p className="sub-status-desc">
                    Une souscription est en attente de validation par la passerelle de paiement.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={fetchData}
                    style={{ marginTop: "10px" }}
                  >
                    <IconRefresh size={14} />
                    <span>Vérifier l'activation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="sub-status-card sub-status-none">
                <div className="sub-status-header">
                  <span className="badge-status-neutral">Aucun abonnement actif</span>
                </div>
                <p className="sub-status-desc">
                  Choisissez une formule ci-dessous pour activer vos accès sur la plateforme.
                </p>
              </div>
            )}
          </section>
        )}

        {/* SÉLECTEUR DE RÔLE SI VISITEUR NON CONNECTÉ */}
        {!isAuthenticated && (
          <div className="role-switch-container">
            <span className="role-switch-label">Afficher les offres pour :</span>
            <div className="role-switch-buttons">
              <button
                type="button"
                className={`btn btn-sm ${unauthRole === "VOYAGEUR" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setUnauthRole("VOYAGEUR")}
                id="tab-role-voyageur"
              >
                <IconCompass size={16} />
                <span>Voyageurs</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${unauthRole === "PROFESSIONNEL" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setUnauthRole("PROFESSIONNEL")}
                id="tab-role-professionnel"
              >
                <IconBuilding size={16} />
                <span>Professionnels</span>
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
                <IconX size={18} />
              </button>
            </div>

            {/* Si un paiement a été initié et est en attente */}
            {paymentResult ? (
              <div className="payment-initiated-view">
                <div className="payment-initiated-status">
                  <IconRefresh size={32} className="spin-slow text-primary" />
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
                    Veuillez procéder au règlement sur la page sécurisée. Dès confirmation reçue par
                    le serveur, votre abonnement sera activé automatiquement.
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
                      <IconCreditCard size={18} />
                      <span>Accéder au paiement sécurisé</span>
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
                    <IconRefresh size={16} />
                    <span>{verifyingPayment ? "Vérification en cours..." : "Vérifier l'état du paiement"}</span>
                  </button>

                  {paymentVerificationStatus === "CONFIRME" && (
                    <div className="alert alert-success mt-2">
                      <IconCheck size={16} />
                      <span>Paiement validé par le serveur ! Votre abonnement est désormais actif.</span>
                    </div>
                  )}
                  {paymentVerificationStatus === "EN_ATTENTE_INFO" && (
                    <div className="alert alert-info mt-2">
                      Paiement en cours de traitement. Veuillez finaliser votre règlement sur la page sécurisée.
                    </div>
                  )}
                  {paymentVerificationStatus === "ECHOUE" && (
                    <div className="alert alert-error mt-2">
                      Le paiement n'a pas abouti. Vous pouvez réitérer la tentative.
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

                {/* Choix du moyen de paiement : NabooPay exclusively */}
                {(() => {
                  const nabooChannel = selectedPlan.canaux_paiement_supportes?.find(
                    (c: PaymentChannel) => c.provider === "NABOOPAY"
                  );
                  const b = getSelectedBreakdown();

                  return (
                    <>
                      <div className="payment-provider-select">
                        <label className="provider-select-label">
                          Moyen de paiement :
                        </label>
                        <div className="provider-options">
                          <label className="provider-card is-selected">
                            <input
                              type="radio"
                              name="payment-provider"
                              value="NABOOPAY"
                              checked={true}
                              readOnly
                            />
                            <div className="provider-info">
                              <span className="provider-title">
                                <IconPhone size={16} />
                                <span>Mobile Money</span>
                              </span>
                              <span className="provider-subtitle">Wave / Orange Money (NabooPay)</span>
                              {nabooChannel && (
                                <span className="provider-fee">
                                  Frais opérateur : +{nabooChannel.frais_estimes.toLocaleString("fr-FR")} FCFA
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Détail transparent des montants */}
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
                            <strong>Total à régler :</strong>
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
          <div className="center-container">
            <LoadingSpinner message="Chargement des formules d'abonnement..." size="large" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="empty-plans-state">
            <IconFileText size={36} />
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
                  className={`plan-card ${isCurrent ? "plan-card-current" : ""}`}
                  id={`plan-card-${plan.id}`}
                >
                  {isCurrent && (
                    <div className="plan-badge-current">
                      <IconCheck size={14} />
                      <span>Formule Actuelle</span>
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
                      <IconCheck size={16} />
                      <span>Accès complet {isMonthly ? "pendant 30 jours" : "pendant 365 jours"}</span>
                    </li>
                    {plan.type_utilisateur === "PROFESSIONNEL" ? (
                      <>
                        <li>
                          <IconCheck size={16} />
                          <span>Visibilité dans l'annuaire des professionnels vérifiés</span>
                        </li>
                        <li>
                          <IconCheck size={16} />
                          <span>Réception des messages directs des voyageurs</span>
                        </li>
                        <li>
                          <IconCheck size={16} />
                          <span>Publication d'offres et circuits touristiques</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <IconCheck size={16} />
                          <span>Mise en relation directe avec les structures vérifiées</span>
                        </li>
                        <li>
                          <IconCheck size={16} />
                          <span>Messagerie sécurisée avec échange de documents</span>
                        </li>
                        <li>
                          <IconCheck size={16} />
                          <span>Accès intégral aux guides et informations locales</span>
                        </li>
                      </>
                    )}
                    <li>
                      <IconCheck size={16} />
                      <span>Paiement sécurisé Mobile Money (Wave, OM) et Carte</span>
                    </li>
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
          <div className="guarantee-icon">
            <IconLock size={22} />
          </div>
          <div className="guarantee-content">
            <h4>Paiement sécurisé</h4>
            <p>
              Les règlements par Mobile Money (Wave et Orange Money) sont pris en charge par la passerelle sécurisée
              NabooPay. Aucune coordonnée bancaire n'est conservée sur nos serveurs. L'activation
              de votre formule est effectuée automatiquement dès confirmation de la transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
