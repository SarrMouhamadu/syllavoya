import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconLock,
  IconCheck,
  IconCreditCard,
  IconShieldCheck,
  IconArrowRight,
} from "./Icons";

interface LockedSubscriptionPaywallProps {
  title: string;
  subtitle: string;
  perks?: string[];
}

export const LockedSubscriptionPaywall: React.FC<LockedSubscriptionPaywallProps> = ({
  title,
  subtitle,
  perks = [
    "Consultation des agences de voyage et guides professionnels certifiés",
    "Messagerie directe et demandes de devis sécurisées",
    "Guides, circuits et conseils exclusifs rédigés par les professionnels",
    "Règlement simple et instantané via Wave ou Orange Money",
  ],
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <div className="subscription-paywall-wrap">
      <div className="subscription-paywall-card">
        <div className="paywall-badge">
          <IconShieldCheck size={16} />
          <span>Contenu Réservé aux Membres</span>
        </div>

        <div className="paywall-lock-circle">
          <IconLock size={32} />
        </div>

        <h2 className="paywall-title">{title}</h2>
        <p className="paywall-subtitle">{subtitle}</p>

        <div className="paywall-perks-box">
          <h3 className="paywall-perks-title">Inclus avec votre abonnement :</h3>
          <ul className="paywall-perks-list">
            {perks.map((perk, index) => (
              <li key={index} className="paywall-perk-item">
                <IconCheck size={16} className="perk-icon" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="paywall-price-banner">
          <div className="price-tag">
            <span className="price-num">5 000</span>
            <span className="price-unit">FCFA / mois</span>
          </div>
          <span className="price-note">Paiement Mobile Money sécurisé (Wave, Orange Money)</span>
        </div>

        <div className="paywall-actions">
          {isAuthenticated ? (
            <Link
              to="/subscriptions"
              state={{ from: location }}
              className="btn btn-primary btn-lg btn-block"
              id="paywall-subscribe-btn"
            >
              <IconCreditCard size={18} />
              <span>Activer mon abonnement (5 000 FCFA)</span>
            </Link>
          ) : (
            <div className="paywall-unauth-actions">
              <Link
                to="/login"
                state={{ from: location }}
                className="btn btn-primary btn-lg btn-block"
                id="paywall-login-btn"
              >
                <span>Se connecter</span>
                <IconArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="btn btn-outline btn-lg btn-block"
                id="paywall-register-btn"
              >
                <span>Créer un compte Voyageur</span>
              </Link>
            </div>
          )}

          <div className="paywall-guarantee-note">
            <span>Transaction chiffrée & activation immédiate après validation du paiement.</span>
          </div>
        </div>
      </div>

      {/* Vue Mobile iOS fidèle à Abonnement.dc.html */}
      <div className="ios-sub-mobile">
        <div className="ios-sub-icon-wrap">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <h1 className="ios-sub-title">Débloquez l’annuaire</h1>
        <div className="ios-sub-subtitle">Accès réservé aux membres</div>

        <div className="ios-sub-card">
          <div className="ios-sub-perk-row">
            <span className="ios-sub-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A64D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            <span>Annuaire complet des agences</span>
          </div>

          <div className="ios-sub-perk-row">
            <span className="ios-sub-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A64D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            <span>Coordonnées et fiches détaillées</span>
          </div>

          <div className="ios-sub-perk-row">
            <span className="ios-sub-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A64D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            <span>Messagerie directe et devis</span>
          </div>

          <div className="ios-sub-perk-row">
            <span className="ios-sub-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A64D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            <span>Offres de voyage vérifiées</span>
          </div>
        </div>

        <div className="ios-sub-price-block">
          <span className="ios-sub-price-amount">5 000</span>
          <span className="ios-sub-price-unit"> FCFA / mois</span>
          <div className="ios-sub-price-note">Wave ou Orange Money</div>
        </div>

        <div className="ios-sub-bottom-bar">
          {isAuthenticated ? (
            <Link
              to="/subscriptions"
              state={{ from: location }}
              className="ios-sub-cta-btn"
              id="ios-paywall-subscribe-btn"
            >
              Activer l’abonnement
            </Link>
          ) : (
            <Link
              to="/login"
              state={{ from: location }}
              className="ios-sub-cta-btn"
              id="ios-paywall-login-btn"
            >
              Activer l’abonnement
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
