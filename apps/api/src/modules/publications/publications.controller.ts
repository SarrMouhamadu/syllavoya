import { Request, Response, NextFunction } from "express";
import { publicationsService } from "./publications.service.js";
import { AppError } from "../../errors/AppError.js";

export class PublicationsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const publication = await publicationsService.create(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: { publication },
      });
    } catch (error) {
      next(error);
    }
  }

  async listPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publications = await publicationsService.listPublic();

      res.status(200).json({
        success: true,
        data: { publications },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const publication = await publicationsService.getById(id, req.user?.id, req.user?.role);

      res.status(200).json({
        success: true,
        data: { publication },
      });
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const publications = await publicationsService.listMine(req.user.id);

      res.status(200).json({
        success: true,
        data: { publications },
      });
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const publication = await publicationsService.submit(id, req.user.id);

      res.status(200).json({
        success: true,
        data: { publication },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const publicationsController = new PublicationsController();
