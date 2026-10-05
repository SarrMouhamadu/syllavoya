import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const subscriptionsRoutes = Router();

// Consulter les formules disponibles (avec calcul des frais opérateurs et montant total)
subscriptionsRoutes.get("/plans", (req, res, next) => {
  subscriptionsController.listPlans(req, res, next);
});

// Consulter son abonnement
subscriptionsRoutes.get("/me", authenticate, (req, res, next) => {
  subscriptionsController.getMySubscription(req, res, next);
});

// Créer une demande de souscription (initie l'abonnement EN_ATTENTE + le paiement)
subscriptionsRoutes.post("/", authenticate, (req, res, next) => {
  subscriptionsController.createSubscription(req, res, next);
});

// Renouveler un abonnement
subscriptionsRoutes.post("/:id/renew", authenticate, (req, res, next) => {
  subscriptionsController.renewSubscription(req, res, next);
});
