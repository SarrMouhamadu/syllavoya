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
import {
  IconArrowLeft,
  IconBuilding,
  IconUser,
  IconMessage,
  IconFileText,
  IconSend,
  IconLock,
  IconRefresh,
  IconShieldCheck,
  IconX,
  IconPaperclip,
  IconImage,
  IconArrowUp,
} from "../components/Icons";

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

  // Pièces jointes (JPG, JPEG, PNG, PDF uniquement - Vidéos formellement interdites)
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnvoiErreur(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"];
    const isVideo = file.type.startsWith("video/") || videoExtensions.some((ext) => lowerName.endsWith(ext));

    // INTERDICTION FORMELLE DE TOUTE VIDÉO
    if (isVideo) {
      setEnvoiErreur("Les fichiers vidéo (MP4, MOV, AVI, MKV...) sont formellement interdits. Seuls les formats JPG, PNG et PDF sont autorisés.");
      e.target.value = "";
      setAttachedFile(null);
      setAttachedFilePreview(null);
      return;
    }

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    const isAllowedExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    const isAllowedMime = file.type === "image/jpeg" || file.type === "image/png" || file.type === "application/pdf";

    if (!isAllowedExt && !isAllowedMime) {
      setEnvoiErreur("Format non autorisé. Formats acceptés : JPG, JPEG, PNG et documents PDF.");
      e.target.value = "";
      setAttachedFile(null);
      setAttachedFilePreview(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setEnvoiErreur("La taille du fichier dépasse la limite maximale autorisée de 25 Mo.");
      e.target.value = "";
      setAttachedFile(null);
      setAttachedFilePreview(null);
      return;
    }

    setAttachedFile(file);

    // Prévisualisation pour les images
    const isImage = file.type.startsWith("image/") || [".jpg", ".jpeg", ".png"].some((ext) => lowerName.endsWith(ext));
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedFilePreview(null);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!nouveauMessage.trim() && !attachedFile) return;

    try {
      setEnvoiEnCours(true);
      setEnvoiErreur(null);

      let msgText = nouveauMessage.trim();

      // Traitement de la pièce jointe
      if (attachedFile) {
        // Enregistrer le document via l'API documents existante
        const filePayload = attachedFilePreview || attachedFile.name;
        const docRes = await conversationsApi.addDocument(id, filePayload).catch(() => null);
        if (docRes?.success && docRes.data?.document) {
          setDocuments((prev) => [...prev, docRes.data.document]);
        }

        if (!msgText) {
          msgText = `[Fichier joint : ${attachedFile.name}]`;
        } else {
          msgText = `${msgText}\n[Fichier joint : ${attachedFile.name}]`;
        }
      }

      const res = await conversationsApi.sendMessage(id, msgText);
      if (res.success && res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setNouveauMessage("");
        handleRemoveAttachment();
      }
    } catch (err: any) {
      setEnvoiErreur(
        err?.message || "Impossible d'envoyer votre message. Veuillez réessayer."
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const isPro = user?.role === "PROFESSIONNEL";
  const interlocuteurNom = isPro
    ? conversation?.voyageur
      ? `${conversation.voyageur.prenom} ${conversation.voyageur.nom}`.trim()
      : "Voyageur"
    : conversation?.professionnel?.nom_structure || "Structure professionnelle";

  const interlocuteurBadge = isPro
    ? "Voyageur"
    : conversation?.professionnel?.nom && conversation?.professionnel?.prenom
    ? `Responsable : ${conversation.professionnel.prenom} ${conversation.professionnel.nom}`
    : "Professionnel vérifié";

  // Règle 5 : le professionnel ne peut pas envoyer de message si le voyageur n'en a envoyé aucun
  const messagesFromVoyageur = messages.filter(
    (m) => m.expediteur_id === conversation?.voyageur?.id
  );
  const proBloqueSansPremierMessage = isPro && messagesFromVoyageur.length === 0;

  return (
    <div className="chat-page">
      <div className="container chat-container">
        {/* Navigation retour */}
        <div className="back-nav">
          <Link to="/messages" className="back-link">
            <IconArrowLeft size={16} />
            <span>Toutes les conversations</span>
          </Link>
        </div>

        {/* État de chargement initial */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement des données de la conversation..." size="large" />
          </div>
        )}

        {/* État d'erreur d'accès */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} />
            <Link to="/messages" className="btn btn-outline" style={{ marginTop: "14px" }}>
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
                {isPro ? <IconUser size={24} /> : <IconBuilding size={24} />}
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
                    Voir fiche
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
                <IconMessage size={16} />
                <span>Messages ({messages.length})</span>
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
                <IconFileText size={16} />
                <span>Documents échangés ({documents.length})</span>
              </button>
            </div>

            {/* CONTENU ONGLET 1 : MESSAGES */}
            {activeTab === "messages" && (
              <>
                {/* Zone d'historique des messages */}
                <div className="chat-messages-area" role="log" aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="chat-empty-messages">
                      <div className="empty-icon-wrap">
                        <IconMessage size={32} />
                      </div>
                      <p>Aucun message échangé pour le moment.</p>
                      {user?.role === "VOYAGEUR" ? (
                        <p className="text-muted text-sm">
                          Envoyez votre message ci-dessous pour démarrer l'échange avec cette structure.
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

                        // Détection de pièce jointe dans le contenu
                        let textContent = msg.contenu;
                        let attachmentName: string | null = null;
                        const attachmentMatch = msg.contenu.match(/\[(?:Fichier joint|Pièce jointe)\s*:\s*([^\]]+)\]/);
                        if (attachmentMatch) {
                          attachmentName = attachmentMatch[1].trim();
                          textContent = msg.contenu.replace(attachmentMatch[0], "").trim();
                        }

                        // Rechercher dans documents si une version data URL ou fichier existe
                        const matchingDoc = attachmentName
                          ? documents.find((d) => d.fichier === attachmentName || (d.fichier.startsWith("data:") && d.fichier.includes(attachmentName!)))
                          : null;

                        const displayFile = matchingDoc?.fichier || attachmentName;
                        const isImgAttachment = displayFile && (
                          displayFile.startsWith("data:image/") ||
                          [".jpg", ".jpeg", ".png"].some((ext) => displayFile.toLowerCase().endsWith(ext))
                        );
                        const isPdfAttachment = displayFile && (
                          displayFile.startsWith("data:application/pdf") ||
                          displayFile.toLowerCase().endsWith(".pdf")
                        );

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
                              {textContent && <div className="message-content">{textContent}</div>}

                              {/* Affichage du fichier envoyé dans la conversation */}
                              {displayFile && (
                                <div className="message-attachment-card">
                                  {isImgAttachment ? (
                                    <div className="msg-attachment-img-box">
                                      {displayFile.startsWith("data:image/") ? (
                                        <img
                                          src={displayFile}
                                          alt={attachmentName || "Image jointe"}
                                          className="msg-attachment-img"
                                        />
                                      ) : (
                                        <div className="msg-attachment-file-pill">
                                          <IconImage size={18} />
                                          <span className="msg-attachment-name">
                                            {attachmentName || displayFile}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : isPdfAttachment ? (
                                    <div className="msg-attachment-pdf-pill">
                                      <IconFileText size={18} />
                                      <span className="msg-attachment-name">
                                        {attachmentName || displayFile}
                                      </span>
                                      <span className="msg-attachment-tag">PDF</span>
                                    </div>
                                  ) : (
                                    <div className="msg-attachment-file-pill">
                                      <IconFileText size={18} />
                                      <span className="msg-attachment-name">
                                        {attachmentName || displayFile}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

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
                    <IconLock size={18} />
                    <span>
                      <strong>Règle de la plateforme :</strong> Seul le voyageur peut initier le premier contact. Vous pourrez répondre dès réception de son premier message.
                    </span>
                  </div>
                )}

                {/* Aperçu de la pièce jointe sélectionnée */}
                {attachedFile && (
                  <div className="chat-attachment-bar" id="chat-attachment-preview">
                    {attachedFilePreview ? (
                      <div className="chat-attach-preview-item">
                        <img
                          src={attachedFilePreview}
                          alt={attachedFile.name}
                          className="chat-attach-preview-img"
                        />
                        <div className="chat-attach-meta">
                          <span className="chat-attach-filename">{attachedFile.name}</span>
                          <span className="chat-attach-filesize">
                            {(attachedFile.size / 1024).toFixed(0)} Ko
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="chat-attach-preview-item">
                        <div className="chat-attach-pdf-icon-wrap">
                          <IconFileText size={22} />
                        </div>
                        <div className="chat-attach-meta">
                          <span className="chat-attach-filename">{attachedFile.name}</span>
                          <span className="chat-attach-badge">Document PDF</span>
                          <span className="chat-attach-filesize">
                            {(attachedFile.size / 1024).toFixed(0)} Ko
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="chat-attach-remove-btn"
                      onClick={handleRemoveAttachment}
                      title="Retirer le fichier"
                      aria-label="Retirer la pièce jointe"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                )}

                {/* Formulaire de saisie du message */}
                <form onSubmit={handleSendMessage} className="chat-input-bar">
                  {/* Sélecteur de fichier masqué */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    style={{ display: "none" }}
                    id="chat-file-input"
                  />

                  {/* Bouton [ Joindre ] */}
                  <button
                    type="button"
                    className="btn btn-outline chat-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={envoiEnCours || proBloqueSansPremierMessage}
                    id="btn-attach-file"
                    title="Joindre une photo (JPG, PNG) ou un PDF"
                  >
                    <IconPaperclip size={18} />
                    <span className="chat-attach-btn-label">Joindre</span>
                  </button>

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
                        : attachedFile
                        ? "Ajouter un message accompagnant la pièce jointe (optionnel)..."
                        : "Écrivez votre message ici..."
                    }
                    value={nouveauMessage}
                    onChange={(e) => setNouveauMessage(e.target.value)}
                    disabled={envoiEnCours || proBloqueSansPremierMessage}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary chat-send-btn"
                    disabled={
                      envoiEnCours ||
                      (!nouveauMessage.trim() && !attachedFile) ||
                      proBloqueSansPremierMessage
                    }
                    id="btn-send-message"
                  >
                    {envoiEnCours ? (
                      "Envoi..."
                    ) : (
                      <>
                        <IconSend size={16} />
                        <span>Envoyer</span>
                      </>
                    )}
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
                    <IconLock size={14} />
                    <span>Accès privé réservé</span>
                  </span>
                </div>

                {/* Erreur de chargement des documents */}
                {documentsError && (
                  <div className="docs-alert-wrapper">
                    <Alert type="error" message={documentsError} />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={fetchDocuments}
                      style={{ marginTop: "10px" }}
                    >
                      <IconRefresh size={14} />
                      <span>Réessayer</span>
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
                        <IconFileText size={24} className="doc-icon-svg" />
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
                        <IconX size={18} />
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
                      <IconShieldCheck size={18} />
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
                      icon={<IconFileText size={36} />}
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
                              <IconFileText size={20} />
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

        {/* Vue Mobile iOS fidèle à Conversation.dc.html */}
        {!loading && !error && conversation && (
          <div className="ios-chat-container">
            {/* Header sticky iOS */}
            <header className="ios-chat-header">
              <Link to="/messages" className="ios-chat-back" aria-label="Retour aux messages">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </Link>
              <div className="ios-chat-header-center">
                <div className="ios-chat-partner-name">{interlocuteurNom}</div>
                <span className="ios-chat-partner-verified">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1D7A3C"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Vérifié</span>
                </span>
              </div>
            </header>

            {/* Flux de messages iOS */}
            <div className="ios-chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6E6E73", padding: "40px 20px" }}>
                  {proBloqueSansPremierMessage
                    ? "En attente du premier message du voyageur..."
                    : "Aucun message pour le moment. Écrivez ci-dessous pour commencer."}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.est_mon_message ?? msg.expediteur_id === user?.id;
                  const timeStr = msg.date_envoi
                    ? new Date(msg.date_envoi).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  // Détection pièce jointe
                  let textContent = msg.contenu;
                  const match = msg.contenu.match(/\[(?:Fichier joint|Pièce jointe)\s*:\s*([^\]]+)\]/);
                  if (match) {
                    textContent = msg.contenu.replace(match[0], "").trim();
                  }

                  return (
                    <div
                      key={`ios-msg-${msg.id}`}
                      className={`ios-msg-group ${isMe ? "is-mine" : "is-theirs"}`}
                    >
                      <div className={`ios-bubble ${isMe ? "is-mine" : "is-theirs"}`}>
                        {textContent || msg.contenu}
                      </div>
                      {timeStr && <div className="ios-msg-time">{timeStr}</div>}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Aperçu de la pièce jointe si sélectionnée */}
            {attachedFile && (
              <div
                style={{
                  position: "fixed",
                  bottom: "60px",
                  left: "16px",
                  right: "16px",
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  zIndex: 95,
                }}
              >
                <span style={{ fontSize: "14px", color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📎 {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{ background: "none", border: "none", color: "#6E6E73", cursor: "pointer", padding: "4px" }}
                >
                  <IconX size={16} />
                </button>
              </div>
            )}

            {/* Barre de saisie fixée en bas fidèle à Conversation.dc.html */}
            <form onSubmit={handleSendMessage} className="ios-chat-input-bar">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="ios-chat-attachment-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={envoiEnCours || proBloqueSansPremierMessage}
                aria-label="Joindre un fichier"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" />
                </svg>
              </button>

              <input
                type="text"
                className="ios-chat-input"
                placeholder={proBloqueSansPremierMessage ? "En attente du premier message..." : "Message"}
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                disabled={envoiEnCours || proBloqueSansPremierMessage}
              />

              <button
                type="submit"
                className="ios-chat-send-btn"
                disabled={envoiEnCours || proBloqueSansPremierMessage || (!nouveauMessage.trim() && !attachedFile)}
                aria-label="Envoyer"
              >
                <IconArrowUp size={20} color="#fff" strokeWidth={2.2} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
