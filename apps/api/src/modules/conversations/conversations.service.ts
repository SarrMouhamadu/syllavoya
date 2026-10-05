import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";

export interface CreateConversationParams {
  professionnel_id: string;
  premier_message?: string;
}

export interface SendMessageParams {
  contenu: string;
}

export class ConversationsService {
  /**
   * Créer une conversation depuis un voyageur vers un professionnel vérifié.
   * Règle stricte : Un professionnel ne peut jamais démarrer la première conversation.
   * Règle stricte : Le professionnel doit être accepté/vérifié.
   */
  async createConversation(userId: string, userRole: string, params: CreateConversationParams): Promise<any> {
    // 1. Contrôle d'acteur : Seul un voyageur (ou admin) peut initier la conversation
    if (userRole === "PROFESSIONNEL") {
      throw new AppError(
        "Un professionnel ne peut pas initier une conversation avec un voyageur. Le voyageur doit envoyer le premier message.",
        403,
        "FORBIDDEN"
      );
    }

    // Règle 2 : Un voyageur sans abonnement actif ou expiré ne peut pas contacter un professionnel
    if (userRole === "VOYAGEUR") {
      const hasSubscription = await subscriptionsService.hasActiveSubscription(userId);
      if (!hasSubscription) {
        throw new AppError(
          "Un abonnement voyageur actif est requis pour contacter un professionnel.",
          403,
          "SUBSCRIPTION_REQUIRED"
        );
      }
    }

    if (!params.professionnel_id || typeof params.professionnel_id !== "string") {
      throw new AppError("L'identifiant du professionnel (professionnel_id) est obligatoire", 400, "VALIDATION_ERROR");
    }

    // 2. Vérification de l'existence et du statut du professionnel
    const professionnel = await db.orm.public.Professionnel
      .where({ id: params.professionnel_id })
      .first();

    if (!professionnel) {
      throw new AppError("Professionnel introuvable", 404, "PROFESSIONAL_NOT_FOUND");
    }

    // Règle essentielle : Seuls les professionnels vérifiés peuvent être contactés
    const isVerified = professionnel.statut_verification === "VERIFIE" || professionnel.statut_verification === "ACCEPTEE";
    if (!isVerified) {
      throw new AppError(
        "Impossible d'initier une conversation avec un professionnel qui n'est pas vérifié par Sylla Voyage.",
        403,
        "UNVERIFIED_PROFESSIONAL"
      );
    }

    // Empêcher l'auto-contact
    if (professionnel.utilisateur_id === userId) {
      throw new AppError("Vous ne pouvez pas initier une conversation avec vous-même.", 400, "CANNOT_MESSAGE_SELF");
    }

    const now = Temporal.Now.instant();

    // 3. Vérifier si une conversation existe déjà entre ce voyageur et ce professionnel
    const existing = await db.orm.public.Conversation
      .where({
        voyageur_id: userId,
        professionnel_id: professionnel.id,
      })
      .first();

    let conversation = existing;

    if (!conversation) {
      // Création de la conversation
      conversation = await db.orm.public.Conversation.create({
        id: randomUUID(),
        voyageur_id: userId,
        professionnel_id: professionnel.id,
        date_creation: now,
        statut: "ACTIF",
      });
    }

    let firstMessageCreated = null;

    // 4. Si un premier message est fourni par le voyageur, l'enregistrer en base
    if (params.premier_message && typeof params.premier_message === "string" && params.premier_message.trim()) {
      firstMessageCreated = await db.orm.public.Message.create({
        id: randomUUID(),
        conversation_id: conversation.id,
        expediteur_id: userId,
        contenu: params.premier_message.trim(),
        date_envoi: now,
        statut: "ENVOYE",
      });
    }

    const proUser = await db.orm.public.Utilisateur
      .where({ id: professionnel.utilisateur_id })
      .first();

    return {
      conversation: {
        id: conversation.id,
        voyageur_id: conversation.voyageur_id,
        professionnel_id: conversation.professionnel_id,
        date_creation: conversation.date_creation.toString(),
        statut: conversation.statut,
        professionnel: {
          id: professionnel.id,
          nom_structure: professionnel.nom_structure,
          email: proUser?.email,
          nom: proUser?.nom,
          prenom: proUser?.prenom,
        },
        premier_message: firstMessageCreated ? {
          id: firstMessageCreated.id,
          contenu: firstMessageCreated.contenu,
          date_envoi: firstMessageCreated.date_envoi.toString(),
          statut: firstMessageCreated.statut,
        } : null,
      },
    };
  }

