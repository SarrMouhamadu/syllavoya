import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { AppError } from "../../errors/AppError.js";

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const profile = await usersService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: { user: profile },
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

      const updatedProfile = await usersService.updateProfile(req.user.id, req.body);

      res.status(200).json({
        success: true,
        data: { user: updatedProfile },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
