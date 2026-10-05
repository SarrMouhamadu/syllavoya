import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const reportsRoutes = Router();

// Créer un signalement
reportsRoutes.post("/", authenticate, (req, res, next) => {
  reportsController.createReport(req, res, next);
});

// Consulter ses propres signalements
reportsRoutes.get("/me", authenticate, (req, res, next) => {
  reportsController.getMyReports(req, res, next);
});
