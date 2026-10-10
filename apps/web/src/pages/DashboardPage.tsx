import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscriptionsApi, type UserSubscription } from "../api/subscriptions";
import { verificationApi, type MyVerificationResponse } from "../api/verification";
import { publicationsApi, parsePublicationContent, type ApiPublication } from "../api/publications";
import { conversationsApi, type ConversationSummary } from "../api/conversations";
import { adminApi, type AdminFinancialStats } from "../api/admin";
import {
  IconShieldCheck,
  IconCreditCard,
  IconFileText,
  IconBuilding,
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconLock,
  IconCalendar,
  IconClock,
  IconPlus,
  IconX,
  IconImage,
  IconDownload,
  IconEdit,
  IconTrash,
  IconUser,
} from "../components/Icons";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PublicationInteractions } from "../components/PublicationInteractions";
import { exportPublicationsToCSV } from "../utils/csvExport";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [verificationData, setVerificationData] = useState<MyVerificationResponse["data"] | null>(null);
  const [myPubs, setMyPubs] = useState<ApiPublication[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [publicPublications, setPublicPublications] = useState<ApiPublication[]>([]);
  const [adminStats, setAdminStats] = useState<{
    pendingVerifications: number;
    pendingPublications: number;
    pendingReports: number;
  }>({
    pendingVerifications: 0,
    pendingPublications: 0,
    pendingReports: 0,
  });

  const [financialStats, setFinancialStats] = useState<AdminFinancialStats>({
    chiffreAffairesTotal: 0,
    agences: { total: 0, enAttente: 0, actifsPayeurs: 0, inactifsNonPayeurs: 0, chiffreAffaires: 0 },
    voyageurs: { total: 0, actifsAbonnes: 0, nonAbonnes: 0, chiffreAffaires: 0 },
  });

  // États pour la création d'offre professionnelle
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [offerPhotoFile, setOfferPhotoFile] = useState<File | null>(null);
  const [offerPhotoPreview, setOfferPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [expandedCommentPubId, setExpandedCommentPubId] = useState<string | null>(null);

  // États pour la modification et suppression d'offre par l'agent
  const [editingPub, setEditingPub] = useState<ApiPublication | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingPubId, setDeletingPubId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // États pour la création directe d'un compte agence par l'administrateur
  const [showCreateAgencyModal, setShowCreateAgencyModal] = useState(false);
  const [agencyStructure, setAgencyStructure] = useState("");
  const [agencyNom, setAgencyNom] = useState("");
  const [agencyPrenom, setAgencyPrenom] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyTelephone, setAgencyTelephone] = useState("");
  const [agencyPassword, setAgencyPassword] = useState("");
  const [submittingAgency, setSubmittingAgency] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);
  const [createdAgencyCredentials, setCreatedAgencyCredentials] = useState<{
    structure: string;
    email: string;
    password: string;
    telephone: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Onglet principal pour le flux professionnel : Mes offres VS Réseau de la plateforme
  const [proFeedTab, setProFeedTab] = useState<"MES_OFFRES" | "RESEAU">("MES_OFFRES");
  // Filtre pour "Mes publications"
  const [pubFilter, setPubFilter] = useState<"TOUTES" | "EN_ATTENTE" | "APPROUVEES" | "REFUSEES">("TOUTES");

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfferError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"];
    const isVideo = file.type.startsWith("video/") || videoExtensions.some((ext) => lowerName.endsWith(ext));

    if (isVideo) {
      setOfferError("Les vidéos sont formellement refusées. Seules les photos aux formats JPG, JPEG, PNG ou WEBP sont autorisées.");
      e.target.value = "";
      setOfferPhotoFile(null);
      setOfferPhotoPreview(null);
      return;
    }

    const validImageExts = [".jpg", ".jpeg", ".png", ".webp"];
    const isImage = file.type.startsWith("image/") || validImageExts.some((ext) => lowerName.endsWith(ext));

    if (!isImage) {
      setOfferError("Seules les photos aux formats JPG, JPEG, PNG ou WEBP sont autorisées.");
      e.target.value = "";
      setOfferPhotoFile(null);
      setOfferPhotoPreview(null);
      return;
    }

    // RÈGLE : Photo de max 30 Mo
    const maxBytes = 30 * 1024 * 1024;
    if (file.size > maxBytes) {
      setOfferError("La photo dépasse la taille maximale autorisée de 30 Mo.");
      e.target.value = "";
      setOfferPhotoFile(null);
      setOfferPhotoPreview(null);
      return;
    }

    setOfferPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setOfferPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setOfferPhotoFile(null);
    setOfferPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setOfferError("Veuillez renseigner un titre et une description pour votre offre.");
      return;
    }
    try {
      setSubmittingOffer(true);
      setOfferError(null);

      let finalContent = newContent.trim();
      if (offerPhotoPreview) {
        finalContent = `${finalContent}\n\n[PHOTO:${offerPhotoPreview}]`;
      }

      const res = await publicationsApi.create({
        titre: newTitle.trim(),
        contenu: finalContent,
      });
      if (res.success && res.data?.publication) {
        setMyPubs((prev) => [res.data.publication, ...prev]);
        if (res.data.publication.statut === "APPROUVEE") {
          setPublicPublications((prev) => [res.data.publication, ...prev]);
        }
        setNewTitle("");
        setNewContent("");
        handleRemovePhoto();
        setShowCreateModal(false);
        const successMsg =
          user?.role === "ADMIN"
            ? "Votre offre a été publiée et mise en ligne avec succès sur Sylla Voyage."
            : "Votre offre a été soumise avec succès et est en attente de validation administrative.";
        setOfferSuccess(successMsg);
        setTimeout(() => setOfferSuccess(null), 6000);
      }
    } catch (err: any) {
      setOfferError(err?.message || "Une erreur est survenue lors de la création de l'offre.");
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"];
    const isVideo = file.type.startsWith("video/") || videoExtensions.some((ext) => lowerName.endsWith(ext));

    if (isVideo) {
      setEditError("Les vidéos sont formellement refusées. Seules les photos aux formats JPG, JPEG, PNG ou WEBP sont autorisées.");
      e.target.value = "";
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
      return;
    }

    const validImageExts = [".jpg", ".jpeg", ".png", ".webp"];
    const isImage = file.type.startsWith("image/") || validImageExts.some((ext) => lowerName.endsWith(ext));

    if (!isImage) {
      setEditError("Seules les photos aux formats JPG, JPEG, PNG ou WEBP sont autorisées.");
      e.target.value = "";
      return;
    }

    const maxBytes = 30 * 1024 * 1024;
    if (file.size > maxBytes) {
      setEditError("La photo dépasse la taille maximale autorisée de 30 Mo.");
      e.target.value = "";
      return;
    }

    setEditPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setEditPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditPhoto = () => {
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    if (editPhotoInputRef.current) {
      editPhotoInputRef.current.value = "";
    }
  };

  const handleOpenEditModal = (pub: ApiPublication) => {
    const parsed = parsePublicationContent(pub.contenu);
    setEditingPub(pub);
    setEditTitle(pub.titre);
    setEditContent(parsed.text);
    setEditPhotoPreview(parsed.photoUrl);
    setEditPhotoFile(null);
    setEditError(null);
  };

  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPub) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError("Veuillez renseigner un titre et une description pour votre offre.");
      return;
    }
    try {
      setSubmittingEdit(true);
      setEditError(null);

      let finalContent = editContent.trim();
      if (editPhotoPreview) {
        finalContent = `${finalContent}\n\n[PHOTO:${editPhotoPreview}]`;
      }

      const res = await publicationsApi.update(editingPub.id, {
        titre: editTitle.trim(),
        contenu: finalContent,
      });

      if (res.success && res.data?.publication) {
        setMyPubs((prev) =>
          prev.map((p) => (p.id === editingPub.id ? res.data.publication : p))
        );
        setEditingPub(null);
        setActionFeedback("Votre offre a été modifiée avec succès et est soumise à validation.");
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      setEditError(err?.message || "Erreur lors de la modification de l'offre.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteOffer = async (pub: ApiPublication) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement votre offre « ${pub.titre} » ? Cette action est irréversible.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingPubId(pub.id);
      const res = await publicationsApi.delete(pub.id);
      if (res.success) {
        setMyPubs((prev) => prev.filter((p) => p.id !== pub.id));
        setPublicPublications((prev) => prev.filter((p) => p.id !== pub.id));
        setActionFeedback(`L'offre « ${pub.titre} » a été supprimée avec succès.`);
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err?.message || "Impossible de supprimer cette publication.");
    } finally {
      setDeletingPubId(null);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pwd = "Sv!";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAgencyPassword(pwd);
  };

  const handleCopyCredentials = () => {
    if (!createdAgencyCredentials) return;
    const text = `Identifiants Sylla Voyage pour votre agence :\n\nStructure : ${createdAgencyCredentials.structure}\nEmail : ${createdAgencyCredentials.email}\nMot de passe : ${createdAgencyCredentials.password}\nTéléphone : ${createdAgencyCredentials.telephone}\nLien de connexion : ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyStructure.trim() || !agencyNom.trim() || !agencyEmail.trim() || !agencyTelephone.trim() || !agencyPassword.trim()) {
      setAgencyError("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    try {
      setSubmittingAgency(true);
      setAgencyError(null);

      const res = await adminApi.createProfessionalAccount({
        nom_structure: agencyStructure.trim(),
        nom: agencyNom.trim(),
        prenom: agencyPrenom.trim(),
        email: agencyEmail.trim(),
        telephone: agencyTelephone.trim(),
        mot_de_passe: agencyPassword.trim(),
      });

      if (res.success) {
        setCreatedAgencyCredentials({
          structure: agencyStructure.trim(),
          email: agencyEmail.trim(),
          password: agencyPassword.trim(),
          telephone: agencyTelephone.trim(),
        });
        setAgencyStructure("");
        setAgencyNom("");
        setAgencyPrenom("");
        setAgencyEmail("");
        setAgencyTelephone("");
        setAgencyPassword("");
      }
    } catch (err: any) {
      setAgencyError(err?.message || "Impossible de créer le compte agence.");
    } finally {
      setSubmittingAgency(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Récupérer l'abonnement actif pour tous
        const subRes = await subscriptionsApi.getMySubscription().catch(() => null);
        if (isMounted && subRes?.success && subRes.data?.subscription) {
          setActiveSubscription(subRes.data.subscription);
        }

        // Récupérer les messages
        const convRes = await conversationsApi.listConversations().catch(() => null);
        if (isMounted && convRes?.success && convRes.data?.conversations) {
          setConversations(convRes.data.conversations);
        }

        // Pour les professionnels : récupérer ses offres et celles de la plateforme si abonné
        if (user?.role === "PROFESSIONNEL") {
          const isSubActive = subRes?.data?.subscription?.statut === "ACTIF";
          const [verifRes, pubsRes, publicPubsRes] = await Promise.all([
            verificationApi.getMyVerificationState().catch(() => null),
            publicationsApi.listMine().catch(() => null),
            isSubActive ? publicationsApi.listPublic().catch(() => null) : Promise.resolve(null),
          ]);

          if (isMounted) {
            if (verifRes?.success && verifRes.data) {
              setVerificationData(verifRes.data);
            }
            if (pubsRes?.success && pubsRes.data?.publications) {
              setMyPubs(pubsRes.data.publications);
            }
            if (publicPubsRes?.success && publicPubsRes.data?.publications) {
              setPublicPublications(publicPubsRes.data.publications);
            }
          }
        }

        // Pour les voyageurs : récupérer les offres réelles publiées uniquement si abonné
        if (user?.role === "VOYAGEUR" && subRes?.data?.subscription?.statut === "ACTIF") {
          const pubsRes = await publicationsApi.listPublic().catch(() => null);
          if (isMounted && pubsRes?.success && pubsRes.data?.publications) {
            setPublicPublications(pubsRes.data.publications);
          }
        }

        // Pour les administrateurs : récupérer les données réelles en attente et financières
        if (user?.role === "ADMIN") {
          const [verifsRes, pubsRes, reportsRes, financialRes] = await Promise.all([
            adminApi.listVerifications().catch(() => null),
            adminApi.listPublications().catch(() => null),
            adminApi.listReports().catch(() => null),
            adminApi.getFinancialStats().catch(() => null),
          ]);
          if (isMounted) {
            const pendingVerifs = verifsRes?.success && verifsRes.data?.verifications
              ? verifsRes.data.verifications.filter((v: any) => (v.statut || "").toUpperCase() === "EN_ATTENTE").length
              : 0;
            const pendingPubs = pubsRes?.success && pubsRes.data?.publications
              ? pubsRes.data.publications.filter((p: any) => (p.statut || "").toUpperCase() === "EN_ATTENTE").length
              : 0;
            const pendingReports = reportsRes?.success && reportsRes.data?.reports
              ? reportsRes.data.reports.filter((r: any) => (r.statut || "").toUpperCase() === "EN_ATTENTE").length
              : 0;
            setAdminStats({
              pendingVerifications: pendingVerifs,
              pendingPublications: pendingPubs,
              pendingReports: pendingReports,
            });

            if (financialRes?.success && financialRes.data) {
              setFinancialStats(financialRes.data);
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  if (!user) {
    return null;
  }
  if (loading) {
    return (
      <div className="center-container">
        <LoadingSpinner message="Chargement de votre espace personnel..." size="large" />
      </div>
    );
  }

  const renderCreateOfferModal = () => {
    if (!showCreateModal) return null;
    const isAdmin = user?.role === "ADMIN";
    const rawStatus = (verificationData?.statut_verification || "EN_ATTENTE").toUpperCase();
    const isVerified = rawStatus === "VERIFIE" || rawStatus === "APPROUVEE" || rawStatus === "ACCEPTEE";
    const hasActiveSub = !!activeSubscription && activeSubscription.statut === "ACTIF";

    if (!isAdmin && (!isVerified || !hasActiveSub)) {
      return (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container pro-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", textAlign: "center", padding: "32px 24px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              color: "var(--color-danger, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <IconLock size={28} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>
              Publication non disponible
            </h3>
            <p style={{ color: "var(--color-text-muted, #64748b)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "20px" }}>
              {!isVerified
                ? "Votre compte professionnel est actuellement en cours de vérification. Vous pourrez publier des offres dès que votre dossier aura été approuvé par notre équipe."
                : "Un abonnement professionnel actif est requis pour créer et publier des offres de voyage."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                Fermer
              </button>
              {!hasActiveSub ? (
                <Link to="/subscriptions" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                  <IconCreditCard size={16} />
                  <span>Activer mon abonnement</span>
                </Link>
              ) : (
                <Link to="/profile" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                  <span>Consulter mon dossier</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const recentPubs = myPubs
      .filter((p) => {
        const pubTime = new Date(p.date_creation).getTime();
        return !isNaN(pubTime) && nowMs - pubTime <= sevenDaysMs;
      })
      .sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());

    if (!isAdmin && recentPubs.length >= 2) {
      const oldestInWindowMs = new Date(recentPubs[0].date_creation).getTime();
      const nextDate = new Date(oldestInWindowMs + sevenDaysMs);
      const nextAvailableDate = nextDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container pro-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", textAlign: "center", padding: "32px 24px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.1)",
              color: "var(--color-warning, #f59e0b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <IconClock size={28} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>
              Quota hebdomadaire atteint
            </h3>
            <p style={{ color: "var(--color-text-muted, #64748b)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Vous avez déjà publié 2 offres au cours des 7 derniers jours. Selon les règles de la plateforme, le quota maximal est de 2 publications par semaine glissante.
              {nextAvailableDate ? ` Vous pourrez à nouveau publier à partir du ${nextAvailableDate}.` : ""}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
              Compris
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-backdrop" onClick={() => !submittingOffer && setShowCreateModal(false)}>
        <div className="modal-container pro-create-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3 className="modal-title">Publier une nouvelle offre</h3>
              <p className="modal-subtitle">
                {isAdmin
                  ? "Votre offre sera directement mise en ligne et visible par tous les utilisateurs."
                  : "Votre offre sera soumise à l'administration pour validation avant diffusion publique."}
              </p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => !submittingOffer && setShowCreateModal(false)}
              aria-label="Fermer"
            >
              <IconX size={20} />
            </button>
          </div>

          {offerError && (
            <div className="pro-form-alert-error" role="alert">
              <IconAlertTriangle size={18} />
              <span>{offerError}</span>
            </div>
          )}

          <form onSubmit={handleCreateOffer} className="pro-create-form">
            <div className="form-group">
              <label htmlFor="offer-titre" className="form-label">
                Titre de l'offre *
              </label>
              <input
                id="offer-titre"
                type="text"
                className="form-input"
                placeholder="Ex: Circuit Découverte Sine Saloum — 3 jours"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                disabled={submittingOffer}
              />
            </div>

            <div className="form-group">
              <label htmlFor="offer-contenu" className="form-label">
                Description et détails de l'offre *
              </label>
              <textarea
                id="offer-contenu"
                className="form-textarea"
                rows={5}
                placeholder="Détaillez votre offre, le programme, les inclusions ou conditions..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                disabled={submittingOffer}
              />
            </div>

            {/* Photo de l'offre (Max 30 Mo) */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Photo de l'offre (optionnelle)</span>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Max 30 Mo</span>
              </label>

              <input
                type="file"
                ref={photoInputRef}
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
                id="offer-photo-input"
                disabled={submittingOffer}
              />

              {!offerPhotoPreview ? (
                <div
                  className="offer-photo-uploader"
                  onClick={() => !submittingOffer && photoInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      photoInputRef.current?.click();
                    }
                  }}
                  id="btn-upload-offer-photo"
                >
                  <IconImage size={24} className="offer-upload-icon" />
                  <div className="offer-upload-text">
                    <span className="offer-upload-main">Joindre une photo illustrative</span>
                    <span className="offer-upload-sub">Formats acceptés : JPG, JPEG, PNG, WEBP (jusqu'à 30 Mo)</span>
                  </div>
                  <span className="btn btn-outline btn-sm">
                    Parcourir
                  </span>
                </div>
              ) : (
                <div className="offer-photo-preview-card">
                  <img src={offerPhotoPreview} alt="Aperçu" className="offer-photo-preview-thumb" />
                  <div className="offer-photo-preview-details">
                    <span className="offer-photo-name">{offerPhotoFile?.name || "Photo de l'offre"}</span>
                    <span className="offer-photo-size">
                      {offerPhotoFile && (
                        offerPhotoFile.size / (1024 * 1024) >= 1
                          ? `${(offerPhotoFile.size / (1024 * 1024)).toFixed(2)} Mo`
                          : `${(offerPhotoFile.size / 1024).toFixed(0)} Ko`
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={handleRemovePhoto}
                    disabled={submittingOffer}
                    title="Retirer la photo"
                    aria-label="Retirer la photo"
                    id="btn-remove-offer-photo"
                  >
                    <IconX size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="pro-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submittingOffer}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingOffer || !newTitle.trim() || !newContent.trim()}
              >
                {submittingOffer ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>{isAdmin ? "Publication en cours..." : "Envoi en cours..."}</span>
                  </>
                ) : (
                  <>
                    <IconCheck size={16} />
                    <span>{isAdmin ? "Publier l'offre" : "Soumettre l'offre"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* ======================================================== */
  /* VUE ADMINISTRATEUR                                       */
  /* ======================================================== */
  if (user.role === "ADMIN") {
    const hasPendingActions =
      adminStats.pendingVerifications > 0 ||
      adminStats.pendingPublications > 0 ||
      adminStats.pendingReports > 0;

    return (
      <div className="dashboard-page admin-dashboard-page">
        <div className="container dashboard-container" style={{ maxWidth: "960px" }}>
          {/* Header */}
          <div className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 className="admin-title">Administration</h1>
              <p className="admin-subtitle">Contrôlez les activités de la plateforme.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setOfferError(null);
                  setShowCreateModal(true);
                }}
                id="btn-admin-publish-offer"
              >
                <IconPlus size={16} />
                <span>+ Publier une offre</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCreatedAgencyCredentials(null);
                  setAgencyError(null);
                  setShowCreateAgencyModal(true);
                }}
                id="btn-admin-create-agency"
              >
                <IconPlus size={16} />
                <span>+ Créer un compte agence</span>
              </button>
            </div>
          </div>

          {offerSuccess && (
            <div className="pro-form-alert-success" role="status" style={{ marginBottom: "20px" }}>
              <IconCheck size={18} />
              <span>{offerSuccess}</span>
            </div>
          )}

          {/* 3 Cases Financières : 1. CA total, 2. Agences & CA, 3. Voyageurs & CA */}
          <div className="admin-financial-grid">
            {/* Case 1 : Notre chiffre d'affaires total */}
            <div className="admin-financial-card card-primary" id="admin-stat-ca-total">
              <div className="admin-financial-top">
                <span className="admin-financial-label">Chiffre d'affaires total</span>
                <div className="admin-financial-icon-wrap">
                  <IconCreditCard size={20} />
                </div>
              </div>
              <div>
                <div className="admin-financial-main-val">
                  {formatFCFA(financialStats.chiffreAffairesTotal)}
                </div>
                <div className="admin-financial-sub">
                  <span>Total des paiements confirmés sur la plateforme</span>
                </div>
              </div>
            </div>

            {/* Case 2 : Nombre d'agences et chiffre d'affaires */}
            <div className="admin-financial-card" id="admin-stat-agences">
              <div className="admin-financial-top">
                <span className="admin-financial-label">Professionnels / Agences</span>
                <div className="admin-financial-icon-wrap">
                  <IconBuilding size={20} />
                </div>
              </div>
              <div>
                <div className="admin-financial-main-val">
                  {financialStats.agences.total} professionnel{financialStats.agences.total > 1 ? "s" : ""}
                </div>
                <div className="admin-financial-sub" style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    • En attente : <strong>{financialStats.agences.enAttente}</strong>
                  </span>
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>
                    • Actifs payeurs : <strong>{financialStats.agences.actifsPayeurs}</strong>
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    • Inactifs / non payeurs : <strong>{financialStats.agences.inactifsNonPayeurs}</strong>
                  </span>
                  <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ fontSize: "12px" }}>Chiffre d'affaires : </span>
                    <strong className="admin-financial-highlight">
                      {formatFCFA(financialStats.agences.chiffreAffaires)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 3 : Nombre de voyageurs et chiffre d'affaires */}
            <div className="admin-financial-card" id="admin-stat-voyageurs">
              <div className="admin-financial-top">
                <span className="admin-financial-label">Voyageurs inscrits</span>
                <div className="admin-financial-icon-wrap">
                  <IconUser size={20} />
                </div>
              </div>
              <div>
                <div className="admin-financial-main-val">
                  {financialStats.voyageurs.total} voyageur{financialStats.voyageurs.total > 1 ? "s" : ""}
                </div>
                <div className="admin-financial-sub" style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>
                    • Avec abonnement actif : <strong>{financialStats.voyageurs.actifsAbonnes}</strong>
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    • Sans abonnement actif : <strong>{financialStats.voyageurs.nonAbonnes}</strong>
                  </span>
                  <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ fontSize: "12px" }}>Chiffre d'affaires : </span>
                    <strong className="admin-financial-highlight">
                      {formatFCFA(financialStats.voyageurs.chiffreAffaires)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Blocs statistiques */}
          <div className="admin-stat-grid">
            <Link to="/admin/users" className="admin-stat-card">
              <div className="admin-stat-card-top">
                <span className="admin-stat-label">Utilisateurs & Agences</span>
                <IconUser size={18} className="admin-stat-icon" />
              </div>
              <div className="admin-stat-action">
                Gérer les comptes
              </div>
            </Link>

            <Link to="/admin/verifications" className="admin-stat-card">
              <div className="admin-stat-card-top">
                <span className="admin-stat-label">Vérifications</span>
                <IconShieldCheck size={18} className="admin-stat-icon" />
              </div>
              <div className="admin-stat-number">
                {adminStats.pendingVerifications} en attente
              </div>
            </Link>

            <Link to="/admin/publications" className="admin-stat-card">
              <div className="admin-stat-card-top">
                <span className="admin-stat-label">Publications</span>
                <IconFileText size={18} className="admin-stat-icon" />
              </div>
              <div className="admin-stat-number">
                {adminStats.pendingPublications} en attente
              </div>
            </Link>

            <Link to="/admin/reports" className="admin-stat-card">
              <div className="admin-stat-card-top">
                <span className="admin-stat-label">Signalements</span>
                <IconAlertTriangle size={18} className="admin-stat-icon" />
              </div>
              <div className="admin-stat-number">
                {adminStats.pendingReports} en attente
              </div>
            </Link>

            <Link to="/admin/audit-logs" className="admin-stat-card">
              <div className="admin-stat-card-top">
                <span className="admin-stat-label">Journal d'audit</span>
                <IconClock size={18} className="admin-stat-icon" />
              </div>
              <div className="admin-stat-action">
                Voir l'historique
              </div>
            </Link>
          </div>

          {/* Section À traiter */}
          <div className="admin-section">
            <h2 className="admin-section-title">À traiter</h2>
            {hasPendingActions ? (
              <div className="admin-triage-list">
                {adminStats.pendingVerifications > 0 && (
                  <div className="admin-triage-card">
                    <div className="admin-triage-info">
                      <strong className="admin-triage-name">Vérifications d'agences</strong>
                      <span className="admin-triage-count">
                        {adminStats.pendingVerifications} dossier{adminStats.pendingVerifications > 1 ? "s" : ""} en attente
                      </span>
                    </div>
                    <Link to="/admin/verifications" className="btn btn-primary btn-sm">
                      Gérer
                    </Link>
                  </div>
                )}

                {adminStats.pendingPublications > 0 && (
                  <div className="admin-triage-card">
                    <div className="admin-triage-info">
                      <strong className="admin-triage-name">Publications</strong>
                      <span className="admin-triage-count">
                        {adminStats.pendingPublications} offre{adminStats.pendingPublications > 1 ? "s" : ""} en attente
                      </span>
                    </div>
                    <Link to="/admin/publications" className="btn btn-primary btn-sm">
                      Modérer
                    </Link>
                  </div>
                )}

                {adminStats.pendingReports > 0 && (
                  <div className="admin-triage-card">
                    <div className="admin-triage-info">
                      <strong className="admin-triage-name">Signalements</strong>
                      <span className="admin-triage-count">
                        {adminStats.pendingReports} signalement{adminStats.pendingReports > 1 ? "s" : ""} en attente
                      </span>
                    </div>
                    <Link to="/admin/reports" className="btn btn-primary btn-sm">
                      Traiter
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="admin-empty-card">
                <IconCheck size={18} className="admin-empty-icon" />
                <span>Tout est à jour.</span>
              </div>
            )}
          </div>

          {/* Section Accès rapides */}
          <div className="admin-section">
            <h2 className="admin-section-title">Accès rapides</h2>
            <div className="admin-quick-links">
              <Link to="/professionals" className="admin-quick-btn">
                <IconBuilding size={16} />
                <span>Annuaire professionnels</span>
              </Link>
              <Link to="/publications" className="admin-quick-btn">
                <IconFileText size={16} />
                <span>Publications publiques</span>
              </Link>
              <Link to="/admin/audit-logs" className="admin-quick-btn">
                <IconClock size={16} />
                <span>Journal d'audit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* MODALE DE CRÉATION DE COMPTE AGENCE PAR L'ADMINISTRATEUR */}
        {showCreateAgencyModal && (
          <div className="modal-backdrop" onClick={() => !submittingAgency && setShowCreateAgencyModal(false)}>
            <div className="modal-container pro-create-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <h3 className="modal-title">Créer un compte agence</h3>
                  <p className="modal-subtitle">
                    L'agence sera immédiatement vérifiée et pourra se connecter dès réception de ses identifiants.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !submittingAgency && setShowCreateAgencyModal(false)}
                  aria-label="Fermer"
                >
                  <IconX size={20} />
                </button>
              </div>

              {createdAgencyCredentials ? (
                <div style={{ padding: "20px" }}>
                  <div className="pro-form-alert-success" style={{ margin: "0 0 20px" }}>
                    <IconCheck size={20} />
                    <span>Compte agence créé et activé avec succès !</span>
                  </div>

                  <p style={{ fontSize: "0.95rem", color: "#334155", margin: "0 0 16px", lineHeight: 1.5 }}>
                    Transmettez ces identifiants à l'agence pour qu'elle puisse se connecter immédiatement à son espace :
                  </p>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Structure :</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{createdAgencyCredentials.structure}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Email de connexion :</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0284c7" }}>{createdAgencyCredentials.email}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Mot de passe :</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                        {createdAgencyCredentials.password}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Téléphone :</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{createdAgencyCredentials.telephone}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCopyCredentials}
                      id="btn-copy-agency-credentials"
                    >
                      <IconCheck size={16} />
                      <span>{copiedCredentials ? "Copié !" : "Copier les identifiants"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowCreateAgencyModal(false)}
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateAgency} className="pro-create-form">
                  {agencyError && (
                    <div className="pro-form-alert-error" role="alert" style={{ margin: "16px 20px 0" }}>
                      <IconAlertTriangle size={18} />
                      <span>{agencyError}</span>
                    </div>
                  )}

                  <div style={{ padding: "20px 20px 0" }}>
                    <div className="form-group">
                      <label className="form-label">
                        Nom de l'agence (Structure) *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Dakar Travel Express"
                        value={agencyStructure}
                        onChange={(e) => setAgencyStructure(e.target.value)}
                        required
                        disabled={submittingAgency}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div className="form-group">
                        <label className="form-label">Nom du responsable *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Diop"
                          value={agencyNom}
                          onChange={(e) => setAgencyNom(e.target.value)}
                          required
                          disabled={submittingAgency}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Prénom (optionnel)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Fatou"
                          value={agencyPrenom}
                          onChange={(e) => setAgencyPrenom(e.target.value)}
                          disabled={submittingAgency}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email de connexion *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Ex: contact@dakartravel.sn"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        required
                        disabled={submittingAgency}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Téléphone *</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Ex: +221 77 123 45 67"
                        value={agencyTelephone}
                        onChange={(e) => setAgencyTelephone(e.target.value)}
                        required
                        disabled={submittingAgency}
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <label className="form-label" style={{ margin: 0 }}>Mot de passe initial *</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0284c7",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Générer un mot de passe
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Min 6 caractères (ex: Voyage2026!)"
                        value={agencyPassword}
                        onChange={(e) => setAgencyPassword(e.target.value)}
                        required
                        disabled={submittingAgency}
                      />
                    </div>
                  </div>

                  <div className="pro-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowCreateAgencyModal(false)}
                      disabled={submittingAgency}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingAgency || !agencyStructure.trim() || !agencyNom.trim() || !agencyEmail.trim() || !agencyTelephone.trim() || !agencyPassword.trim()}
                    >
                      {submittingAgency ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Création en cours...</span>
                        </>
                      ) : (
                        <>
                          <IconCheck size={16} />
                          <span>Créer le compte agence</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODALE DE CRÉATION D'OFFRE */}
        {renderCreateOfferModal()}
      </div>
    );
  }

  /* ======================================================== */
  /* VUE PROFESSIONNEL                                        */
  /* ======================================================== */
  if (user.role === "PROFESSIONNEL") {
    const rawStatus = (verificationData?.statut_verification || "EN_ATTENTE").toUpperCase();
    const isVerified = rawStatus === "VERIFIE" || rawStatus === "APPROUVEE" || rawStatus === "ACCEPTEE";
    const isPending = rawStatus === "EN_ATTENTE";
    const isRejected = rawStatus === "REJETEE" || rawStatus === "REJETE" || rawStatus === "REFUSEE";
    const isSuspended = rawStatus === "SUSPENDUE" || rawStatus === "SUSPENDU";

    // Récupérer le commentaire éventuel de rejet de la vérification
    const verificationComment = verificationData?.verifications?.[0]?.commentaire || null;

    let statusLabel = "EN COURS DE VÉRIFICATION";
    let statusPillClass = "status-pill status-en_attente";
    let statusMessage = "Votre dossier est en cours d'examen par notre équipe administrative.";
    let statusIcon = <IconClock size={14} />;

    if (isVerified) {
      statusLabel = "VERIFIÉ";
      statusPillClass = "status-pill status-actif";
      statusMessage = "Votre profil professionnel est vérifié.";
      statusIcon = <IconShieldCheck size={14} />;
    } else if (isPending) {
      statusLabel = "EN COURS DE VÉRIFICATION";
      statusPillClass = "status-pill status-en_attente";
      statusMessage = "Votre dossier est en cours d'examen par notre équipe administrative.";
      statusIcon = <IconClock size={14} />;
    } else if (isRejected) {
      statusLabel = "REFUSÉ";
      statusPillClass = "status-pill status-rejete";
      statusMessage = "Votre dossier n'a pas été approuvé.";
      statusIcon = <IconAlertTriangle size={14} />;
    } else if (isSuspended) {
      statusLabel = "SUSPENDU";
      statusPillClass = "status-pill status-danger";
      statusMessage = "Votre compte professionnel est actuellement suspendu.";
      statusIcon = <IconAlertTriangle size={14} />;
    }

    // Calcul du quota des 7 derniers jours glissants
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const recentPubs = myPubs
      .filter((p) => {
        const pubTime = new Date(p.date_creation).getTime();
        return !isNaN(pubTime) && nowMs - pubTime <= sevenDaysMs;
      })
      .sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());

    const recentPubsCount = recentPubs.length;
    const isQuotaFull = recentPubsCount >= 2;
    let nextAvailableDate: string | null = null;
    if (isQuotaFull && recentPubs[0]) {
      const oldestInWindowMs = new Date(recentPubs[0].date_creation).getTime();
      const nextDate = new Date(oldestInWindowMs + sevenDaysMs);
      nextAvailableDate = nextDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // A. Indicateurs d'activité réels
    const totalPubs = myPubs.length;
    const approvedPubs = myPubs.filter(
      (p) => (p.statut || "").toUpperCase() === "APPROUVEE" || (p.statut || "").toUpperCase() === "APPROUVE"
    );
    const pendingPubs = myPubs.filter(
      (p) => (p.statut || "").toUpperCase() === "EN_ATTENTE"
    );
    const rejectedPubs = myPubs.filter(
      (p) => ["REJETEE", "REJETE", "REFUSEE", "REFUSE"].includes((p.statut || "").toUpperCase())
    );
    const totalMessages = conversations.length;

    // B. Éléments du bloc "À TRAITER"
    const aTraiterItems: {
      id: string;
      type: "danger" | "warning" | "info";
      titre: string;
      description: string;
      actionText: string;
      onClick?: () => void;
      to?: string;
    }[] = [];

    if (rejectedPubs.length > 0) {
      aTraiterItems.push({
        id: "rejected-pubs",
        type: "danger",
        titre: `${rejectedPubs.length} publication${rejectedPubs.length > 1 ? "s" : ""} refusée${rejectedPubs.length > 1 ? "s" : ""}`,
        description: "L'administration a émis un motif de refus. Veuillez consulter les remarques pour ajuster.",
        actionText: "Voir les refus",
        onClick: () => {
          setPubFilter("REFUSEES");
          document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
        },
      });
    }

    if (pendingPubs.length > 0) {
      aTraiterItems.push({
        id: "pending-pubs",
        type: "warning",
        titre: `${pendingPubs.length} publication${pendingPubs.length > 1 ? "s" : ""} en attente de validation`,
        description: "En cours d'examen administratif avant mise en ligne officielle.",
        actionText: "Voir en attente",
        onClick: () => {
          setPubFilter("EN_ATTENTE");
          document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
        },
      });
    }

    if (isPending) {
      aTraiterItems.push({
        id: "verif-pending",
        type: "warning",
        titre: "Compte en cours de vérification",
        description: "Votre dossier professionnel est en cours d'examen par notre équipe administrative.",
        actionText: "Consulter mon dossier",
        to: "/profile",
      });
    }

    if (!activeSubscription) {
      aTraiterItems.push({
        id: "no-sub",
        type: "warning",
        titre: "Abonnement professionnel non actif",
        description: "Activez votre formule pour publier des offres et échanger sans interruption.",
        actionText: "Activer mon abonnement",
        to: "/subscriptions",
      });
    }

    if (totalMessages > 0) {
      aTraiterItems.push({
        id: "messages-active",
        type: "info",
        titre: `${totalMessages} conversation${totalMessages > 1 ? "s" : ""} avec des voyageurs`,
        description: "Des voyageurs sont en relation avec votre agence.",
        actionText: "Ouvrir les messages",
        to: "/messages",
      });
    }

    if (isRejected && verificationComment) {
      aTraiterItems.push({
        id: "verif-rejected",
        type: "danger",
        titre: "Dossier d'inscription refusé",
        description: `Motif : ${verificationComment}`,
        actionText: "Modifier mon dossier",
        to: "/profile",
      });
    }

    // C. Filtrage des publications
    const filteredPubs = myPubs.filter((pub) => {
      const s = (pub.statut || "").toUpperCase();
      if (pubFilter === "EN_ATTENTE") return s === "EN_ATTENTE";
      if (pubFilter === "APPROUVEES") return s === "APPROUVEE" || s === "APPROUVE";
      if (pubFilter === "REFUSEES") return ["REJETEE", "REJETE", "REFUSEE", "REFUSE"].includes(s);
      return true;
    });

    return (
      <div className="dashboard-page">
        <div className="container dashboard-container">
          {/* Notification temporaire d'offre soumise */}
          {offerSuccess && (
            <div className="pro-alert-success" role="alert">
              <IconCheck size={18} />
              <span>{offerSuccess}</span>
            </div>
          )}

          {actionFeedback && (
            <div className="pro-alert-success" role="alert">
              <IconCheck size={18} />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* D. ACTION PRINCIPALE & EN-TÊTE */}
          <div className="pro-dashboard-header">
            <div className="pro-dashboard-title-wrap">
              <span className="pro-category-tag">Espace Professionnel</span>
              <h1 className="pro-dashboard-title">
                Tableau de bord — {user.nom}
              </h1>
            </div>

            {/* ACTION PRINCIPALE : + Publier une offre */}
            <div className="pro-primary-action-wrap">
              <button
                type="button"
                className="btn btn-primary btn-lg pro-publish-btn"
                id="btn-publish-offer"
                onClick={() => {
                  setOfferError(null);
                  setShowCreateModal(true);
                }}
              >
                <IconPlus size={18} />
                <span>+ Publier une offre</span>
              </button>
            </div>
          </div>

          {/* A. INDICATEURS D'ACTIVITÉ */}
          <section className="pro-indicators-section" aria-label="Indicateurs d'activité">
            <div className="pro-indicators-grid">
              {/* Total Publications */}
              <button
                type="button"
                className={`pro-kpi-card ${pubFilter === "TOUTES" ? "pro-kpi-card-active" : ""}`}
                onClick={() => {
                  setPubFilter("TOUTES");
                  document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                id="kpi-total-pubs"
              >
                <span className="pro-kpi-label">Publications</span>
                <span className="pro-kpi-value">{totalPubs}</span>
                <span className="pro-kpi-hint">Toutes vos offres</span>
              </button>

              {/* Approuvées */}
              <button
                type="button"
                className={`pro-kpi-card pro-kpi-approved ${pubFilter === "APPROUVEES" ? "pro-kpi-card-active" : ""}`}
                onClick={() => {
                  setPubFilter("APPROUVEES");
                  document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                id="kpi-approved-pubs"
              >
                <span className="pro-kpi-label">Approuvées</span>
                <span className="pro-kpi-value pro-val-approved">{approvedPubs.length}</span>
                <span className="pro-kpi-hint">Visibles en ligne</span>
              </button>

              {/* En attente */}
              <button
                type="button"
                className={`pro-kpi-card pro-kpi-pending ${pubFilter === "EN_ATTENTE" ? "pro-kpi-card-active" : ""}`}
                onClick={() => {
                  setPubFilter("EN_ATTENTE");
                  document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                id="kpi-pending-pubs"
              >
                <span className="pro-kpi-label">En attente</span>
                <span className="pro-kpi-value pro-val-pending">{pendingPubs.length}</span>
                <span className="pro-kpi-hint">Examen en cours</span>
              </button>

              {/* Refusées */}
              <button
                type="button"
                className={`pro-kpi-card pro-kpi-rejected ${pubFilter === "REFUSEES" ? "pro-kpi-card-active" : ""}`}
                onClick={() => {
                  setPubFilter("REFUSEES");
                  document.getElementById("mes-publications-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                id="kpi-rejected-pubs"
              >
                <span className="pro-kpi-label">Refusées</span>
                <span className="pro-kpi-value pro-val-rejected">{rejectedPubs.length}</span>
                <span className="pro-kpi-hint">À corriger</span>
              </button>

              {/* Messages */}
              <Link to="/messages" className="pro-kpi-card pro-kpi-messages" id="kpi-messages">
                <span className="pro-kpi-label">Messages</span>
                <span className="pro-kpi-value pro-val-messages">{totalMessages}</span>
                <span className="pro-kpi-hint">Conversations actives</span>
              </Link>
            </div>
          </section>

          {/* B. BLOC "À TRAITER" */}
          <section className="pro-section pro-triage-section" aria-label="Éléments à traiter">
            <div className="pro-triage-header">
              <div className="pro-triage-title-group">
                <h2 className="pro-triage-title">À traiter</h2>
                <span className="pro-triage-subtitle">Ce qui nécessite votre attention</span>
              </div>
              {aTraiterItems.length > 0 && (
                <span className="pro-triage-badge">{aTraiterItems.length} action{aTraiterItems.length > 1 ? "s" : ""}</span>
              )}
            </div>

            {aTraiterItems.length === 0 ? (
              <div className="pro-triage-clean">
                <IconCheck size={20} className="pro-triage-clean-icon" />
                <span className="pro-triage-clean-text">Tout est à jour.</span>
              </div>
            ) : (
              <div className="pro-triage-list">
                {aTraiterItems.map((item) => (
                  <div key={item.id} className={`pro-triage-item pro-triage-${item.type}`}>
                    <div className="pro-triage-item-content">
                      <h3 className="pro-triage-item-title">{item.titre}</h3>
                      <p className="pro-triage-item-desc">{item.description}</p>
                    </div>
                    <div className="pro-triage-item-action">
                      {item.onClick ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm pro-triage-btn"
                          onClick={item.onClick}
                        >
                          <span>{item.actionText}</span>
                          <IconArrowRight size={13} />
                        </button>
                      ) : item.to ? (
                        <Link to={item.to} className="btn btn-outline btn-sm pro-triage-btn">
                          <span>{item.actionText}</span>
                          <IconArrowRight size={13} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* C. SECTION PUBLICATIONS & NOUVEAUX DOSSIERS */}
          <section className="pro-section pro-publications-section" id="mes-publications-section">
            {/* Barre de navigation principale : Mes dossiers VS Réseau de la plateforme */}
            <div className="pro-publications-nav-bar">
              <div className="pro-publications-feed-tabs" role="tablist" aria-label="Sélection du flux">
                <button
                  type="button"
                  role="tab"
                  aria-selected={proFeedTab === "MES_OFFRES"}
                  className={`pro-feed-tab ${proFeedTab === "MES_OFFRES" ? "active" : ""}`}
                  onClick={() => setProFeedTab("MES_OFFRES")}
                  id="tab-feed-mine"
                >
                  <IconFileText size={16} />
                  <span>Mes offres ({totalPubs})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={proFeedTab === "RESEAU"}
                  className={`pro-feed-tab ${proFeedTab === "RESEAU" ? "active" : ""}`}
                  onClick={() => setProFeedTab("RESEAU")}
                  id="tab-feed-network"
                >
                  <IconBuilding size={16} />
                  <span>Nouveaux dossiers de la plateforme ({publicPublications.length})</span>
                </button>
              </div>

              {/* Bouton Exporter en CSV */}
              <div className="pro-export-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm pro-export-csv-btn"
                  onClick={() => {
                    if (proFeedTab === "MES_OFFRES") {
                      exportPublicationsToCSV(filteredPubs, "mes-publications-agence");
                    } else {
                      exportPublicationsToCSV(publicPublications, "dossiers-plateforme-sylla-voyage");
                    }
                  }}
                  title="Exporter la liste affichée en fichier CSV (compatible Excel et Numbers)"
                  id="btn-export-csv"
                >
                  <IconDownload size={15} />
                  <span>Exporter en CSV</span>
                </button>
              </div>
            </div>

            {/* VUE 1 : MES OFFRES / MES PUBLICATIONS */}
            {proFeedTab === "MES_OFFRES" && (
              <>
                <div className="pro-section-header">
                  <div className="pro-section-header-left">
                    <h2 className="pro-section-title">Mes publications</h2>
                    <span className="pro-section-badge">
                      {filteredPubs.length} / {totalPubs}
                    </span>
                  </div>

                  {/* Filtre simple : Toutes | En attente | Approuvées | Refusées */}
                  <div className="pro-filter-tabs" role="tablist" aria-label="Filtres de publications">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pubFilter === "TOUTES"}
                      className={`pro-filter-tab ${pubFilter === "TOUTES" ? "active" : ""}`}
                      onClick={() => setPubFilter("TOUTES")}
                      id="tab-pubs-all"
                    >
                      Toutes ({totalPubs})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pubFilter === "EN_ATTENTE"}
                      className={`pro-filter-tab ${pubFilter === "EN_ATTENTE" ? "active" : ""}`}
                      onClick={() => setPubFilter("EN_ATTENTE")}
                      id="tab-pubs-pending"
                    >
                      En attente ({pendingPubs.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pubFilter === "APPROUVEES"}
                      className={`pro-filter-tab ${pubFilter === "APPROUVEES" ? "active" : ""}`}
                      onClick={() => setPubFilter("APPROUVEES")}
                      id="tab-pubs-approved"
                    >
                      Approuvées ({approvedPubs.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={pubFilter === "REFUSEES"}
                      className={`pro-filter-tab ${pubFilter === "REFUSEES" ? "active" : ""}`}
                      onClick={() => setPubFilter("REFUSEES")}
                      id="tab-pubs-rejected"
                    >
                      Refusées ({rejectedPubs.length})
                    </button>
                  </div>
                </div>

                {filteredPubs.length === 0 ? (
                  <div className="pro-empty-pubs-card">
                    <div className="empty-icon-wrap">
                      <IconFileText size={32} />
                    </div>
                    <h3 className="empty-title">
                      {totalPubs === 0
                        ? "Aucune publication pour le moment"
                        : "Aucune publication dans cette catégorie"}
                    </h3>
                    <p className="empty-desc">
                      {totalPubs === 0
                        ? "Vous n'avez pas encore publié d'offre. Cliquez sur « + Publier une offre » pour commencer."
                        : "Aucune offre ne correspond au filtre sélectionné."}
                    </p>
                    {totalPubs === 0 ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <IconPlus size={15} />
                        <span>+ Publier une offre</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setPubFilter("TOUTES")}
                      >
                        <span>Afficher toutes les publications</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pro-pubs-list">
                    {filteredPubs.map((pub) => {
                      const s = (pub.statut || "").toUpperCase();
                      let pubStatusClass = "status-pill status-en_attente";
                      let pubStatusLabel = "EN ATTENTE";
                      let pubStatusIcon = <IconClock size={12} />;

                      if (s === "APPROUVEE" || s === "APPROUVE") {
                        pubStatusClass = "status-pill status-actif";
                        pubStatusLabel = "APPROUVÉE";
                        pubStatusIcon = <IconCheck size={12} />;
                      } else if (s === "REJETEE" || s === "REJETE" || s === "REFUSEE" || s === "REFUSE") {
                        pubStatusClass = "status-pill status-rejete";
                        pubStatusLabel = "REFUSÉE";
                        pubStatusIcon = <IconAlertTriangle size={12} />;
                      }

                      const pubDate = pub.date_publication || pub.date_creation;
                      const formattedDate = pubDate
                        ? new Date(pubDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null;

                      const hasRejectionNote = Boolean(
                        (s === "REJETEE" || s === "REJETE" || s === "REFUSEE" || s === "REFUSE") &&
                        (pub.commentaire_moderation || pub.commentaire)
                      );
                      const isExpanded = expandedCommentPubId === pub.id;
                      const rejectionNote = pub.commentaire_moderation || pub.commentaire;

                      const parsed = parsePublicationContent(pub.contenu);

                      return (
                        <article key={pub.id} className="pro-pub-card" id={`pro-pub-${pub.id}`}>
                          <div className="pro-pub-card-header">
                            <div className="pro-pub-title-col">
                              <span className={pubStatusClass}>
                                {pubStatusIcon}
                                <span>{pubStatusLabel}</span>
                              </span>
                              <h3 className="pro-pub-title">{pub.titre}</h3>
                            </div>
                            {formattedDate && (
                              <span className="pro-pub-date">
                                <IconCalendar size={13} />
                                <span>{formattedDate}</span>
                              </span>
                            )}
                          </div>

                          {parsed.photoUrl && (
                            <div className="pro-pub-media">
                              <img src={parsed.photoUrl} alt={pub.titre} className="pro-pub-img" />
                            </div>
                          )}

                          <p className="pro-pub-excerpt">{parsed.text}</p>

                          {/* Interactions (likes et commentaires) pour ses propres offres */}
                          <PublicationInteractions publicationId={pub.id} compact />

                          {/* Actions de gestion : Modifier & Supprimer UNIQUEMENT sur ses propres offres */}
                          <div className="pro-pub-actions-row">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEditModal(pub)}
                              id={`btn-edit-pub-${pub.id}`}
                              title="Modifier cette offre"
                            >
                              <IconEdit size={14} />
                              <span>Modifier</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm btn-danger-outline"
                              onClick={() => handleDeleteOffer(pub)}
                              disabled={deletingPubId === pub.id}
                              id={`btn-delete-pub-${pub.id}`}
                              title="Supprimer cette offre"
                            >
                              <IconTrash size={14} />
                              <span>{deletingPubId === pub.id ? "Suppression..." : "Supprimer"}</span>
                            </button>
                          </div>

                          {hasRejectionNote && (
                            <div className="pro-pub-rejection-zone">
                              <button
                                type="button"
                                className="pro-toggle-reason-btn"
                                onClick={() =>
                                  setExpandedCommentPubId(isExpanded ? null : pub.id)
                                }
                              >
                                <IconAlertTriangle size={13} />
                                <span>{isExpanded ? "Masquer le motif" : "Voir le motif de refus"}</span>
                              </button>
                              {isExpanded && (
                                <div className="pro-rejection-detail">
                                  <strong>Motif de l'administration :</strong> {rejectionNote}
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* VUE 2 : NOUVEAUX DOSSIERS DE LA PLATEFORME (FLUX COMMUNAUTAIRE) */}
            {proFeedTab === "RESEAU" && (
              <div className="pro-network-feed-container">
                <div className="pro-network-feed-intro">
                  <h3 className="pro-network-title">Dossiers & Opportunités du réseau</h3>
                  <p className="pro-network-desc">
                    Consultez toutes les publications et dossiers partagés par les agences et guides certifiés sur Sylla Voyage. Vous pouvez aimer et commenter chaque publication comme l'ensemble des membres.
                  </p>
                </div>

                {publicPublications.length === 0 ? (
                  <div className="pro-empty-pubs-card">
                    <div className="empty-icon-wrap">
                      <IconFileText size={32} />
                    </div>
                    <h3 className="empty-title">Aucun dossier public pour le moment</h3>
                    <p className="empty-desc">
                      Les dossiers et offres validés sur la plateforme apparaîtront ici dès leur mise en ligne.
                    </p>
                  </div>
                ) : (
                  <div className="pro-pubs-list">
                    {publicPublications.map((pub) => {
                      const authorName = pub.professionnel?.nom_structure || "Agence Sylla Voyage";
                      const pubDate = pub.date_publication || pub.date_creation;
                      const formattedDate = pubDate
                        ? new Date(pubDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null;

                      const parsed = parsePublicationContent(pub.contenu);

                      return (
                        <article key={pub.id} className="pro-pub-card pro-network-card" id={`network-pub-${pub.id}`}>
                          <div className="pro-pub-card-header">
                            <div className="pro-pub-title-col">
                              <div className="pro-network-author-row">
                                <span className="pro-network-author-badge">
                                  <IconBuilding size={14} />
                                  <strong>{authorName}</strong>
                                </span>
                                <span className="offer-verified-badge">
                                  <IconShieldCheck size={12} />
                                  <span>Vérifié</span>
                                </span>
                              </div>
                              <h3 className="pro-pub-title">{pub.titre}</h3>
                            </div>
                            {formattedDate && (
                              <span className="pro-pub-date">
                                <IconCalendar size={13} />
                                <span>{formattedDate}</span>
                              </span>
                            )}
                          </div>

                          {parsed.photoUrl && (
                            <div className="pro-pub-media">
                              <img src={parsed.photoUrl} alt={pub.titre} className="pro-pub-img" />
                            </div>
                          )}

                          <p className="pro-pub-excerpt">{parsed.text}</p>

                          {/* INTERACTIONS : AIMER ET COMMENTER */}
                          <PublicationInteractions publicationId={pub.id} compact />

                          <div className="pro-network-card-actions">
                            <Link to={`/publications/${pub.id}`} className="btn btn-outline btn-sm">
                              <span>Consulter le dossier complet</span>
                              <IconArrowRight size={13} />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 4. CARTES D'ACTIVITÉ : QUOTA, ABONNEMENT, MESSAGES, MON AGENCE */}
          <div className="pro-secondary-grid">
            {/* QUOTA */}
            <div className="pro-compact-card">
              <div className="pro-compact-card-header">
                <div className="pro-card-icon-bubble">
                  <IconFileText size={18} />
                </div>
                <span className="pro-compact-title">PUBLICATIONS</span>
              </div>
              <div className="pro-quota-metric">
                <span className="pro-quota-value">{recentPubsCount} / 2</span>
                <span className="pro-quota-subtext">sur les 7 derniers jours</span>
              </div>
              {isQuotaFull && nextAvailableDate ? (
                <div className="pro-quota-note pro-quota-warning">
                  <IconClock size={13} />
                  <span>Prochaine publication disponible : {nextAvailableDate}</span>
                </div>
              ) : (
                <div className="pro-quota-note pro-quota-ok">
                  <IconCheck size={13} />
                  <span>{2 - recentPubsCount} publication(s) restante(s)</span>
                </div>
              )}
            </div>

            {/* ABONNEMENT */}
            <div className="pro-compact-card">
              <div className="pro-compact-card-header">
                <div className="pro-card-icon-bubble">
                  <IconCreditCard size={18} />
                </div>
                <span className="pro-compact-title">ABONNEMENT</span>
              </div>
              <div className="pro-compact-desc">
                {activeSubscription ? (
                  <>
                    Formule active jusqu'au{" "}
                    <strong>
                      {new Date(activeSubscription.date_fin).toLocaleDateString("fr-FR")}
                    </strong>
                  </>
                ) : (
                  "Aucun abonnement professionnel actif en cours."
                )}
              </div>
              <Link to="/subscriptions" className="btn btn-outline btn-sm btn-block pro-card-btn">
                <span>{activeSubscription ? "Gérer l'abonnement" : "Souscrire"}</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            {/* STATUT DE VÉRIFICATION */}
            <div className="pro-compact-card">
              <div className="pro-compact-card-header">
                <div className="pro-card-icon-bubble">
                  {statusIcon}
                </div>
                <span className="pro-compact-title">VÉRIFICATION</span>
              </div>
              <div className="pro-compact-desc">
                <div style={{ marginBottom: "6px" }}>
                  <span className={statusPillClass}>
                    {statusIcon}
                    <span>{statusLabel}</span>
                  </span>
                </div>
                <span>{statusMessage}</span>
              </div>
              <Link to="/profile" className="btn btn-outline btn-sm btn-block pro-card-btn">
                <span>Dossier professionnel</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            {/* MON AGENCE */}
            <div className="pro-compact-card">
              <div className="pro-compact-card-header">
                <div className="pro-card-icon-bubble">
                  <IconBuilding size={18} />
                </div>
                <span className="pro-compact-title">MON AGENCE</span>
              </div>
              <div className="pro-compact-desc">
                Coordonnées, informations professionnelles et justificatifs légaux.
              </div>
              <Link to="/profile" className="btn btn-outline btn-sm btn-block pro-card-btn">
                <span>Voir mon profil</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* MODALE DE CRÉATION DE PUBLICATION */}
        {renderCreateOfferModal()}

        {/* MODALE DE MODIFICATION D'UNE PUBLICATION (AUTEUR UNIQUEMENT) */}
        {editingPub && (
          <div className="modal-backdrop" onClick={() => !submittingEdit && setEditingPub(null)}>
            <div className="modal-container pro-create-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <h3 className="modal-title">Modifier votre offre</h3>
                  <p className="modal-subtitle">
                    Modifiez le contenu ou la photo de votre offre. Elle sera réexaminée par l'administration.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !submittingEdit && setEditingPub(null)}
                  aria-label="Fermer"
                >
                  <IconX size={20} />
                </button>
              </div>

              {editError && (
                <div className="pro-form-alert-error" role="alert">
                  <IconAlertTriangle size={18} />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateOffer} className="pro-create-form">
                <div className="form-group">
                  <label htmlFor="edit-offer-titre" className="form-label">
                    Titre de l'offre *
                  </label>
                  <input
                    id="edit-offer-titre"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Circuit Découverte Sine Saloum — 3 jours"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    disabled={submittingEdit}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-offer-contenu" className="form-label">
                    Description et détails de l'offre *
                  </label>
                  <textarea
                    id="edit-offer-contenu"
                    className="form-textarea"
                    rows={5}
                    placeholder="Détaillez votre offre, le programme, les inclusions ou conditions..."
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                    disabled={submittingEdit}
                  />
                </div>

                {/* Photo de l'offre modifiée (Max 30 Mo) */}
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Photo de l'offre</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Max 30 Mo</span>
                  </label>

                  <input
                    type="file"
                    ref={editPhotoInputRef}
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleEditPhotoSelect}
                    style={{ display: "none" }}
                    id="edit-offer-photo-input"
                    disabled={submittingEdit}
                  />

                  {!editPhotoPreview ? (
                    <div
                      className="offer-photo-uploader"
                      onClick={() => !submittingEdit && editPhotoInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          editPhotoInputRef.current?.click();
                        }
                      }}
                      id="btn-upload-edit-offer-photo"
                    >
                      <IconImage size={24} className="offer-upload-icon" />
                      <div className="offer-upload-text">
                        <span className="offer-upload-main">Ajouter une photo</span>
                        <span className="offer-upload-sub">Formats acceptés : JPG, JPEG, PNG, WEBP (jusqu'à 30 Mo)</span>
                      </div>
                      <span className="btn btn-outline btn-sm">
                        Parcourir
                      </span>
                    </div>
                  ) : (
                    <div className="offer-photo-preview-card">
                      <img src={editPhotoPreview} alt="Aperçu" className="offer-photo-preview-thumb" />
                      <div className="offer-photo-preview-details">
                        <span className="offer-photo-name">{editPhotoFile?.name || "Photo actuelle de l'offre"}</span>
                        <span className="offer-photo-size">
                          {editPhotoFile ? (
                            editPhotoFile.size / (1024 * 1024) >= 1
                              ? `${(editPhotoFile.size / (1024 * 1024)).toFixed(2)} Mo`
                              : `${(editPhotoFile.size / 1024).toFixed(0)} Ko`
                          ) : (
                            "Photo enregistrée"
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={handleRemoveEditPhoto}
                        disabled={submittingEdit}
                        title="Retirer la photo"
                        aria-label="Retirer la photo"
                        id="btn-remove-edit-offer-photo"
                      >
                        <IconX size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pro-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditingPub(null)}
                    disabled={submittingEdit}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingEdit || !editTitle.trim() || !editContent.trim()}
                  >
                    {submittingEdit ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={16} />
                        <span>Enregistrer les modifications</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ======================================================== */
  /* VUE VOYAGEUR                                             */
  /* ======================================================== */
  return (
    <div className="dashboard-page">
      <div className="container dashboard-container">
        {/* 1. En-tête simple */}
        <div className="traveler-header">
          <div>
            <h1 className="traveler-title">Bonjour, {user.prenom || user.nom}</h1>
            <p className="traveler-subtitle">
              Découvrez les offres et opportunités proposées par nos professionnels.
            </p>
          </div>
          {activeSubscription?.statut === "ACTIF" && (
            <div className="traveler-sub-status-badge">
              <span className="status-pill status-actif">
                <IconCheck size={12} /> Abonnement actif
              </span>
            </div>
          )}
          {activeSubscription?.statut === "EN_ATTENTE" && (
            <div className="traveler-sub-status-badge">
              <span className="status-pill status-en_attente" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706", padding: "6px 12px", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconClock size={12} /> Paiement en attente de confirmation
              </span>
            </div>
          )}
        </div>

        {/* Statut d'abonnement / Section principale */}
        {activeSubscription?.statut !== "ACTIF" ? (
          <div
            className="traveler-locked-card"
            style={{
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "32px auto",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                color: "var(--color-primary, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <IconLock size={28} />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", color: "var(--color-text, #1e293b)" }}>
              Offres & opportunités réservées aux abonnés
            </h2>
            <p
              style={{
                color: "var(--color-text-muted, #64748b)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              Pour consulter les circuits, séjours et opportunités exclusifs proposés par nos agences partenaires vérifiées, activez votre abonnement Voyageur.
            </p>
            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text, #1e293b)" }}>5 000 FCFA</span>
              <span style={{ color: "var(--color-text-muted, #64748b)", fontSize: "0.9rem" }}> / mois</span>
            </div>
            <Link
              to="/subscriptions"
              className="btn btn-primary btn-lg"
              id="traveler-activate-sub-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <IconCreditCard size={18} />
              <span>Activer mon abonnement</span>
            </Link>
          </div>
        ) : (
          /* 2. Section principale : Offres disponibles si abonné */
          <div className="traveler-offers-section">
            <div className="traveler-section-header">
              <h2 className="traveler-section-title">Offres disponibles</h2>
              {publicPublications.length > 0 && (
                <span className="traveler-offers-count">
                  {publicPublications.length} offre{publicPublications.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {publicPublications.length === 0 ? (
              <div className="traveler-empty-card">
                <div className="empty-icon-wrap">
                  <IconFileText size={32} />
                </div>
                <h3 className="empty-title">Aucune offre disponible pour le moment</h3>
                <p className="empty-desc">
                  Les agences vérifiées et nos partenaires publieront prochainement leurs offres et opportunités de voyage.
                </p>
              </div>
            ) : (
              <div className="traveler-offers-grid">
                {publicPublications.map((pub) => {
                  const displayDate = pub.date_publication || pub.date_creation;
                  const formattedDate = displayDate
                    ? new Date(displayDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  const authorName = pub.professionnel?.nom_structure || "Sylla Voyage";
                  const parsed = parsePublicationContent(pub.contenu);

                  return (
                    <article key={pub.id} className="traveler-offer-card" id={`offer-card-${pub.id}`}>
                      {parsed.photoUrl && (
                        <div className="traveler-offer-media">
                          <img src={parsed.photoUrl} alt={pub.titre} className="traveler-offer-img" />
                        </div>
                      )}

                      <div className="offer-card-main">
                        <div className="offer-card-top">
                          <div className="offer-author-wrap">
                            <span className="offer-author-name">
                              <IconBuilding size={14} />
                              <span>{authorName}</span>
                            </span>
                            <span className="offer-verified-badge">
                              <IconShieldCheck size={12} />
                              <span>Vérifié</span>
                            </span>
                          </div>
                          {formattedDate && (
                            <span className="offer-date">
                              <IconCalendar size={13} />
                              <span>{formattedDate}</span>
                            </span>
                          )}
                        </div>

                        <div className="offer-card-body">
                          <h3 className="offer-title">{pub.titre}</h3>
                          <p className="offer-preview">{parsed.text}</p>
                        </div>
                      </div>

                      <div className="offer-unlocked-footer">
                        <PublicationInteractions publicationId={pub.id} compact />
                        <Link to={`/publications/${pub.id}`} className="btn btn-outline btn-sm btn-block" style={{ marginTop: "10px" }}>
                          <span>Consulter l'offre</span>
                          <IconArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
