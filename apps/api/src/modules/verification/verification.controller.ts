import { Request, Response, NextFunction } from "express";
import { verificationService } from "./verification.service.js";
import { AppError } from "../../errors/AppError.js";

export class VerificationController {
  async submitDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const doc = await verificationService.submitDocument(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyVerificationState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const state = await verificationService.getMyVerificationState(req.user.id);

      res.status(200).json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