  /**
   * Consulter ses conversations autorisées.
   */
  async listUserConversations(userId: string, userRole: string): Promise<any[]> {
    let conversations: any[] = [];

    if (userRole === "VOYAGEUR") {
      conversations = await db.orm.public.Conversation
        .where({ voyageur_id: userId })
        .all();
    } else if (userRole === "PROFESSIONNEL") {
      const professionnel = await db.orm.public.Professionnel
        .where({ utilisateur_id: userId })
        .first();

      if (!professionnel) {
        return [];
      }

      conversations = await db.orm.public.Conversation
        .where({ professionnel_id: professionnel.id })
        .all();
    } else if (userRole === "ADMIN") {
      conversations = await db.orm.public.Conversation.all();
    } else {
      conversations = await db.orm.public.Conversation
        .where({ voyageur_id: userId })
        .all();
    }

    const enriched = await Promise.all(
      conversations.map(async (c) => {
        const voyageur = await db.orm.public.Utilisateur
          .where({ id: c.voyageur_id })
          .first();

        const professionnel = await db.orm.public.Professionnel
          .where({ id: c.professionnel_id })
          .first();

        const proUser = professionnel ? await db.orm.public.Utilisateur
          .where({ id: professionnel.utilisateur_id })
          .first() : null;

        const allMessages = await db.orm.public.Message
          .where({ conversation_id: c.id })
          .all();

        const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;

        return {
          id: c.id,
          date_creation: c.date_creation.toString(),
          statut: c.statut,
          voyageur: voyageur ? {
            id: voyageur.id,
            nom: voyageur.nom,
            prenom: voyageur.prenom,
            email: voyageur.email,
          } : null,
          professionnel: professionnel ? {
            id: professionnel.id,
            nom_structure: professionnel.nom_structure,
            nom: proUser?.nom,
            prenom: proUser?.prenom,
          } : null,
          nombre_messages: allMessages.length,
          dernier_message: lastMessage ? {
            id: lastMessage.id,
            expediteur_id: lastMessage.expediteur_id,
            contenu: lastMessage.contenu,
            date_envoi: lastMessage.date_envoi.toString(),
            statut: lastMessage.statut,
          } : null,
        };
      })
    );

    return enriched;
  }

  /**
   * Consulter une conversation autorisée par son identifiant.
   * Seuls les participants (voyageur ou professionnel concerné) et l'administrateur ont accès.
   */
  async getConversationById(conversationId: string, userId: string, userRole: string): Promise<any> {
    const conversation = await db.orm.public.Conversation
      .where({ id: conversationId })
      .first();

    if (!conversation) {
      throw new AppError("Conversation introuvable", 404, "CONVERSATION_NOT_FOUND");
    }

    const professionnel = await db.orm.public.Professionnel
      .where({ id: conversation.professionnel_id })
      .first();

    const isVoyageur = conversation.voyageur_id === userId;
    const isPro = professionnel?.utilisateur_id === userId;

    if (!isVoyageur && !isPro && userRole !== "ADMIN") {
      throw new AppError("Accès refusé : vous n'êtes pas participant à cette conversation.", 403, "FORBIDDEN");
    }

    const voyageur = await db.orm.public.Utilisateur
      .where({ id: conversation.voyageur_id })
      .first();

    const proUser = professionnel ? await db.orm.public.Utilisateur
      .where({ id: professionnel.utilisateur_id })
      .first() : null;

    return {
      id: conversation.id,
      date_creation: conversation.date_creation.toString(),
      statut: conversation.statut,
      voyageur: voyageur ? {
        id: voyageur.id,
        nom: voyageur.nom,
        prenom: voyageur.prenom,
      } : null,
      professionnel: professionnel ? {
        id: professionnel.id,
        nom_structure: professionnel.nom_structure,
        nom: proUser?.nom,
        prenom: proUser?.prenom,
      } : null,
    };
  }

