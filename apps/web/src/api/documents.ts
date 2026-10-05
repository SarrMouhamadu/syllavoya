import { apiFetch } from "./client";
import { type DocumentItem } from "./conversations";

export { type DocumentItem };

export const documentsApi = {
  // Récupérer un document par son identifiant unique
  getDocumentById: async (documentId: string): Promise<{ success: boolean; data: { document: DocumentItem } }> => {
    return apiFetch<{ success: boolean; data: { document: DocumentItem } }>(`/documents/${documentId}`);
  },

  // Lister les documents d'une conversation
  listConversationDocuments: async (conversationId: string): Promise<{ success: boolean; data: { documents: DocumentItem[] } }> => {
    return apiFetch<{ success: boolean; data: { documents: DocumentItem[] } }>(`/conversations/${conversationId}/documents`);
  },

  // Récupérer un document spécifique au sein d'une conversation
  getConversationDocument: async (conversationId: string, documentId: string): Promise<{ success: boolean; data: { document: DocumentItem } }> => {
    return apiFetch<{ success: boolean; data: { document: DocumentItem } }>(`/conversations/${conversationId}/documents/${documentId}`);
  },
};
