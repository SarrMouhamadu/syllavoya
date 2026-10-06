import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import bcrypt from "bcryptjs";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { validateAndNormalizeSenegalPhone } from "../../utils/phone.js";

export interface CreateProfessionalAccountDTO {
  nom_structure: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  mot_de_passe: string;
  description?: string;
}

export interface TreatVerificationDTO {
  decision: "ACCEPTEE" | "REFUSEE" | "SUSPENDUE" | "REVOQUEE" | "APPROUVEE" | "REJETEE";
  commentaire?: string | null;
}

export interface TreatPublicationDTO {
  decision: "APPROUVEE" | "REJETEE" | "REFUSEE";
  commentaire?: string | null;
}

export class AdminService {
  async listVerifications(): Promise<any[]> {
    const verifications = await db.orm.public.Verification.all();

    const results = [];
    for (const v of verifications) {
      const pro = await db.orm.public.Professionnel
        .where({ id: v.professionnel_id })
        .first();

      let user = null;
      let documents: any[] = [];

      if (pro) {
        user = await db.orm.public.Utilisateur
          .where({ id: pro.utilisateur_id })
          .first();

        documents = await db.orm.public.DocumentVerification
          .where({ professionnel_id: pro.id })
          .all();
      }

      results.push({
        id: v.id,
        professionnel_id: v.professionnel_id,
        statut: v.statut,
        date_debut: v.date_debut.toString(),
        date_decision: v.date_decision ? v.date_decision.toString() : null,
        commentaire: v.commentaire,
        professionnel: pro ? {
          id: pro.id,
          nom_structure: pro.nom_structure,
          statut_verification: pro.statut_verification,
          description: pro.description,
        } : null,
        utilisateur: user ? {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
        } : null,
        documents: documents.map((d) => ({
          id: d.id,
          type_document: d.type_document,
          fichier: d.fichier,
          statut: d.statut,
          created_at: d.created_at.toString(),
        })),
      });
    }

    return results;
  }

