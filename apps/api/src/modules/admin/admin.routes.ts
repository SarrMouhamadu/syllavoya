import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/authorize.js";

export const adminRoutes = Router();

// Toutes les routes d'administration nécessitent une authentification et le rôle ADMIN
adminRoutes.use(authenticate, requireRole("ADMIN"));

// Consulter les demandes de vérification
adminRoutes.get("/verifications", (req, res, next) => {
  adminController.listVerifications(req, res, next);
});

// Traiter une vérification (accepter, refuser, suspendre, révoquer)
adminRoutes.patch("/verifications/:id", (req, res, next) => {
  adminController.treatVerification(req, res, next);
});

// Consulter les publications soumises
adminRoutes.get("/publications", (req, res, next) => {
  adminController.listPublications(req, res, next);
});

// Traiter une publication (approuver, refuser)
adminRoutes.patch("/publications/:id", (req, res, next) => {
  adminController.treatPublication(req, res, next);
});

// Supprimer définitivement une publication par ADMIN
adminRoutes.delete("/publications/:id", (req, res, next) => {
  adminController.deletePublication(req, res, next);
});

// Consulter les signalements
adminRoutes.get("/reports", (req, res, next) => {
  adminController.listReports(req, res, next);
});

// Traiter un signalement (TRAITE, REJETE, RESOLU, CLASSE)
adminRoutes.patch("/reports/:id", (req, res, next) => {
  adminController.treatReport(req, res, next);
});

// Consulter le journal d'audit (traçabilité des actions administratives)
adminRoutes.get("/audit-logs", (req, res, next) => {
  adminController.listAuditLogs(req, res, next);
});

// Créer directement un compte agence professionnelle avec ses identifiants
adminRoutes.post("/professionals", (req, res, next) => {
  adminController.createProfessionalAccount(req, res, next);
});

// Consulter les statistiques financières et globales (CA total, agences, voyageurs)
adminRoutes.get("/stats", (req, res, next) => {
  adminController.getFinancialStats(req, res, next);
});



