import { Request, Response, NextFunction } from "express";
import { conversationsService } from "./conversations.service.js";
import { AppError } from "../../errors/AppError.js";

export class ConversationsController {
  async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const { professionnel_id, premier_message } = req.body;
      const result = await conversationsService.createConversation(req.user.id, req.user.role, {
        professionnel_id,
        premier_message,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listUserConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const conversations = await conversationsService.listUserConversations(req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { conversations },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const conversation = await conversationsService.getConversationById(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const { contenu } = req.body;

      const message = await conversationsService.sendMessage(id, req.user.id, req.user.role, contenu);

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  async listConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"] as string;
      const messages = await conversationsService.listConversationMessages(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationsController = new ConversationsController();