  async treatVerification(verificationId: string, data: TreatVerificationDTO): Promise<any> {
    const allowedDecisions = ["ACCEPTEE", "APPROUVEE", "REFUSEE", "REJETEE", "SUSPENDUE", "REVOQUEE"];
    if (!data.decision || !allowedDecisions.includes(data.decision)) {
      throw new AppError(
        `Décision invalide. Valeurs acceptées : ${allowedDecisions.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const verification = await db.orm.public.Verification
      .where({ id: verificationId })
      .first();

    if (!verification) {
      throw new AppError("Demande de vérification introuvable", 404, "VERIFICATION_NOT_FOUND");
    }

    const pro = await db.orm.public.Professionnel
      .where({ id: verification.professionnel_id })
      .first();

    if (!pro) {
      throw new AppError("Professionnel associé à cette vérification introuvable", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const now = Temporal.Now.instant();

    // Normalisation de la décision
    let normalizedDecision = data.decision;
    let newProStatus: string;
    let docStatus: string | null = null;

    switch (data.decision) {
      case "APPROUVEE":
      case "ACCEPTEE":
        normalizedDecision = "APPROUVEE";
        newProStatus = "VERIFIE";
        docStatus = "APPROUVE";
        break;
      case "REJETEE":
      case "REFUSEE":
        normalizedDecision = "REJETEE";
        newProStatus = "REJETE";
        docStatus = "REJETE";
        break;
      case "SUSPENDUE":
        normalizedDecision = "SUSPENDUE";
        newProStatus = "SUSPENDU";
        break;
      case "REVOQUEE":
        normalizedDecision = "REVOQUEE";
        newProStatus = "REVOQUE";
        break;
      default:
        newProStatus = "EN_ATTENTE";
    }

    // Mise à jour de la vérification
    await db.orm.public.Verification
      .where({ id: verificationId })
      .update({
        statut: normalizedDecision,
        date_decision: now,
        commentaire: data.commentaire ? data.commentaire.trim() : null,
      });

    // Mise à jour du professionnel
    await db.orm.public.Professionnel
      .where({ id: pro.id })
      .update({
        statut_verification: newProStatus,
      });

    // Mise à jour des documents si applicable
    if (docStatus) {
      const docs = await db.orm.public.DocumentVerification
        .where({ professionnel_id: pro.id })
        .all();
      for (const d of docs) {
        await db.orm.public.DocumentVerification
          .where({ id: d.id })
          .update({ statut: docStatus });
      }
    }

    // Synchronisation du rôle utilisateur si nécessaire
    if (newProStatus === "VERIFIE") {
      await db.orm.public.Utilisateur
        .where({ id: pro.utilisateur_id })
        .update({ role: "PROFESSIONNEL" });
    } else if (newProStatus === "REVOQUE") {
      await db.orm.public.Utilisateur
        .where({ id: pro.utilisateur_id })
        .update({ role: "VOYAGEUR" });
    }

    const updatedVerification = await db.orm.public.Verification
      .where({ id: verificationId })
      .first();

    const updatedPro = await db.orm.public.Professionnel
      .where({ id: pro.id })
      .first();

    return {
      verification: updatedVerification ? {
        id: updatedVerification.id,
        professionnel_id: updatedVerification.professionnel_id,
        statut: updatedVerification.statut,
        date_debut: updatedVerification.date_debut.toString(),
        date_decision: updatedVerification.date_decision ? updatedVerification.date_decision.toString() : null,
        commentaire: updatedVerification.commentaire,
      } : null,
      professionnel: updatedPro ? {
        id: updatedPro.id,
        nom_structure: updatedPro.nom_structure,
        statut_verification: updatedPro.statut_verification,
      } : null,
    };
  }

  async listPublications(): Promise<any[]> {
    const publications = await db.orm.public.Publication.all();

    // Tri anti-chronologique : publications les plus récentes d'abord
    publications.sort((a, b) => {
      try {
        const tA = Temporal.Instant.from(a.date_creation.toString()).epochMilliseconds;
        const tB = Temporal.Instant.from(b.date_creation.toString()).epochMilliseconds;
        return tB - tA;
      } catch {
        return 0;
      }
    });

    // Récupération des logs d'audit pour extraire les commentaires de modération
    const auditLogs = await db.orm.public.AuditLog.all();
    const commentsByPubId: Record<string, string> = {};

    for (const log of auditLogs) {
      if (log.action?.startsWith("MODERATION_PUBLICATION") && log.informations_complementaires) {
        try {
          const info = JSON.parse(log.informations_complementaires);
          if (info.publication_id && info.commentaire) {
            commentsByPubId[info.publication_id] = info.commentaire;
          }
        } catch {}
      }
    }

    const results = [];
    for (const pub of publications) {
      const pro = await db.orm.public.Professionnel
        .where({ id: pub.professionnel_id })
        .first();

      let user = null;
      if (pro) {
        user = await db.orm.public.Utilisateur
          .where({ id: pro.utilisateur_id })
          .first();
      }

      results.push({
        id: pub.id,
        professionnel_id: pub.professionnel_id,
        titre: pub.titre,
        contenu: pub.contenu,
        statut: pub.statut,
        date_creation: pub.date_creation.toString(),
        date_publication: pub.date_publication ? pub.date_publication.toString() : null,
        commentaire_moderation: commentsByPubId[pub.id] || null,
        professionnel: pro ? {
          id: pro.id,
          nom_structure: pro.nom_structure,
          statut_verification: pro.statut_verification,
          utilisateur: user ? {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            telephone: user.telephone,
          } : null,
        } : null,
      });
    }

    return results;
  }

  async treatPublication(
    publicationId: string,
    data: TreatPublicationDTO,
    adminUserId: string = "ADMIN"
  ): Promise<any> {
    const allowed = ["APPROUVEE", "REJETEE", "REFUSEE"];
    if (!data.decision || !allowed.includes(data.decision)) {
      throw new AppError(
        `Décision invalide. Valeurs acceptées : APPROUVEE, REJETEE`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const pub = await db.orm.public.Publication
      .where({ id: publicationId })
      .first();

    if (!pub) {
      throw new AppError("Publication introuvable", 404, "PUBLICATION_NOT_FOUND");
    }

    // Normalisation : "REFUSEE" -> "REJETEE"
    const normalizedDecision =
      data.decision === "REJETEE" || data.decision === "REFUSEE" ? "REJETEE" : "APPROUVEE";

    const now = Temporal.Now.instant();
    const datePublication = normalizedDecision === "APPROUVEE" ? now : null;

    // 1. Mise à jour de la publication
    await db.orm.public.Publication
      .where({ id: publicationId })
      .update({
        statut: normalizedDecision,
        date_publication: datePublication,
      });

    const updated = await db.orm.public.Publication
      .where({ id: publicationId })
      .first();

    // 2. Traçabilité obligatoire : enregistrement dans AUDIT_LOG
    const auditLog = await this.recordAuditLog(
      adminUserId,
      `MODERATION_PUBLICATION_${normalizedDecision}`,
      {
        publication_id: publicationId,
        decision: normalizedDecision,
        titre: pub.titre,
        professionnel_id: pub.professionnel_id,
        commentaire: data.commentaire ? data.commentaire.trim() : null,
      }
    );

    const pro = await db.orm.public.Professionnel
      .where({ id: updated!.professionnel_id })
      .first();

    let user = null;
    if (pro) {
      user = await db.orm.public.Utilisateur
        .where({ id: pro.utilisateur_id })
        .first();
    }

    return {
      id: updated!.id,
      professionnel_id: updated!.professionnel_id,
      titre: updated!.titre,
      contenu: updated!.contenu,
      statut: updated!.statut,
      date_creation: updated!.date_creation.toString(),
      date_publication: updated!.date_publication ? updated!.date_publication.toString() : null,
      commentaire_moderation: data.commentaire ? data.commentaire.trim() : null,
      professionnel: pro ? {
        id: pro.id,
        nom_structure: pro.nom_structure,
        statut_verification: pro.statut_verification,
        utilisateur: user ? {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
        } : null,
      } : null,
      audit_log: auditLog,
    };
  }

  /**
   * Enregistrer une action administrative dans AUDIT_LOG pour la traçabilité.
   */
  async recordAuditLog(adminUserId: string, action: string, details?: unknown): Promise<any> {
    const log = await db.orm.public.AuditLog.create({
      id: randomUUID(),
      utilisateur_id: adminUserId,
      action,
      date: Temporal.Now.instant(),
      informations_complementaires: details ? JSON.stringify(details) : null,
    });

    return {
      id: log.id,
      utilisateur_id: log.utilisateur_id,
      action: log.action,
      date: log.date.toString(),
      informations_complementaires: log.informations_complementaires,
    };
  }

  /**
   * Administrateur : consulter tous les signalements.
   */
  async listReports(): Promise<any[]> {
    const reports = await db.orm.public.Signalement.all();

    reports.sort((a, b) => {
      const timeA = Temporal.Instant.from(a.date_creation.toString()).epochMilliseconds;
      const timeB = Temporal.Instant.from(b.date_creation.toString()).epochMilliseconds;
      return timeB - timeA;
    });

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const user = await db.orm.public.Utilisateur
          .where({ id: r.utilisateur_id })
          .first();

        return {
          id: r.id,
          utilisateur_id: r.utilisateur_id,
          type_cible: r.type_cible,
          cible_id: r.cible_id,
          motif: r.motif,
          description: r.description,
          statut: r.statut,
          date_creation: r.date_creation.toString(),
          signale_par: user ? {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
          } : null,
        };
      })
    );

    return enriched;
  }

  /**
   * Administrateur : traiter un signalement.
   * Règle stricte : Enregistrer l'action administrative dans AUDIT_LOG.
   */
  async treatReport(
    adminUserId: string,
    reportId: string,
    data: { decision: "TRAITE" | "REJETE" | "RESOLU" | "CLASSE"; commentaire?: string }
  ): Promise<any> {
    const allowed = ["TRAITE", "REJETE", "RESOLU", "CLASSE"];
    if (!data.decision || !allowed.includes(data.decision)) {
      throw new AppError(
        `Décision invalide. Valeurs acceptées : ${allowed.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const report = await db.orm.public.Signalement
      .where({ id: reportId })
      .first();

    if (!report) {
      throw new AppError("Signalement introuvable.", 404, "REPORT_NOT_FOUND");
    }

    // 1. Mise à jour du statut du signalement
    await db.orm.public.Signalement
      .where({ id: reportId })
      .update({
        statut: data.decision,
      });

    const updated = await db.orm.public.Signalement
      .where({ id: reportId })
      .first();

    // 2. Traçabilité obligatoire : enregistrement dans AUDIT_LOG
    const auditLog = await this.recordAuditLog(adminUserId, "TRAITEMENT_SIGNALEMENT", {
      signalement_id: report.id,
      decision: data.decision,
      type_cible: report.type_cible,
      cible_id: report.cible_id,
      motif: report.motif,
      commentaire: data.commentaire || null,
    });

    return {
      report: {
        id: updated!.id,
        utilisateur_id: updated!.utilisateur_id,
        type_cible: updated!.type_cible,
        cible_id: updated!.cible_id,
        motif: updated!.motif,
        description: updated!.description,
        statut: updated!.statut,
        date_creation: updated!.date_creation.toString(),
      },
      audit_log: auditLog,
    };
  }

  /**
   * Administrateur : consulter les logs d'audit.
   */
  async listAuditLogs(): Promise<any[]> {
    const logs = await db.orm.public.AuditLog.all();

    logs.sort((a, b) => {
      const timeA = Temporal.Instant.from(a.date.toString()).epochMilliseconds;
      const timeB = Temporal.Instant.from(b.date.toString()).epochMilliseconds;
      return timeB - timeA;
    });

    return logs.map((l) => ({
      id: l.id,
      utilisateur_id: l.utilisateur_id,
      action: l.action,
      date: l.date.toString(),
      informations_complementaires: l.informations_complementaires,
    }));
  }

  /**
   * Administrateur : créer directement un compte agence professionnelle avec ses identifiants.
   */
  async createProfessionalAccount(
    data: CreateProfessionalAccountDTO,
    adminUserId: string = "ADMIN"
  ): Promise<{
    user: { id: string; nom: string; prenom: string; email: string; telephone: string; role: string };
    professional: { id: string; nom_structure: string; statut_verification: string };
  }> {
    if (!data.nom_structure || typeof data.nom_structure !== "string" || !data.nom_structure.trim()) {
      throw new AppError("Le nom de l'agence (structure) est obligatoire", 400, "VALIDATION_ERROR");
    }

    if (!data.nom || typeof data.nom !== "string" || !data.nom.trim()) {
      throw new AppError("Le nom du responsable est obligatoire", 400, "VALIDATION_ERROR");
    }

    if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
      throw new AppError("L'adresse email est obligatoire", 400, "VALIDATION_ERROR");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError("L'adresse email fournie est invalide", 400, "VALIDATION_ERROR");
    }

    const existingEmail = await db.orm.public.Utilisateur
      .where({ email: normalizedEmail })
      .first();
    if (existingEmail) {
      throw new AppError("Un compte avec cette adresse email existe déjà", 409, "EMAIL_ALREADY_EXISTS");
    }

    if (!data.telephone || typeof data.telephone !== "string" || !data.telephone.trim()) {
      throw new AppError("Le numéro de téléphone est obligatoire", 400, "INVALID_PHONE");
    }

    const normalizedPhone = validateAndNormalizeSenegalPhone(data.telephone, { allowInternational: true });
    const existingPhone = await db.orm.public.Utilisateur
      .where({ telephone: normalizedPhone })
      .first();
    if (existingPhone) {
      throw new AppError("Un compte avec ce numéro de téléphone existe déjà", 409, "PHONE_ALREADY_EXISTS");
    }

    if (!data.mot_de_passe || typeof data.mot_de_passe !== "string" || data.mot_de_passe.trim().length < 6) {
      throw new AppError("Le mot de passe doit comporter au moins 6 caractères", 400, "VALIDATION_ERROR");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.mot_de_passe.trim(), salt);

    const now = Temporal.Now.instant();
    const userId = randomUUID();
    const proId = randomUUID();
    const verificationId = randomUUID();

    const createdUser = await db.orm.public.Utilisateur.create({
      id: userId,
      nom: data.nom.trim(),
      prenom: (data.prenom || "").trim(),
      email: normalizedEmail,
      telephone: normalizedPhone,
      mot_de_passe: hashedPassword,
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: now,
    });

    const createdPro = await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: userId,
      nom_structure: data.nom_structure.trim(),
      description: data.description ? data.description.trim() : null,
      statut_verification: "VERIFIE",
      created_at: now,
    });

    await db.orm.public.Verification.create({
      id: verificationId,
      professionnel_id: proId,
      statut: "APPROUVEE",
      date_debut: now,
      date_decision: now,
      commentaire: "Compte créé et vérifié directement par l'administrateur",
    });

    await this.recordAuditLog(adminUserId, "CREATION_COMPTE_PROFESSIONNEL", {
      professionnel_id: proId,
      utilisateur_id: userId,
      nom_structure: data.nom_structure.trim(),
      email: normalizedEmail,
      telephone: normalizedPhone,
    });

    return {
      user: {
        id: createdUser.id,
        nom: createdUser.nom,
        prenom: createdUser.prenom,
        email: createdUser.email,
        telephone: createdUser.telephone!,
        role: createdUser.role,
      },
      professional: {
        id: createdPro.id,
        nom_structure: createdPro.nom_structure,
        statut_verification: createdPro.statut_verification,
      },
    };
  }

