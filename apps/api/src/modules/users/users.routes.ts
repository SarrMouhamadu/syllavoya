import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const usersRoutes = Router();

// Toutes les routes /api/users/me nécessitent une authentification
usersRoutes.get("/me", authenticate, (req, res, next) => {
  usersController.getMe(req, res, next);
});

usersRoutes.patch("/me", authenticate, (req, res, next) => {
  usersController.updateMe(req, res, next);
});
