import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";

export interface AddDocumentParams {
  fichier: string;
}

export class DocumentsService {
  /**
   * Ajouter un document à une conversation.
   * Règle essentielle : Seuls les participants de la conversation peuvent ajouter un document.
   * Traçabilité : Enregistrement de l'expéditeur, de la conversation et de l'horodatage serveur.
   */
  async addDocument(conversationId: string, userId: string, userRole: string, params: AddDocumentParams): Promise<any> {
    if (!params.fichier || typeof params.fichier !== "string" || !params.fichier.trim()) {
      throw new AppError("Le document (fichier) est obligatoire.", 400, "VALIDATION_ERROR");
    }

    const rawFichier = params.fichier.trim();
    const lowerFichier = rawFichier.toLowerCase();

    // Refus strict des vidéos : seules les photos et documents PDF sont autorisés
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"];
    const isVideo = lowerFichier.startsWith("data:video/") ||
      videoExtensions.some((ext) => lowerFichier.endsWith(ext) || lowerFichier.includes(ext + "?"));

    if (isVideo) {
      throw new AppError(
        "Les fichiers vidéo sont formellement refusés. Seules les photos (JPG, PNG, WEBP) et documents PDF sont autorisés.",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    const conversation = await db.orm.public.Conversation
      .where({ id: conversationId })
      .first();

    if (!conversation) {
      throw new AppError("Conversation introuvable.", 404, "CONVERSATION_NOT_FOUND");
    }

    const professionnel = await db.orm.public.Professionnel
      .where({ id: conversation.professionnel_id })
      .first();

    const isVoyageur = conversation.voyageur_id === userId;
    const isPro = professionnel?.utilisateur_id === userId;

    if (!isVoyageur && !isPro && userRole !== "ADMIN") {
      throw new AppError("Accès refusé : vous n'êtes pas participant à cette conversation.", 403, "FORBIDDEN");
    }

    if (isVoyageur && userRole === "VOYAGEUR") {
      const hasSubscription = await subscriptionsService.hasActiveSubscription(userId);
      if (!hasSubscription) {
        throw new AppError(
          "Un abonnement voyageur actif est requis pour échanger des documents.",
          403,
          "SUBSCRIPTION_REQUIRED"
        );
      }
    }

    const now = Temporal.Now.instant();

    const document = await db.orm.public.DocumentEchange.create({
      id: randomUUID(),
      conversation_id: conversation.id,
      expediteur_id: userId,
      fichier: params.fichier.trim(),
      date_envoi: now,
    });

    return {
      id: document.id,
      conversation_id: document.conversation_id,
      expediteur_id: document.expediteur_id,
      fichier: document.fichier,
      date_envoi: document.date_envoi.toString(),
    };
  }

  /**
   * Lister les documents d'une conversation.
   * Règle de sécurité : Seuls les participants autorisés et l'administrateur peuvent lister les documents.
   */
  async listConversationDocuments(conversationId: string, userId: string, userRole: string): Promise<any[]> {
    const conversation = await db.orm.public.Conversation
      .where({ id: conversationId })
      .first();

    if (!conversation) {
      throw new AppError("Conversation introuvable.", 404, "CONVERSATION_NOT_FOUND");
    }

    const professionnel = await db.orm.public.Professionnel
      .where({ id: conversation.professionnel_id })
      .first();

    const isVoyageur = conversation.voyageur_id === userId;
    const isPro = professionnel?.utilisateur_id === userId;

    if (!isVoyageur && !isPro && userRole !== "ADMIN") {
      throw new AppError("Accès refusé : vous n'avez pas accès aux documents de cette conversation.", 403, "FORBIDDEN");
    }

    const documents = await db.orm.public.DocumentEchange
      .where({ conversation_id: conversation.id })
      .all();

    // Tri chronologique
    documents.sort((a, b) => {
      const timeA = Temporal.Instant.from(a.date_envoi.toString()).epochMilliseconds;
      const timeB = Temporal.Instant.from(b.date_envoi.toString()).epochMilliseconds;
      return timeA - timeB;
    });

    const enriched = await Promise.all(
      documents.map(async (doc) => {
        const expediteur = await db.orm.public.Utilisateur
          .where({ id: doc.expediteur_id })
          .first();

        return {
          id: doc.id,
          conversation_id: doc.conversation_id,
          expediteur_id: doc.expediteur_id,
          fichier: doc.fichier,
          date_envoi: doc.date_envoi.toString(),
          expediteur: expediteur ? {
            id: expediteur.id,
            nom: expediteur.nom,
            prenom: expediteur.prenom,
            role: expediteur.role,
          } : null,
          est_mon_document: doc.expediteur_id === userId,
        };
      })
    );

    return enriched;
  }

  /**
   * Consulter un document privé par son identifiant.
   * Règle stricte : L'accès direct non authentifié ou par un non-participant est formellement interdit.
   */
  async getDocumentById(documentId: string, userId: string, userRole: string): Promise<any> {
    const document = await db.orm.public.DocumentEchange
      .where({ id: documentId })
      .first();

    if (!document) {
      throw new AppError("Document introuvable.", 404, "DOCUMENT_NOT_FOUND");
    }

    const conversation = await db.orm.public.Conversation
      .where({ id: document.conversation_id })
      .first();

    if (!conversation) {
      throw new AppError("Conversation liée au document introuvable.", 404, "CONVERSATION_NOT_FOUND");
    }

    const professionnel = await db.orm.public.Professionnel
      .where({ id: conversation.professionnel_id })
      .first();

    const isVoyageur = conversation.voyageur_id === userId;
    const isPro = professionnel?.utilisateur_id === userId;

    if (!isVoyageur && !isPro && userRole !== "ADMIN") {
      throw new AppError("Accès refusé : vous n'avez pas l'autorisation d'accéder à ce document.", 403, "FORBIDDEN");
    }

    const expediteur = await db.orm.public.Utilisateur
      .where({ id: document.expediteur_id })
      .first();

    return {
      id: document.id,
      conversation_id: document.conversation_id,
      expediteur_id: document.expediteur_id,
      fichier: document.fichier,
      date_envoi: document.date_envoi.toString(),
      expediteur: expediteur ? {
        id: expediteur.id,
        nom: expediteur.nom,
        prenom: expediteur.prenom,
        role: expediteur.role,
      } : null,
      est_mon_document: document.expediteur_id === userId,
    };
  }
}

export const documentsService = new DocumentsService();
