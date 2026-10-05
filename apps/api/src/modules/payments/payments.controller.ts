import { Request, Response, NextFunction } from "express";
import { paymentsService, PaymentProvider } from "./payments.service.js";
import { AppError } from "../../errors/AppError.js";

export class PaymentsController {
  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const payment = await paymentsService.getPaymentById(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const { abonnement_id, provider, moyen_paiement } = req.body;
      if (!abonnement_id) {
        throw new AppError("L'identifiant de l'abonnement (abonnement_id) est obligatoire", 400, "VALIDATION_ERROR");
      }

      const selectedProvider: PaymentProvider =
        provider === "BICTORYS" || moyen_paiement === "CARD" || moyen_paiement === "CARTE_BANCAIRE"
          ? "BICTORYS"
          : "NABOOPAY";

      const result = await paymentsService.initiatePaymentForSubscription(
        req.user.id,
        abonnement_id,
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

  async handleNabooWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers["x-signature"] as string | undefined;
      const rawBody = (req as any).rawBody as Buffer | undefined;

      const result = await paymentsService.handleNabooWebhook(req.body, signature, rawBody);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async handleBictorysWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature =
        (req.headers["x-secret-key"] as string | undefined) ||
        (req.headers["x-bictorys-signature"] as string | undefined) ||
        (req.headers["x-signature"] as string | undefined) ||
        (req.headers["authorization"] as string | undefined);
      const rawBody = (req as any).rawBody as Buffer | undefined;

      const result = await paymentsService.handleBictorysWebhook(req.body, signature, rawBody);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
