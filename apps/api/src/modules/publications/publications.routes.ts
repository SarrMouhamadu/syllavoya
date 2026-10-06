import { Router } from "express";
import { publicationsController } from "./publications.controller.js";
import { authenticate, requireActiveSubscription } from "../../middleware/authenticate.js";

export const publicationsRoutes = Router();

// Créer une publication (seuls les professionnels vérifiés et abonnés)
publicationsRoutes.post("/", authenticate, (req, res, next) => {
  publicationsController.create(req, res, next);
});

// Consulter les publications (accès réservé aux utilisateurs connectés avec abonnement actif ou admin)
publicationsRoutes.get("/", authenticate, requireActiveSubscription, (req, res, next) => {
  publicationsController.listPublic(req, res, next);
});

// Consulter ses propres publications
publicationsRoutes.get("/me", authenticate, (req, res, next) => {
  publicationsController.listMine(req, res, next);
});

// Consulter les interactions (likes, commentaires) d'une publication
publicationsRoutes.get("/:id/interactions", authenticate, requireActiveSubscription, (req, res, next) => {
  publicationsController.getInteractions(req, res, next);
});

// Aimer / Retirer son like sur une publication (voyageurs, agences, admin avec abonnement actif)
publicationsRoutes.post("/:id/like", authenticate, requireActiveSubscription, (req, res, next) => {
  publicationsController.toggleLike(req, res, next);
});

// Ajouter un commentaire sur une publication
publicationsRoutes.post("/:id/comments", authenticate, requireActiveSubscription, (req, res, next) => {
  publicationsController.addComment(req, res, next);
});

// Consulter une publication par ID (accès réservé aux utilisateurs abonnés ou auteur/admin)
publicationsRoutes.get("/:id", authenticate, requireActiveSubscription, (req, res, next) => {
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
