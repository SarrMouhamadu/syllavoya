import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { authService } from "../modules/auth/auth.service.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  statut: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Token d'authentification manquant ou format invalide",
        401,
        "UNAUTHORIZED"
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new AppError(
        "Token d'authentification manquant",
        401,
        "UNAUTHORIZED"
      );
    }

    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 401, "UNAUTHORIZED");
    }

    if (user.statut === "SUSPENDU") {
      throw new AppError("Compte utilisateur suspendu", 403, "ACCOUNT_SUSPENDED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      statut: user.statut,
    };

    next();
  } catch (error) {
    next(error);
  }
}
