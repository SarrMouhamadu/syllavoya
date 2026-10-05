import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service.js";
import { AppError } from "../../errors/AppError.js";

export class ReportsController {
  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const { type_cible, cible_id, motif, description } = req.body;
      const report = await reportsService.createReport(req.user.id, {
        type_cible,
        cible_id,
        motif,
        description,
      });

      res.status(201).json({
        success: true,
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const reports = await reportsService.getMyReports(req.user.id);

      res.status(200).json({
        success: true,
        data: { reports },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
