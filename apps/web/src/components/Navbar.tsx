import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconLogo,
  IconUser,
  IconLogOut,
  IconCreditCard,
  IconChevronDown,
  IconFileText,
} from "./Icons";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const p = user.prenom?.charAt(0) || "";
    const n = user.nom?.charAt(0) || "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand">
          <IconLogo size={28} />
          <span className="brand-text">Sylla Voyage</span>
        </Link>

        {/* Actions visiteur mobile (sans hamburger) */}
        {!isAuthenticated && (
          <div className="navbar-mobile-visitor-actions">
            <Link to="/login" className="nav-mobile-btn-login" id="nav-mobile-login">
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm nav-mobile-btn-register" id="nav-mobile-register">
              S'inscrire
            </Link>
          </div>
        )}

        {/* Navigation principale */}
        <nav className={`navbar-nav ${mobileMenuOpen ? "is-open" : ""}`}>
          {!isAuthenticated || !user ? (
            /* ========================================== */
            /* 1. VISITEUR NON CONNECTÉ                   */
            /* ========================================== */
            <div className="nav-group-visitor">
              <div className="nav-links-list">
                <Link to="/publications" className="nav-link" id="nav-offres">
                  Offres
                </Link>
                <Link to="/professionals" className="nav-link" id="nav-find-pro">
                  Trouver un professionnel
                </Link>
                <Link to="/subscriptions" className="nav-link" id="nav-tarifs">
                  Tarifs
                </Link>
              </div>
              <div className="nav-auth-buttons">
                <Link to="/login" className="nav-btn-link" id="nav-login">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">
                  S'inscrire
                </Link>
              </div>
            </div>
          ) : user.role === "ADMIN" ? (
            /* ========================================== */
            /* 2. ADMINISTRATEUR CONNECTÉ                */
            /* ========================================== */
            <div className="nav-group-admin">
              <div className="nav-links-list">
                <Link to="/dashboard" className="nav-link" id="nav-admin-dashboard">
                  Tableau de bord
                </Link>
                <Link to="/admin/users" className="nav-link" id="nav-admin-users">
                  Utilisateurs & Agences
                </Link>
                <Link to="/publications" className="nav-link" id="nav-admin-offres">
                  Offres
                </Link>
                <Link to="/admin/verifications" className="nav-link" id="nav-admin-verif">
                  Vérifications
                </Link>
                <Link to="/admin/publications" className="nav-link" id="nav-admin-pubs">
                  Modération Pubs
                </Link>
                <Link to="/admin/reports" className="nav-link" id="nav-admin-reports">
                  Signalements
                </Link>
                <Link to="/admin/audit-logs" className="nav-link" id="nav-admin-audit">
                  Journal d'audit
                </Link>
              </div>

              {/* Menu utilisateur admin */}
              <div className="user-menu-container" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="Menu administrateur"
                >
                  <span className="user-avatar-badge admin-badge">Admin</span>
                  <IconChevronDown size={14} className={`dropdown-chevron ${userDropdownOpen ? "open" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user.prenom} {user.nom}</div>
                      <div className="user-dropdown-role">Administrateur</div>
                    </div>
                    <Link to="/dashboard" className="user-dropdown-item">
                      <IconFileText size={16} />
                      <span>Tableau de bord</span>
                    </Link>
                    <Link to="/admin/users" className="user-dropdown-item">
                      <IconUser size={16} />
                      <span>Utilisateurs & Agences</span>
                    </Link>
                    <button
                      type="button"
                      className="user-dropdown-item dropdown-logout-btn"
                      onClick={handleLogout}
                    >
                      <IconLogOut size={16} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : user.role === "PROFESSIONNEL" ? (
            /* ========================================== */
            /* 3. PROFESSIONNEL CONNECTÉ                 */
            /* ========================================== */
            <div className="nav-group-pro">
              <div className="nav-links-list">
                <Link to="/dashboard" className="nav-link" id="nav-pro-dashboard">
                  Tableau de bord
                </Link>
                <Link to="/publications" className="nav-link" id="nav-pro-offres">
                  Offres
                </Link>
                <Link to="/messages" className="nav-link" id="nav-pro-messages">
                  Messages
                </Link>
                <Link to="/profile" className="nav-link" id="nav-pro-agency">
                  Mon agence
                </Link>
              </div>

              {/* Menu utilisateur professionnel */}
              <div className="user-menu-container" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="Menu utilisateur"
                >
                  <span className="user-avatar-initials">{getUserInitials()}</span>
                  <span className="user-menu-name-label">{user.nom}</span>
                  <IconChevronDown size={14} className={`dropdown-chevron ${userDropdownOpen ? "open" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user.nom}</div>
                      <div className="user-dropdown-role">Compte Professionnel</div>
                    </div>
                    <Link to="/dashboard" className="user-dropdown-item">
                      <IconFileText size={16} />
                      <span>Tableau de bord</span>
                    </Link>
                    <Link to="/profile" className="user-dropdown-item">
                      <IconUser size={16} />
                      <span>Mon profil</span>
                    </Link>
                    <Link to="/subscriptions" className="user-dropdown-item">
                      <IconCreditCard size={16} />
                      <span>Mon abonnement</span>
                    </Link>
                    <button
                      type="button"
                      className="user-dropdown-item dropdown-logout-btn"
                      onClick={handleLogout}
                    >
                      <IconLogOut size={16} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================== */
            /* 4. VOYAGEUR CONNECTÉ                      */
            /* ========================================== */
            <div className="nav-group-voyageur">
              <div className="nav-links-list">
                <Link to="/publications" className="nav-link" id="nav-voyageur-offres">
                  Offres
                </Link>
                <Link to="/professionals" className="nav-link" id="nav-voyageur-pros">
                  Trouver un professionnel
                </Link>
                <Link to="/messages" className="nav-link" id="nav-voyageur-messages">
                  Messages
                </Link>
              </div>

              {/* Menu utilisateur voyageur */}
              <div className="user-menu-container" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="Menu utilisateur"
                >
                  <span className="user-avatar-initials">{getUserInitials()}</span>
                  <span className="user-menu-name-label">{user.prenom}</span>
                  <IconChevronDown size={14} className={`dropdown-chevron ${userDropdownOpen ? "open" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user.prenom} {user.nom}</div>
                      <div className="user-dropdown-role">Compte Voyageur</div>
                    </div>
                    <Link to="/dashboard" className="user-dropdown-item">
                      <IconFileText size={16} />
                      <span>Tableau de bord</span>
                    </Link>
                    <Link to="/profile" className="user-dropdown-item">
                      <IconUser size={16} />
                      <span>Mon profil</span>
                    </Link>
                    <Link to="/subscriptions" className="user-dropdown-item">
                      <IconCreditCard size={16} />
                      <span>Mon abonnement</span>
                    </Link>
                    <button
                      type="button"
                      className="user-dropdown-item dropdown-logout-btn"
                      onClick={handleLogout}
                    >
                      <IconLogOut size={16} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
