import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service.js";

export class AdminController {
  async listVerifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifications = await adminService.listVerifications();

      res.status(200).json({
        success: true,
        data: { verifications },
      });
    } catch (error) {
      next(error);
    }
  }

  async treatVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const result = await adminService.treatVerification(id, req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPublications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publications = await adminService.listPublications();

      res.status(200).json({
        success: true,
        data: { publications },
      });
    } catch (error) {
      next(error);
    }
  }

  async treatPublication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.id || "ADMIN";
      const id = req.params["id"] as string;
      const result = await adminService.treatPublication(id, req.body, adminUserId);

      res.status(200).json({
        success: true,
        data: { publication: result },
      });
    } catch (error) {
      next(error);
    }
  }

  async listReports(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await adminService.listReports();

      res.status(200).json({
        success: true,
        data: { reports },
      });
    } catch (error) {
      next(error);
    }
  }

  async treatReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params["id"] as string;
      const result = await adminService.treatReport(adminUserId, id, req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAuditLogs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await adminService.listAuditLogs();

      res.status(200).json({
        success: true,
        data: { audit_logs: logs },
      });
    } catch (error) {
      next(error);
    }
  }

  async createProfessionalAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.id || "ADMIN";
      const result = await adminService.createProfessionalAccount(req.body, adminUserId);

      res.status(201).json({
        success: true,
        message: "Compte agence professionnelle créé avec succès.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFinancialStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getFinancialStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();


