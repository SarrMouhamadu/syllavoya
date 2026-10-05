import { Request, Response, NextFunction } from "express";
import { subscriptionsService } from "./subscriptions.service.js";
import { PaymentProvider } from "../payments/payments.service.js";
import { AppError } from "../../errors/AppError.js";

export class SubscriptionsController {
  async listPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await subscriptionsService.listPlans();

      res.status(200).json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMySubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const subscription = await subscriptionsService.getMySubscription(req.user.id);

      res.status(200).json({
        success: true,
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const { formule_id } = req.body;
      const selectedProvider: PaymentProvider = "NABOOPAY";

      const result = await subscriptionsService.createSubscription(
        req.user.id,
        formule_id,
        selectedProvider
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async renewSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const selectedProvider: PaymentProvider = "NABOOPAY";

      const result = await subscriptionsService.renewSubscription(
        req.user.id,
        id,
        selectedProvider
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
