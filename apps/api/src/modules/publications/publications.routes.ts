import { Router } from "express";
import { publicationsController } from "./publications.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const publicationsRoutes = Router();

// Créer une publication (seuls les professionnels vérifiés)
publicationsRoutes.post("/", authenticate, (req, res, next) => {
  publicationsController.create(req, res, next);
});

// Consulter les publications publiques (approuvées)
publicationsRoutes.get("/", (req, res, next) => {
  publicationsController.listPublic(req, res, next);
});

// Consulter ses propres publications
publicationsRoutes.get("/me", authenticate, (req, res, next) => {
  publicationsController.listMine(req, res, next);
});

// Consulter une publication par ID
publicationsRoutes.get("/:id", (req, res, next) => {
  publicationsController.getById(req, res, next);
});

// Soumettre une publication à validation
publicationsRoutes.post("/:id/submit", authenticate, (req, res, next) => {
  publicationsController.submit(req, res, next);
});

// Modifier une publication (auteur ou admin uniquement)
publicationsRoutes.patch("/:id", authenticate, (req, res, next) => {
  publicationsController.update(req, res, next);
});

publicationsRoutes.put("/:id", authenticate, (req, res, next) => {
  publicationsController.update(req, res, next);
});

// Supprimer une publication (auteur ou admin uniquement)
publicationsRoutes.delete("/:id", authenticate, (req, res, next) => {
  publicationsController.delete(req, res, next);
});
