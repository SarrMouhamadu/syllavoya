import { Router, Request, Response, NextFunction } from "express";
import { conversationsService } from "../conversations/conversations.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { AppError } from "../../errors/AppError.js";

export const messagesRoutes = Router();

// Envoyer un message direct avec conversation_id dans le corps
messagesRoutes.post("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
    }

    const { conversation_id, contenu } = req.body;
    if (!conversation_id) {
      throw new AppError("L'identifiant de la conversation (conversation_id) est obligatoire", 400, "VALIDATION_ERROR");
    }

    const message = await conversationsService.sendMessage(conversation_id, req.user.id, req.user.role, contenu);

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
});
