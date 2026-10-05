import { Router } from "express";
import { professionalsController } from "./professionals.controller.js";
import { verificationController } from "../verification/verification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

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

// 5. Consulter la liste des professionnels vérifiés (public)
professionalsRoutes.get("/", (req, res, next) => {
  professionalsController.listVerified(req, res, next);
});

// 6. Consulter le détail d'un professionnel (vérifié ou propriétaire/admin)
professionalsRoutes.get("/:id", (req, res, next) => {
  professionalsController.getById(req, res, next);
});
