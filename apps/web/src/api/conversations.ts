import { apiFetch } from "./client";

export interface ConversationParticipant {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  nom_structure?: string;
}

export interface ConversationSummary {
  id: string;
  date_creation: string;
  statut: string;
  voyageur: ConversationParticipant | null;
  professionnel: {
    id: string;
    nom_structure: string;
    nom?: string;
    prenom?: string;
  } | null;
  nombre_messages: number;
  dernier_message: {
    id: string;
    expediteur_id: string;
    contenu: string;
    date_envoi: string;
    statut: string;
  } | null;
}

export interface ConversationDetail {
  id: string;
  date_creation: string;
  statut: string;
  voyageur: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  professionnel: {
    id: string;
    nom_structure: string;
    nom?: string;
    prenom?: string;
  } | null;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  expediteur_id: string;
  contenu: string;
  date_envoi: string;
  statut: string;
  est_mon_message?: boolean;
}

export interface CreateConversationParams {
  professionnel_id: string;
  premier_message?: string;
}

export interface CreateConversationResult {
  conversation: {
    id: string;
    voyageur_id: string;
    professionnel_id: string;
    date_creation: string;
    statut: string;
    professionnel?: {
      id: string;
      nom_structure: string;
      email?: string;
      nom?: string;
      prenom?: string;
    };
    premier_message?: {
      id: string;
      contenu: string;
      date_envoi: string;
      statut: string;
    } | null;
  };
}

export interface DocumentItem {
  id: string;
  conversation_id: string;
  expediteur_id: string;
  fichier: string;
  date_envoi: string;
  expediteur?: {
    id: string;
    nom: string;
    prenom: string;
    role: string;
  } | null;
  est_mon_document?: boolean;
}

export const conversationsApi = {
  // Liste des conversations de l'utilisateur connecté
  listConversations: async (): Promise<{ success: boolean; data: { conversations: ConversationSummary[] } }> => {
    return apiFetch<{ success: boolean; data: { conversations: ConversationSummary[] } }>("/conversations");
  },

  // Détails d'une conversation par son ID
  getConversation: async (id: string): Promise<{ success: boolean; data: { conversation: ConversationDetail } }> => {
    return apiFetch<{ success: boolean; data: { conversation: ConversationDetail } }>(`/conversations/${id}`);
  },

  // Messages d'une conversation par ordre chronologique
  listMessages: async (conversationId: string): Promise<{ success: boolean; data: { messages: MessageItem[] } }> => {
    return apiFetch<{ success: boolean; data: { messages: MessageItem[] } }>(`/conversations/${conversationId}/messages`);
  },

  // Envoyer un message dans une conversation existante
  sendMessage: async (conversationId: string, contenu: string): Promise<{ success: boolean; data: { message: MessageItem } }> => {
    return apiFetch<{ success: boolean; data: { message: MessageItem } }>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ contenu }),
    });
  },

  // Créer une nouvelle conversation (voyageur vers professionnel vérifié)
  createConversation: async (params: CreateConversationParams): Promise<{ success: boolean; data: CreateConversationResult }> => {
    return apiFetch<{ success: boolean; data: CreateConversationResult }>("/conversations", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Lister les documents échangés dans une conversation
  listDocuments: async (conversationId: string): Promise<{ success: boolean; data: { documents: DocumentItem[] } }> => {
    return apiFetch<{ success: boolean; data: { documents: DocumentItem[] } }>(`/conversations/${conversationId}/documents`);
  },

  // Consulter un document dans une conversation
  getDocument: async (conversationId: string, documentId: string): Promise<{ success: boolean; data: { document: DocumentItem } }> => {
    return apiFetch<{ success: boolean; data: { document: DocumentItem } }>(`/conversations/${conversationId}/documents/${documentId}`);
  },
};
