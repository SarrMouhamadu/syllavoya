import { Router } from "express";
import { documentsController } from "./documents.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const documentsRoutes = Router();

// Consulter un document privé (accès restreint strictement aux participants et à l'admin)
documentsRoutes.get("/:id", authenticate, (req, res, next) => {
  documentsController.getDocumentById(req, res, next);
});
