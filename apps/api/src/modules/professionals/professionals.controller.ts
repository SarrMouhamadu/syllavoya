import { Request, Response, NextFunction } from "express";
import { professionalsService } from "./professionals.service.js";
import { AppError } from "../../errors/AppError.js";

export class ProfessionalsController {
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const result = await professionalsService.apply(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const pro = await professionalsService.getMe(req.user.id);

      res.status(200).json({
        success: true,
        data: { professional: pro },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const updated = await professionalsService.updateMe(req.user.id, req.body);

      res.status(200).json({
        success: true,
        data: { professional: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async listVerified(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pros = await professionalsService.listVerified();

      res.status(200).json({
        success: true,
        data: { professionals: pros },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const pro = await professionalsService.getById(id, req.user?.id, req.user?.role);

      res.status(200).json({
        success: true,
        data: { professional: pro },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const professionalsController = new ProfessionalsController();
