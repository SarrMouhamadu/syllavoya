import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const authRoutes = Router();

authRoutes.post("/register", (req, res, next) => {
  authController.register(req, res, next);
});

authRoutes.post("/login", (req, res, next) => {
  authController.login(req, res, next);
});

authRoutes.get("/me", authenticate, (req, res, next) => {
  authController.me(req, res, next);
});