  async getFinancialStats(): Promise<{
    chiffreAffairesTotal: number;
    agences: {
      total: number;
      chiffreAffaires: number;
    };
    voyageurs: {
      total: number;
      chiffreAffaires: number;
    };
  }> {
    const [utilisateurs, professionnels, abonnements, formules, paiements] = await Promise.all([
      db.orm.public.Utilisateur.all(),
      db.orm.public.Professionnel.all(),
      db.orm.public.Abonnement.all(),
      db.orm.public.FormuleAbonnement.all(),
      db.orm.public.Paiement.all(),
    ]);

    const totalAgences = professionnels.length;
    const totalVoyageurs = utilisateurs.filter(
      (u) => (u.role || "").toUpperCase() === "VOYAGEUR"
    ).length;

    const formuleTypeMap = new Map<string, string>();
    for (const f of formules) {
      formuleTypeMap.set(f.id, (f.type_utilisateur || "").toUpperCase());
    }

    const userRoleMap = new Map<string, string>();
    for (const u of utilisateurs) {
      userRoleMap.set(u.id, (u.role || "").toUpperCase());
    }

    const abonnementTypeMap = new Map<string, string>();
    for (const sub of abonnements) {
      const typeFromFormula = formuleTypeMap.get(sub.formule_id);
      const typeFromUser = userRoleMap.get(sub.utilisateur_id);
      abonnementTypeMap.set(sub.id, typeFromFormula || typeFromUser || "VOYAGEUR");
    }

    let caAgences = 0;
    let caVoyageurs = 0;
    let caTotal = 0;

    for (const p of paiements) {
      const statut = (p.statut || "").toUpperCase();
      if (statut === "CONFIRME") {
        const montant = Number(p.montant) || 0;
        caTotal += montant;

        const subType = abonnementTypeMap.get(p.abonnement_id);
        if (subType === "PROFESSIONNEL") {
          caAgences += montant;
        } else {
          caVoyageurs += montant;
        }
      }
    }

    return {
      chiffreAffairesTotal: caTotal,
      agences: {
        total: totalAgences,
        chiffreAffaires: caAgences,
      },
      voyageurs: {
        total: totalVoyageurs,
        chiffreAffaires: caVoyageurs,
      },
    };
  }
}

export const adminService = new AdminService();

