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
              Plateforme de mise en relation directe avec des agences de voyage et professionnels formels et vérifiés au Sénégal.
            </p>
            <div className="footer-trust-tag">
              <IconShieldCheck size={16} />
              <span>Vérification administrative rigoureuse</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Plateforme</h4>
            <ul className="footer-list">
              <li><Link to="/professionals">Trouver un professionnel</Link></li>
              <li><Link to="/publications">Guides & Conseils</Link></li>
              <li><Link to="/subscriptions">Tarifs & Abonnements</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-list">
              <li>
                <a href="mailto:contact@syllavoyage.pro" className="footer-contact-link">
                  <IconMail size={16} />
                  <span>contact@syllavoyage.pro</span>
                </a>
              </li>
              <li>
                <a href="tel:+221770000000" className="footer-contact-link">
                  <IconPhone size={16} />
                  <span>+221 77 000 00 00</span>
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
            <Link to="/publications">Conditions générales</Link>
            <Link to="/publications">Politique de confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
