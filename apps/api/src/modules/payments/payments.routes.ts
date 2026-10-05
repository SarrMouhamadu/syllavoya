import { Router } from "express";
import { paymentsController } from "./payments.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/authorize.js";

export const paymentsRoutes = Router();

// Initialiser un paiement pour un abonnement (Wave / Orange Money via NabooPay)
paymentsRoutes.post("/", authenticate, (req, res, next) => {
  paymentsController.createPayment(req, res, next);
});

// Consulter l'état d'un paiement appartenant à l'utilisateur
paymentsRoutes.get("/:id", authenticate, (req, res, next) => {
  paymentsController.getPaymentById(req, res, next);
});

// Expiration des paiements en attente depuis plus de 48 heures (réservé ADMIN)
paymentsRoutes.post("/expire-pending", authenticate, requireRole("ADMIN"), (req, res, next) => {
  paymentsController.expirePendingPayments(req, res, next);
});

// Réception du webhook NabooPay (Wave / Orange Money, traité côté serveur)
paymentsRoutes.post("/naboopay/webhook", (req, res, next) => {
  paymentsController.handleNabooWebhook(req, res, next);
});

