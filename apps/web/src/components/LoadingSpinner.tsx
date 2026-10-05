import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Chargement en cours...",
  size = "medium",
}) => {
  return (
    <div className={`spinner-wrapper spinner-${size}`} role="status" aria-live="polite">
      <div className="spinner-circle"></div>
      {message && <p className="spinner-text">{message}</p>}
    </div>
  );
};
