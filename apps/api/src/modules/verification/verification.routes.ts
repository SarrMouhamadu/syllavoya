import { Router } from "express";
import { verificationController } from "./verification.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const verificationRoutes = Router();

// Endpoints dédiés à la vérification
verificationRoutes.post("/documents", authenticate, (req, res, next) => {
  verificationController.submitDocument(req, res, next);
});

// Téléchargement sécurisé d'un document (propriétaire ou admin uniquement)
verificationRoutes.get("/documents/:id/file", authenticate, (req, res, next) => {
  verificationController.getDocumentFile(req, res, next);
});

verificationRoutes.get("/me", authenticate, (req, res, next) => {
  verificationController.getMyVerificationState(req, res, next);
});
