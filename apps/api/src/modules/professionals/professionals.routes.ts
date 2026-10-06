import { Router } from "express";
import { professionalsController } from "./professionals.controller.js";
import { verificationController } from "../verification/verification.controller.js";
import { authenticate, requireActiveSubscription } from "../../middleware/authenticate.js";
import { db } from "../../db.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";
import { AppError } from "../../errors/AppError.js";

export const professionalsRoutes = Router();

// 1. Soumettre une demande pour devenir professionnel
professionalsRoutes.post("/apply", authenticate, (req, res, next) => {
  professionalsController.apply(req, res, next);
});

// 2. Consulter son profil professionnel
professionalsRoutes.get("/me", authenticate, (req, res, next) => {
  professionalsController.getMe(req, res, next);
});

// 3. Modifier les informations autorisées de son profil professionnel
professionalsRoutes.patch("/me", authenticate, (req, res, next) => {
  professionalsController.updateMe(req, res, next);
});

// 4. Documents de vérification et statut de vérification (accès privé au professionnel)
professionalsRoutes.post("/me/documents", authenticate, (req, res, next) => {
  verificationController.submitDocument(req, res, next);
});

professionalsRoutes.get("/me/verification", authenticate, (req, res, next) => {
  verificationController.getMyVerificationState(req, res, next);
});

// 5. Consulter la liste des professionnels vérifiés (abonnés ou admin uniquement)
professionalsRoutes.get("/", authenticate, requireActiveSubscription, (req, res, next) => {
  professionalsController.listVerified(req, res, next);
});

// 6. Consulter le détail d'un professionnel (vérifié ou propriétaire/admin avec abonnement actif)
professionalsRoutes.get("/:id", authenticate, async (req, res, next) => {
  try {
    if (req.user?.role === "ADMIN") {
      return professionalsController.getById(req, res, next);
    }
    const id = req.params["id"] as string;
    const pro = await db.orm.public.Professionnel.where({ id }).first();
    if (pro && pro.utilisateur_id === req.user?.id) {
      return professionalsController.getById(req, res, next);
    }
    const hasActiveSub = await subscriptionsService.hasActiveSubscription(req.user!.id);
    if (!hasActiveSub) {
      throw new AppError(
        "Un abonnement actif est requis pour consulter les coordonnées et fiches des professionnels.",
        403,
        "SUBSCRIPTION_REQUIRED"
      );
    }
    return professionalsController.getById(req, res, next);
  } catch (err) {
    next(err);
  }
});

