import React from "react";
import { Link } from "react-router-dom";
import { IconLogo, IconMail, IconPhone, IconShieldCheck } from "./Icons";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="container footer-container">
        <div className="footer-main">
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <IconLogo size={24} />
              <span>Sylla Voyage</span>
            </Link>
            <p className="footer-desc">
              Mise en relation avec des agences et professionnels de voyage vérifiés au Sénégal.
            </p>
            <div className="footer-trust-tag">
              <IconShieldCheck size={15} />
              <span>Professionnels & guides vérifiés</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Plateforme</h4>
            <ul className="footer-list">
              <li className="footer-item"><Link to="/professionals" className="footer-link">Annuaire des professionnels</Link></li>
              <li className="footer-item"><Link to="/publications" className="footer-link">Offres de voyage</Link></li>
              <li className="footer-item"><Link to="/subscriptions" className="footer-link">Tarifs & Abonnements</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Contact & Support</h4>
            <ul className="footer-list">
              <li className="footer-item">
                <a
                  href="mailto:contact@syllaenglishacademy.com"
                  className="footer-link footer-contact-link"
                >
                  <IconMail size={14} />
                  <span>contact@syllaenglishacademy.com</span>
                </a>
              </li>
              <li className="footer-item">
                <a
                  href="https://wa.me/221777091913?text=Bonjour%20M.%20Sylla%2C%20je%20vous%20contacte%20concernant%20Sylla%20Voyage."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link footer-contact-link"
                >
                  <IconPhone size={14} />
                  <span>WhatsApp / Tél : +221 77 709 19 13</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Sylla Voyage. Tous droits réservés.
          </p>
          <div className="footer-legal-links">
            <Link to="/publications" className="footer-legal-link">CGU</Link>
            <Link to="/publications" className="footer-legal-link">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
