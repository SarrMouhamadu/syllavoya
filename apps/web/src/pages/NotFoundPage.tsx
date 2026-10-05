import React from "react";
import { EmptyState } from "../components/EmptyState";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container" style={{ padding: "80px 16px" }}>
      <EmptyState
        icon="🧭"
        title="Page introuvable (404)"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        actionText="Retourner à l'accueil"
        onAction={() => {
          window.location.href = "/";
        }}
      />
    </div>
  );
};
