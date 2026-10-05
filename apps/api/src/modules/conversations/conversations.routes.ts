import { Router } from "express";
import { conversationsController } from "./conversations.controller.js";
import { documentsController } from "../documents/documents.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const conversationsRoutes = Router();

// Consulter ses conversations
conversationsRoutes.get("/", authenticate, (req, res, next) => {
  conversationsController.listUserConversations(req, res, next);
});

// Créer une conversation (le voyageur initie le premier contact)
conversationsRoutes.post("/", authenticate, (req, res, next) => {
  conversationsController.createConversation(req, res, next);
});

// Consulter une conversation autorisée
conversationsRoutes.get("/:id", authenticate, (req, res, next) => {
  conversationsController.getConversationById(req, res, next);
});

// Consulter les messages d'une conversation
conversationsRoutes.get("/:id/messages", authenticate, (req, res, next) => {
  conversationsController.listConversationMessages(req, res, next);
});

// Envoyer un message dans une conversation autorisée
conversationsRoutes.post("/:id/messages", authenticate, (req, res, next) => {
  conversationsController.sendMessage(req, res, next);
});

// Envoyer un document privé dans une conversation
conversationsRoutes.post("/:id/documents", authenticate, (req, res, next) => {
  documentsController.addDocument(req, res, next);
});

// Consulter les documents d'une conversation
conversationsRoutes.get("/:id/documents", authenticate, (req, res, next) => {
  documentsController.listConversationDocuments(req, res, next);
});

// Consulter un document spécifique d'une conversation
conversationsRoutes.get("/:id/documents/:documentId", authenticate, (req, res, next) => {
  documentsController.getDocumentById(req, res, next);
});

