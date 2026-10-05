import React from "react";

export type AlertType = "error" | "success" | "warning" | "info";

interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = "error",
  message,
  onClose,
}) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-content">
        <span className="alert-icon">
          {type === "error" && "⚠️"}
          {type === "success" && "✅"}
          {type === "warning" && "⚡"}
          {type === "info" && "ℹ️"}
        </span>
        <span className="alert-message">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>
      )}
    </div>
  );
};
