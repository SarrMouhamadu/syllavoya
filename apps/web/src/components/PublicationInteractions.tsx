import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  publicationsApi,
  type PublicationComment,
} from "../api/publications";
import { IconHeart, IconMessageSquare } from "./Icons";
import { LoadingSpinner } from "./LoadingSpinner";

export interface PublicationInteractionsProps {
  publicationId: string;
  compact?: boolean;
  defaultExpandedComments?: boolean;
  iosCounterOnly?: boolean;
}

export const PublicationInteractions: React.FC<PublicationInteractionsProps> = ({
  publicationId,
  compact = false,
  defaultExpandedComments = false,
  iosCounterOnly = false,
}) => {
  const { isAuthenticated } = useAuth();

  const [likesCount, setLikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState<PublicationComment[]>([]);
  const [showComments, setShowComments] = useState(defaultExpandedComments);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  const fetchInteractions = useCallback(async () => {
    try {
      const res = await publicationsApi.getInteractions(publicationId);
      if (res.success && res.data) {
        setLikesCount(res.data.likesCount);
        setUserLiked(res.data.userLiked);
        setComments(res.data.comments || []);
      }
    } catch {
      // ignore
    }
  }, [publicationId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Veuillez vous connecter pour aimer cette publication.");
      return;
    }
    if (liking) return;

    // Optimistic update
    const nextUserLiked = !userLiked;
    const nextLikesCount = nextUserLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setUserLiked(nextUserLiked);
    setLikesCount(nextLikesCount);

    try {
      setLiking(true);
      const res = await publicationsApi.toggleLike(publicationId);
      if (res.success && res.data) {
        setLikesCount(res.data.likesCount);
        setUserLiked(res.data.userLiked);
      }
    } catch {
      // Revert on failure
      setUserLiked(!nextUserLiked);
      setLikesCount(likesCount);
    } finally {
      setLiking(false);
    }
  };

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Veuillez vous connecter pour commenter cette publication.");
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      setCommentError(null);
      const res = await publicationsApi.addComment(publicationId, newComment.trim());
      if (res.success && res.data) {
        setNewComment("");
        if (res.data.interactions?.comments) {
          setComments(res.data.interactions.comments);
        } else if (res.data.comment) {
          setComments((prev) => [res.data.comment, ...prev]);
        }
      }
    } catch (err: any) {
      setCommentError(err?.message || "Impossible d'envoyer votre commentaire.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (iosCounterOnly) {
    return (
      <button
        type="button"
        className="ios-like-btn"
        onClick={handleToggleLike}
        title={userLiked ? "Je n'aime plus" : "J'aime"}
        aria-label={userLiked ? "Je n'aime plus" : "J'aime"}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#6E6E73",
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={userLiked ? "#D70015" : "none"}
          stroke="#D70015"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
        <span>{likesCount}</span>
      </button>
    );
  }

  return (
    <div className={`pub-interactions-container ${compact ? "pub-interactions-compact" : ""}`}>
      {/* Barre d'actions : J'aime & Commenter */}
      <div className="pub-interactions-bar">
        <button
          type="button"
          className={`pub-action-btn pub-like-btn ${userLiked ? "pub-liked" : ""}`}
          onClick={handleToggleLike}
          title={userLiked ? "Je n'aime plus" : "J'aime"}
          aria-label={userLiked ? "Je n'aime plus" : "J'aime"}
        >
          <IconHeart size={18} filled={userLiked} className="pub-action-icon heart-icon" />
          <span className="pub-action-label">J'aime</span>
          {likesCount > 0 && <span className="pub-count-badge">{likesCount}</span>}
        </button>

        <button
          type="button"
          className={`pub-action-btn pub-comment-btn ${showComments ? "active" : ""}`}
          onClick={handleToggleComments}
          title="Afficher les commentaires"
          aria-label="Afficher les commentaires"
        >
          <IconMessageSquare size={18} className="pub-action-icon" />
          <span className="pub-action-label">Commenter</span>
          {comments.length > 0 && <span className="pub-count-badge">{comments.length}</span>}
        </button>
      </div>

      {/* Bloc dépliable des commentaires */}
      {showComments && (
        <div className="pub-comments-dropdown" onClick={(e) => e.stopPropagation()}>
          {/* Formulaire d'ajout de commentaire si connecté */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="pub-comment-form">
              <div className="pub-comment-input-wrap">
                <input
                  type="text"
                  className="pub-comment-input"
                  placeholder="Écrire un commentaire bienveillant..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submittingComment}
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm pub-comment-submit-btn"
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? <LoadingSpinner size="small" /> : <span>Publier</span>}
                </button>
              </div>
              {commentError && <div className="pub-comment-error">{commentError}</div>}
            </form>
          ) : (
            <div className="pub-comment-login-hint">
              <span>Connectez-vous pour participer à la discussion.</span>
            </div>
          )}

          {/* Liste des commentaires */}
          <div className="pub-comments-list">
            {comments.length === 0 ? (
              <div className="pub-no-comments">
                <span>Aucun commentaire pour l'instant. Soyez le premier à réagir !</span>
              </div>
            ) : (
              comments.map((c) => {
                const formattedDate = new Date(c.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isAgency = c.userRole === "PROFESSIONNEL";
                const isAdmin = c.userRole === "ADMIN";

                return (
                  <div key={c.id} className="pub-comment-item">
                    <div className="pub-comment-avatar">
                      {(c.userName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="pub-comment-body">
                      <div className="pub-comment-header">
                        <strong className="pub-comment-author">{c.userName}</strong>
                        {isAgency && <span className="pub-comment-role-tag role-pro">Agence</span>}
                        {isAdmin && <span className="pub-comment-role-tag role-admin">Équipe Sylla</span>}
                        <time className="pub-comment-date">{formattedDate}</time>
                      </div>
                      <p className="pub-comment-content">{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
