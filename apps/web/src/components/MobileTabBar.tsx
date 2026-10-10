import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconCompass,
  IconFileText,
  IconMessage,
  IconUser,
  IconBuilding,
  IconShieldCheck,
} from "./Icons";

export const MobileTabBar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // Pas de barre d'onglets pour les visiteurs non connectés
  if (!isAuthenticated || !user) {
    return null;
  }

  // Masquer sur les écrans poussés (détails) qui ont leur propre bouton retour
  const isPushedScreen =
    /^\/professionals\/[a-zA-Z0-9_-]+$/.test(pathname) ||
    /^\/publications\/[a-zA-Z0-9_-]+$/.test(pathname) ||
    /^\/messages\/[a-zA-Z0-9_-]+$/.test(pathname);

  if (isPushedScreen) {
    return null;
  }

  // Définition des onglets par rôle
  const getTabs = () => {
    if (user.role === "PROFESSIONNEL") {
      return [
        {
          label: "Offres",
          path: "/publications",
          icon: <IconFileText size={24} strokeWidth="1.8" />,
          isActive: pathname === "/publications",
        },
        {
          label: "Messages",
          path: "/messages",
          icon: <IconMessage size={24} strokeWidth="1.8" />,
          isActive: pathname === "/messages",
        },
        {
          label: "Vitrine",
          path: "/profile",
          icon: <IconBuilding size={24} strokeWidth="1.8" />,
          isActive: pathname === "/profile",
        },
        {
          label: "Tableau de bord",
          path: "/dashboard",
          icon: <IconShieldCheck size={24} strokeWidth="1.8" />,
          isActive: pathname === "/dashboard",
        },
      ];
    }

    if (user.role === "ADMIN") {
      return [
        {
          label: "Tableau de bord",
          path: "/dashboard",
          icon: <IconShieldCheck size={24} strokeWidth="1.8" />,
          isActive: pathname === "/dashboard",
        },
        {
          label: "Offres",
          path: "/publications",
          icon: <IconFileText size={24} strokeWidth="1.8" />,
          isActive: pathname === "/publications",
        },
        {
          label: "Messages",
          path: "/messages",
          icon: <IconMessage size={24} strokeWidth="1.8" />,
          isActive: pathname === "/messages",
        },
        {
          label: "Profil & Admin",
          path: "/profile",
          icon: <IconUser size={24} strokeWidth="1.8" />,
          isActive: pathname === "/profile",
        },
      ];
    }

    // Défaut : Rôle VOYAGEUR
    return [
      {
        label: "Explorer",
        path: "/professionals",
        icon: <IconCompass size={24} strokeWidth="1.8" />,
        isActive: pathname === "/professionals" || pathname === "/",
      },
      {
        label: "Offres",
        path: "/publications",
        icon: <IconFileText size={24} strokeWidth="1.8" />,
        isActive: pathname === "/publications",
      },
      {
        label: "Messages",
        path: "/messages",
        icon: <IconMessage size={24} strokeWidth="1.8" />,
        isActive: pathname === "/messages",
      },
      {
        label: "Profil",
        path: "/profile",
        icon: <IconUser size={24} strokeWidth="1.8" />,
        isActive: pathname === "/profile" || pathname === "/dashboard",
      },
    ];
  };

  const tabs = getTabs();

  return (
    <nav className="mobile-tab-bar" aria-label="Navigation principale mobile">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`mobile-tab-item ${tab.isActive ? "is-active" : ""}`}
          aria-current={tab.isActive ? "page" : undefined}
          aria-label={tab.label}
        >
          <span className="mobile-tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="mobile-tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};
