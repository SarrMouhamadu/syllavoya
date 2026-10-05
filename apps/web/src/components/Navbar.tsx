import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">🌍</span>
          <span className="brand-text">Sylla Voyage</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menu principal"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation links */}
        <nav className={`navbar-nav ${menuOpen ? "is-open" : ""}`}>
          <Link
            to="/"
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            Accueil
          </Link>
          <Link
            to="/professionals"
            className="nav-link"
            id="nav-professionals-link"
            onClick={() => setMenuOpen(false)}
          >
            Professionnels
          </Link>
          <Link
            to="/publications"
            className="nav-link"
            id="nav-publications-link"
            onClick={() => setMenuOpen(false)}
          >
            Guides & Infos
          </Link>

          {isAuthenticated && user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  to="/admin/reports"
                  className="nav-link"
                  id="nav-admin-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Administration
                </Link>
              )}
              {user.role !== "ADMIN" && (
                <Link
                  to="/subscriptions"
                  className="nav-link"
                  id="nav-subscriptions-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Abonnement
                </Link>
              )}
              <Link
                to="/messages"
                className="nav-link"
                id="nav-messages-link"
                onClick={() => setMenuOpen(false)}
              >
                Messages
              </Link>
              <Link
                to="/profile"
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                Mon Profil
              </Link>
              <div className="nav-user-info">
                <span className="user-badge user-badge-role">
                  {user.role === "PROFESSIONNEL"
                    ? "Professionnel"
                    : user.role === "ADMIN"
                    ? "Admin"
                    : "Voyageur"}
                </span>
                <span className="user-name">
                  {user.prenom} {user.nom}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="nav-auth-buttons">
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
