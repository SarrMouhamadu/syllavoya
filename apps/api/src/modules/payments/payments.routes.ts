import { Router } from "express";
import { paymentsController } from "./payments.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const paymentsRoutes = Router();

// Initialiser un paiement pour un abonnement (supporte Wave/OM via NabooPay et Carte via Bictorys)
paymentsRoutes.post("/", authenticate, (req, res, next) => {
  paymentsController.createPayment(req, res, next);
});

// Consulter l'état d'un paiement appartenant à l'utilisateur
paymentsRoutes.get("/:id", authenticate, (req, res, next) => {
  paymentsController.getPaymentById(req, res, next);
});

// Réception du webhook NabooPay (Wave / Orange Money, traité côté serveur)
paymentsRoutes.post("/naboopay/webhook", (req, res, next) => {
  paymentsController.handleNabooWebhook(req, res, next);
});

// Réception du webhook Bictorys (Visa / Mastercard, traité côté serveur)
paymentsRoutes.post("/bictorys/webhook", (req, res, next) => {
  paymentsController.handleBictorysWebhook(req, res, next);
});
