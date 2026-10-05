import { Request, Response, NextFunction } from "express";
import { documentsService } from "./documents.service.js";
import { AppError } from "../../errors/AppError.js";

export class DocumentsController {
  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const conversationId = req.params["id"] as string;
      const { fichier } = req.body;

      const result = await documentsService.addDocument(conversationId, req.user.id, req.user.role, {
        fichier,
      });

      res.status(201).json({
        success: true,
        data: { document: result },
      });
    } catch (error) {
      next(error);
    }
  }

  async listConversationDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const conversationId = req.params["id"] as string;
      const documents = await documentsService.listConversationDocuments(conversationId, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Non authentifié", 401, "UNAUTHORIZED");
      }

      const documentId = (req.params["documentId"] || req.params["id"]) as string;
      const document = await documentsService.getDocumentById(documentId, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
