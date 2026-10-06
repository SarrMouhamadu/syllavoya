import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { uploadIdentityDocument } from "../../middleware/upload.js";

export const authRoutes = Router();

authRoutes.post("/register", uploadIdentityDocument("piece_identite"), (req, res, next) => {
  if (req.body.role === "PROFESSIONNEL" || req.file) {
    authController.registerProfessional(req, res, next);
  } else {
    authController.register(req, res, next);
  }
});

authRoutes.post("/register-pro", uploadIdentityDocument("piece_identite"), (req, res, next) => {
  authController.registerProfessional(req, res, next);
});

authRoutes.post("/login", (req, res, next) => {
  authController.login(req, res, next);
});

authRoutes.post("/forgot-password", (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

authRoutes.get("/me", authenticate, (req, res, next) => {
  authController.me(req, res, next);
});
