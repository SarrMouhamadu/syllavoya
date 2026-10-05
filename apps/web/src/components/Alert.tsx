import React from "react";
import { IconAlertTriangle, IconCheck, IconX } from "./Icons";

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
          {type === "error" && <IconAlertTriangle size={18} />}
          {type === "success" && <IconCheck size={18} />}
          {type === "warning" && <IconAlertTriangle size={18} />}
          {type === "info" && <IconCheck size={18} />}
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
          <IconX size={16} />
        </button>
      )}
    </div>
  );
};
