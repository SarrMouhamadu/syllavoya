import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { conversationsApi, type ConversationSummary } from "../api/conversations";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Alert } from "../components/Alert";
import {
  IconMessage,
  IconBuilding,
  IconUser,
  IconArrowRight,
  IconRefresh,
} from "../components/Icons";

export const ConversationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await conversationsApi.listConversations();
      if (res.success && res.data?.conversations) {
        setConversations(res.data.conversations);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible de charger vos conversations. Veuillez vérifier votre connexion."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Formatter la date du dernier message ou de création
  const formatMessageDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  // Obtenir le nom de l'interlocuteur selon le rôle
  const getInterlocuteurName = (c: ConversationSummary) => {
    if (user?.role === "PROFESSIONNEL") {
      return c.voyageur
        ? `${c.voyageur.prenom} ${c.voyageur.nom}`.trim()
        : "Voyageur";
    }
    if (user?.role === "ADMIN") {
      const v = c.voyageur ? `${c.voyageur.prenom} ${c.voyageur.nom}` : "Voyageur";
      const p = c.professionnel?.nom_structure || "Professionnel";
      return `${v} ↔ ${p}`;
    }
    return c.professionnel?.nom_structure || "Structure professionnelle";
  };

  // Sous-titre descriptif de l'interlocuteur
  const getInterlocuteurSubtitle = (c: ConversationSummary) => {
    if (user?.role === "PROFESSIONNEL") {
      return "Voyageur";
    }
    if (c.professionnel?.nom && c.professionnel?.prenom) {
      return `Contact : ${c.professionnel.prenom} ${c.professionnel.nom}`;
    }
    return "Professionnel vérifié";
  };

  return (
    <div className="messages-page">
      <div className="container messages-container">
        {/* En-tête sobre et clair */}
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <span className="page-header-badge">Messagerie sécurisée</span>
              <h1 className="page-title">Mes Conversations</h1>
              <p className="page-subtitle">
                {user?.role === "PROFESSIONNEL"
                  ? "Consultez vos messages reçus et répondez directement aux demandes des voyageurs."
                  : "Échangez en direct avec vos interlocuteurs professionnels en toute sécurité."}
              </p>
            </div>
            {user?.role === "VOYAGEUR" && (
              <div className="page-header-actions">
                <Link to="/professionals" className="btn btn-primary btn-sm">
                  Trouver un professionnel
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="center-container">
            <LoadingSpinner message="Chargement de vos conversations..." size="large" />
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <div className="state-container">
            <Alert type="error" message={error} onClose={() => setError(null)} />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={fetchConversations}
              style={{ marginTop: "14px" }}
            >
              <IconRefresh size={16} />
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {/* État vide */}
        {!loading && !error && conversations.length === 0 && (
          <EmptyState
            icon={<IconMessage size={40} />}
            title="Aucune conversation pour le moment"
            description={
              user?.role === "PROFESSIONNEL"
                ? "Vous n'avez pas encore été contacté par un voyageur. Dès qu'un voyageur vous écrira, sa conversation s'affichera ici."
                : "Vous n'avez pas encore initié d'échange. Consultez l'annuaire des professionnels vérifiés pour contacter une structure."
            }
            actionText={user?.role === "PROFESSIONNEL" ? undefined : "Contacter un professionnel"}
            onAction={user?.role === "PROFESSIONNEL" ? undefined : () => navigate("/professionals")}
          />
        )}

        {/* Liste des conversations */}
        {!loading && !error && conversations.length > 0 && (
          <div className="conversations-list" role="list">
            {conversations.map((c) => {
              const name = getInterlocuteurName(c);
              const subtitle = getInterlocuteurSubtitle(c);
              const lastDate = formatMessageDate(
                c.dernier_message?.date_envoi || c.date_creation
              );
              const isPro = user?.role === "PROFESSIONNEL";

              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className="conversation-card"
                  id={`conv-card-${c.id}`}
                  role="listitem"
                >
                  <div className="conv-avatar">
                    {isPro ? <IconUser size={22} /> : <IconBuilding size={22} />}
                  </div>

                  <div className="conv-main-info">
                    <div className="conv-header-row">
                      <h2 className="conv-interlocuteur-name">{name}</h2>
                      {lastDate && <span className="conv-date">{lastDate}</span>}
                    </div>

                    <div className="conv-subtitle-row">
                      <span className="conv-role-tag">{subtitle}</span>
                      <span className="conv-msg-count">
                        {c.nombre_messages} {c.nombre_messages > 1 ? "messages" : "message"}
                      </span>
                    </div>

                    <div className="conv-snippet-row">
                      {c.dernier_message ? (
                        <p className="conv-last-message">
                          {c.dernier_message.expediteur_id === user?.id && (
                            <span className="conv-you-prefix">Vous : </span>
                          )}
                          {c.dernier_message.contenu}
                        </p>
                      ) : (
                        <p className="conv-last-message conv-no-message">
                          En attente du premier message...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="conv-arrow" aria-hidden="true">
                    <IconArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
