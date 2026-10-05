import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../errors/AppError.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = {
        ...req.body,
        file: req.file,
      };
      const result = await authService.register(payload);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerProfessional(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const result = await authService.registerProfessional(req.body, file);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = (
        req.ip ||
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1"
      ).toString();
      const result = await authService.login(req.body, clientIp);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const user = await authService.getUserById(req.user.id);
      if (!user) {
        throw new AppError("Utilisateur non trouvé", 404, "USER_NOT_FOUND");
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
