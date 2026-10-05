import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="container footer-container">
        <p className="footer-brand">
          <strong>Sylla Voyage</strong> — Plateforme de mise en relation entre voyageurs et professionnels du voyage vérifiés.
        </p>
        <p className="footer-meta">
          Conçu selon les standards de simplicité et d'accessibilité mobile-first • {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};
