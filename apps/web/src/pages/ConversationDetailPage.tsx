import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  conversationsApi,
  type ConversationDetail,
  type MessageItem,
  type DocumentItem,
} from "../api/conversations";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Alert } from "../components/Alert";

export const ConversationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Onglet actif : "messages" ou "documents"
  const [activeTab, setActiveTab] = useState<"messages" | "documents">("messages");

  // Documents échangés
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [docDetailLoading, setDocDetailLoading] = useState<boolean>(false);
  const [docDetailError, setDocDetailError] = useState<string | null>(null);

  // Formulaire d'envoi de message
  const [nouveauMessage, setNouveauMessage] = useState<string>("");
  const [envoiEnCours, setEnvoiEnCours] = useState<boolean>(false);
  const [envoiErreur, setEnvoiErreur] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Faire défiler vers le bas lors de l'arrivée de nouveaux messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Charger les métadonnées de la conversation, l'historique et la liste des documents
      const [convRes, msgRes, docRes] = await Promise.all([
        conversationsApi.getConversation(id),
        conversationsApi.listMessages(id),
        conversationsApi.listDocuments(id).catch((err) => {
          setDocumentsError(err?.message || "Impossible de charger les documents.");
          return { success: false, data: { documents: [] } };
        }),
      ]);

      if (convRes.success && convRes.data?.conversation) {
        setConversation(convRes.data.conversation);
      }
      if (msgRes.success && msgRes.data?.messages) {
        setMessages(msgRes.data.messages);
      }
      if (docRes.success && docRes.data?.documents) {
        setDocuments(docRes.data.documents);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger la conversation. Veuillez vérifier que vous avez bien accès à ces informations."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && activeTab === "messages" && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, activeTab, messages.length]);

  // Recharger les documents de la conversation
  const fetchDocuments = async () => {
    if (!id) return;
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      const res = await conversationsApi.listDocuments(id);
      if (res.success && res.data?.documents) {
        setDocuments(res.data.documents);
      }
    } catch (err: any) {
      setDocumentsError(err?.message || "Impossible de charger les documents.");
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Consulter un document via l'API existante (GET /api/conversations/:id/documents/:documentId)
  const handleViewDocument = async (documentId: string) => {
    if (!id) return;
    try {
      setDocDetailLoading(true);
      setDocDetailError(null);
      setSelectedDocument(null);

      const res = await conversationsApi.getDocument(id, documentId);
      if (res.success && res.data?.document) {
        setSelectedDocument(res.data.document);
      }
    } catch (err: any) {
      setDocDetailError(
        err?.message || "Impossible d'accéder aux détails de ce document."
      );
    } finally {
      setDocDetailLoading(false);
    }
  };

  // Formatter la date et l'heure
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Déterminer l'interlocuteur
  const interlocuteurNom =
    user?.role === "PROFESSIONNEL"
      ? conversation?.voyageur
        ? `${conversation.voyageur.prenom} ${conversation.voyageur.nom}`.trim()
        : "Voyageur"
      : conversation?.professionnel?.nom_structure || "Structure professionnelle";

  const interlocuteurBadge =
    user?.role === "PROFESSIONNEL" ? "Voyageur" : "Structure Vérifiée";

  // Règle métier : le professionnel ne peut répondre que si le voyageur a envoyé un message
  const hasVoyageurMessage = messages.some(
    (m) => m.expediteur_id === conversation?.voyageur?.id
  );
  const isPro = user?.role === "PROFESSIONNEL";
  const proBloqueSansPremierMessage = isPro && !hasVoyageurMessage;

  // Envoi d'un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nouveauMessage.trim() || envoiEnCours) return;

    try {
      setEnvoiEnCours(true);
      setEnvoiErreur(null);

      const res = await conversationsApi.sendMessage(id, nouveauMessage.trim());

      if (res.success && res.data?.message) {
        const createdMsg = {
          ...res.data.message,
          est_mon_message: true,
        };
        // Mise à jour immédiate avec la réponse réelle du serveur
        setMessages((prev) => [...prev, createdMsg]);
        setNouveauMessage("");
      }
    } catch (err: any) {
      setEnvoiErreur(
        err?.message || "Impossible d'envoyer le message. Veuillez réessayer."
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="container chat-container">
        {/* Navigation retour */}
        <div className="chat-nav-back">
          <Link to="/messages" className="back-link" id="link-back-messages">
            ← Retour à mes conversations
          </Link>
        </div>

        {/* État de chargement initial */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement des données de la conversation..." size="large" />
          </div>
        )}

        {/* État d'erreur d'accès (403, 404, etc.) */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/messages" className="btn btn-outline mt-3">
              Revenir aux conversations
            </Link>
          </div>
        )}

        {/* Vue de la conversation */}
        {!loading && !error && conversation && (
          <div className="chat-card">
            {/* En-tête de la conversation */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                {isPro ? "🎒" : "🏢"}
              </div>
              <div className="chat-header-info">
                <h1 className="chat-header-title">{interlocuteurNom}</h1>
                <span className="chat-header-badge">
                  {interlocuteurBadge}
                </span>
              </div>
              {conversation.professionnel?.id && user?.role !== "PROFESSIONNEL" && (
                <div className="chat-header-actions">
                  <Link
                    to={`/professionals/${conversation.professionnel.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Voir profil
                  </Link>
                </div>
              )}
            </div>

            {/* Onglets de navigation : Messages vs Documents échangés */}
            <div className="chat-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "messages"}
                className={`chat-tab-btn ${activeTab === "messages" ? "is-active" : ""}`}
                onClick={() => setActiveTab("messages")}
                id="tab-messages"
              >
                💬 Messages ({messages.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "documents"}
                className={`chat-tab-btn ${activeTab === "documents" ? "is-active" : ""}`}
                onClick={() => {
                  setActiveTab("documents");
                  fetchDocuments();
                }}
                id="tab-documents"
              >
                📄 Documents échangés ({documents.length})
              </button>
            </div>

            {/* CONTENU ONGLET 1 : MESSAGES */}
            {activeTab === "messages" && (
              <>
                {/* Zone d'historique des messages */}
                <div className="chat-messages-area" role="log" aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="chat-empty-messages">
                      <span className="empty-icon">✉️</span>
                      <p>Aucun message échangé pour le moment.</p>
                      {user?.role === "VOYAGEUR" ? (
                        <p className="text-muted text-sm">
                          Envoyez votre premier message ci-dessous pour démarrer l'échange avec cette structure.
                        </p>
                      ) : (
                        <p className="text-muted text-sm">
                          En attente du premier message du voyageur.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="messages-stream">
                      {messages.map((msg) => {
                        const isMe =
                          msg.est_mon_message ?? msg.expediteur_id === user?.id;

                        return (
                          <div
                            key={msg.id}
                            className={`message-bubble-wrapper ${isMe ? "message-me" : "message-other"}`}
                            id={`msg-${msg.id}`}
                          >
                            <div className="message-bubble">
                              <div className="message-sender-name">
                                {isMe ? "Vous" : interlocuteurNom}
                              </div>
                              <div className="message-content">{msg.contenu}</div>
                              <div className="message-timestamp">
                                {formatDateTime(msg.date_envoi)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Alerte d'erreur lors de l'envoi */}
                {envoiErreur && (
                  <div className="chat-error-wrapper">
                    <Alert
                      type="error"
                      message={envoiErreur}
                      onClose={() => setEnvoiErreur(null)}
                    />
                  </div>
                )}

                {/* Notification de règle métier si professionnel sans premier message voyageur */}
                {proBloqueSansPremierMessage && (
                  <div className="chat-business-rule-banner">
                    <span className="rule-icon">ℹ️</span>
                    <span>
                      <strong>Règle Sylla Voyage :</strong> Seul le voyageur peut initier le premier contact. Vous pourrez répondre dès réception de son premier message.
                    </span>
                  </div>
                )}

                {/* Formulaire de saisie du message */}
                <form onSubmit={handleSendMessage} className="chat-input-bar">
                  <label htmlFor="input-chat-message" className="sr-only">
                    Rédiger un message
                  </label>
                  <textarea
                    id="input-chat-message"
                    className="chat-textarea"
                    rows={2}
                    placeholder={
                      proBloqueSansPremierMessage
                        ? "En attente du premier message du voyageur..."
                        : "Écrivez votre message ici..."
                    }
                    value={nouveauMessage}
                    onChange={(e) => setNouveauMessage(e.target.value)}
                    disabled={envoiEnCours || proBloqueSansPremierMessage}
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-primary chat-send-btn"
                    disabled={envoiEnCours || !nouveauMessage.trim() || proBloqueSansPremierMessage}
                    id="btn-send-message"
                  >
                    {envoiEnCours ? "Envoi..." : "Envoyer"}
                  </button>
                </form>
              </>
            )}

            {/* CONTENU ONGLET 2 : DOCUMENTS ÉCHANGÉS */}
            {activeTab === "documents" && (
              <div className="chat-documents-section">
                <div className="documents-section-header">
                  <div className="documents-header-info">
                    <h2 className="documents-section-title">Documents de la conversation</h2>
                    <p className="documents-section-desc">
                      Documents et justificatifs partagés entre les participants.
                    </p>
                  </div>
                  <span className="security-tag-pill">
                    🔒 Accès privé réservé
                  </span>
                </div>

                {/* Erreur de chargement des documents */}
                {documentsError && (
                  <div className="docs-alert-wrapper">
                    <Alert type="error" message={documentsError} />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm mt-2"
                      onClick={fetchDocuments}
                    >
                      🔄 Réessayer
                    </button>
                  </div>
                )}

                {/* Erreur d'accès à un document spécifique */}
                {docDetailError && (
                  <div className="docs-alert-wrapper">
                    <Alert
                      type="error"
                      message={docDetailError}
                      onClose={() => setDocDetailError(null)}
                    />
                  </div>
                )}

                {/* État de chargement des documents */}
                {documentsLoading && (
                  <div className="center-container py-4">
                    <LoadingSpinner message="Chargement des documents..." />
                  </div>
                )}

                {/* Fiche détaillée du document sélectionné */}
                {selectedDocument && (
                  <div className="document-detail-card" id="doc-detail-view">
                    <div className="doc-detail-header">
                      <div className="doc-detail-title-group">
                        <span className="doc-icon-large">📄</span>
                        <div>
                          <h3 className="doc-detail-filename">
                            {selectedDocument.fichier}
                          </h3>
                          <span className="doc-detail-badge">
                            Enregistré sur la plateforme
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-close-modal"
                        onClick={() => setSelectedDocument(null)}
                        aria-label="Fermer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="doc-detail-meta-grid">
                      <div className="doc-meta-item">
                        <span className="meta-label">Référence unique :</span>
                        <code className="meta-code">{selectedDocument.id}</code>
                      </div>
                      <div className="doc-meta-item">
                        <span className="meta-label">Transmis par :</span>
                        <span className="meta-val">
                          {selectedDocument.est_mon_document
                            ? "Vous"
                            : selectedDocument.expediteur
                            ? `${selectedDocument.expediteur.prenom} ${selectedDocument.expediteur.nom} (${selectedDocument.expediteur.role === "PROFESSIONNEL" ? "Professionnel" : "Voyageur"})`
                            : "Participant"}
                        </span>
                      </div>
                      <div className="doc-meta-item">
                        <span className="meta-label">Date d'enregistrement :</span>
                        <span className="meta-val">
                          {formatDateTime(selectedDocument.date_envoi)}
                        </span>
                      </div>
                    </div>

                    <div className="doc-security-note">
                      <span className="note-icon">🛡️</span>
                      <p>
                        Traçabilité certifiée : ce document est conservé de façon confidentielle dans les archives de la plateforme et accessible uniquement aux participants autorisés.
                      </p>
                    </div>

                    <div className="doc-detail-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-block"
                        onClick={() => setSelectedDocument(null)}
                      >
                        Fermer la fiche
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des documents */}
                {!documentsLoading && !documentsError && documents.length === 0 ? (
                  <div className="py-4">
                    <EmptyState
                      icon="📂"
                      title="Aucun document échangé"
                      description="Aucun document n'a été transmis dans cette conversation pour le moment."
                    />
                  </div>
                ) : (
                  !documentsLoading &&
                  !documentsError && (
                    <div className="documents-list" role="list">
                      {documents.map((doc) => {
                        const isMe =
                          doc.est_mon_document ?? doc.expediteur_id === user?.id;
                        const expediteurName = isMe
                          ? "Vous"
                          : doc.expediteur
                          ? `${doc.expediteur.prenom} ${doc.expediteur.nom}`
                          : "Participant";

                        return (
                          <div
                            key={doc.id}
                            className="document-item-row"
                            id={`doc-item-${doc.id}`}
                            role="listitem"
                          >
                            <div className="doc-item-icon">
                              📄
                            </div>
                            <div className="doc-item-info">
                              <h4 className="doc-item-filename">{doc.fichier}</h4>
                              <div className="doc-item-meta">
                                <span className="doc-sender-tag">
                                  Par : {expediteurName}
                                </span>
                                <span className="doc-date-text">
                                  {formatDateTime(doc.date_envoi)}
                                </span>
                              </div>
                            </div>
                            <div className="doc-item-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleViewDocument(doc.id)}
                                disabled={docDetailLoading}
                                id={`btn-view-doc-${doc.id}`}
                              >
                                {docDetailLoading && selectedDocument?.id === doc.id
                                  ? "Chargement..."
                                  : "Consulter"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