  /**
   * Envoyer un message dans une conversation autorisée.
   * Règle stricte :
   * - Seuls les participants peuvent envoyer un message.
   * - Le professionnel ne peut répondre que si le voyageur a déjà envoyé au moins un message.
   */
  async sendMessage(conversationId: string, userId: string, userRole: string, contenu: string): Promise<any> {
    if (!contenu || typeof contenu !== "string" || !contenu.trim()) {
      throw new AppError("Le contenu du message ne peut pas être vide.", 400, "VALIDATION_ERROR");
    }

    const conversation = await db.orm.public.Conversation
      .where({ id: conversationId })
      .first();

    if (!conversation) {
      throw new AppError("Conversation introuvable", 404, "CONVERSATION_NOT_FOUND");
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
          "Votre abonnement est expiré. Un abonnement voyageur actif est requis pour envoyer des messages.",
          403,
          "SUBSCRIPTION_REQUIRED"
        );
      }
    }

    // Règle 5 de docs/01-business-rules.md :
    // "Après le premier message du voyageur, les deux parties peuvent communiquer."
    // Si c'est le professionnel qui tente d'écrire, vérifier qu'un premier message du voyageur existe.
    if (isPro) {
      const messagesFromVoyageur = await db.orm.public.Message
        .where({
          conversation_id: conversation.id,
          expediteur_id: conversation.voyageur_id,
        })
        .all();

      if (messagesFromVoyageur.length === 0) {
        throw new AppError(
          "Le voyageur doit envoyer le premier message avant que le professionnel ne puisse répondre.",
          403,
          "FORBIDDEN"
        );
      }
    }

    const now = Temporal.Now.instant();

    const message = await db.orm.public.Message.create({
      id: randomUUID(),
      conversation_id: conversation.id,
      expediteur_id: userId,
      contenu: contenu.trim(),
      date_envoi: now,
      statut: "ENVOYE",
    });

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      expediteur_id: message.expediteur_id,
      contenu: message.contenu,
      date_envoi: message.date_envoi.toString(),
      statut: message.statut,
    };
  }

  /**
   * Consulter les messages d'une conversation.
   * L'historique complet est renvoyé par ordre chronologique pour assurer la traçabilité.
   */
  async listConversationMessages(conversationId: string, userId: string, userRole: string): Promise<any[]> {
    const conversation = await db.orm.public.Conversation
      .where({ id: conversationId })
      .first();

    if (!conversation) {
      throw new AppError("Conversation introuvable", 404, "CONVERSATION_NOT_FOUND");
    }

    const professionnel = await db.orm.public.Professionnel
      .where({ id: conversation.professionnel_id })
      .first();

    const isVoyageur = conversation.voyageur_id === userId;
    const isPro = professionnel?.utilisateur_id === userId;

    if (!isVoyageur && !isPro && userRole !== "ADMIN") {
      throw new AppError("Accès refusé : vous n'avez pas accès aux messages de cette conversation.", 403, "FORBIDDEN");
    }

    const messages = await db.orm.public.Message
      .where({ conversation_id: conversation.id })
      .all();

    // Tri chronologique
    messages.sort((a, b) => {
      const timeA = Temporal.Instant.from(a.date_envoi.toString()).epochMilliseconds;
      const timeB = Temporal.Instant.from(b.date_envoi.toString()).epochMilliseconds;
      return timeA - timeB;
    });

    return messages.map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      expediteur_id: m.expediteur_id,
      contenu: m.contenu,
      date_envoi: m.date_envoi.toString(),
      statut: m.statut,
      est_mon_message: m.expediteur_id === userId,
    }));
  }
}

export const conversationsService = new ConversationsService();
