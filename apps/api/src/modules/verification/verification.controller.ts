import { Request, Response, NextFunction } from "express";
import { verificationService } from "./verification.service.js";
import { AppError } from "../../errors/AppError.js";

export class VerificationController {
  async submitDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const doc = await verificationService.submitDocument(req.user.id, req.body, req.file);

      res.status(201).json({
        success: true,
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      if (!id) {
        throw new AppError("Identifiant du document requis", 400, "VALIDATION_ERROR");
      }

      await verificationService.serveDocumentFile(id, req.user.id, req.user.role, res);
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
