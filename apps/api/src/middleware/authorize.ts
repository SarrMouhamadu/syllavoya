import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

/**
 * Middleware de vérification du rôle de l'utilisateur.
 * Vérifie que l'utilisateur est authentifié et que son rôle correspond aux rôles autorisés.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Non authentifié", 401, "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "Accès refusé : votre rôle ne dispose pas des permissions nécessaires",
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
}
