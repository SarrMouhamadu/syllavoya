import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { Response } from "express";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { UPLOAD_DIR } from "../../middleware/upload.js";

export interface SubmitDocumentDTO {
  type_document: string;
  fichier?: string;
}

export interface DocumentResponse {
  id: string;
  professionnel_id: string;
  type_document: string;
  fichier: string;
  statut: string;
  created_at: string;
}

export interface VerificationResponse {
  id: string;
  professionnel_id: string;
  statut: string;
  date_debut: string;
  date_decision: string | null;
  commentaire: string | null;
}

export class VerificationService {
  async submitDocument(
    userId: string,
    data: SubmitDocumentDTO,
    file?: { filename: string; mimetype: string; size: number }
  ): Promise<DocumentResponse> {
    if (!data.type_document || typeof data.type_document !== "string" || !data.type_document.trim()) {
      throw new AppError("Le type de document est obligatoire (ex: RCCM, NINEA, PIECE_IDENTITE)", 400, "VALIDATION_ERROR");
    }

    const filename = file?.filename || (typeof data.fichier === "string" ? data.fichier.trim() : "");
    if (!filename) {
      throw new AppError("Le fichier est obligatoire", 400, "VALIDATION_ERROR");
    }

    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Vous devez d'abord créer un profil professionnel avant d'ajouter des documents", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const docId = randomUUID();
    const now = Temporal.Now.instant();

    const createdDoc = await db.orm.public.DocumentVerification.create({
      id: docId,
      professionnel_id: pro.id,
      type_document: data.type_document.trim(),
      fichier: filename,
      statut: "EN_ATTENTE",
      created_at: now,
    });

    return {
      id: createdDoc.id,
      professionnel_id: createdDoc.professionnel_id,
      type_document: createdDoc.type_document,
      fichier: createdDoc.fichier,
      statut: createdDoc.statut,
      created_at: createdDoc.created_at.toString(),
    };
  }

  async getMyVerificationState(userId: string): Promise<{
    statut_verification: string;
    verifications: VerificationResponse[];
    documents: DocumentResponse[];
  }> {
    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Aucun profil professionnel associé à ce compte", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const verifs = await db.orm.public.Verification
      .where({ professionnel_id: pro.id })
      .all();

    const docs = await db.orm.public.DocumentVerification
      .where({ professionnel_id: pro.id })
      .all();

    return {
      statut_verification: pro.statut_verification,
      verifications: verifs.map((v) => ({
        id: v.id,
        professionnel_id: v.professionnel_id,
        statut: v.statut,
        date_debut: v.date_debut.toString(),
        date_decision: v.date_decision ? v.date_decision.toString() : null,
        commentaire: v.commentaire,
      })),
      documents: docs.map((d) => ({
        id: d.id,
        professionnel_id: d.professionnel_id,
        type_document: d.type_document,
        fichier: d.fichier,
        statut: d.statut,
        created_at: d.created_at.toString(),
      })),
    };
  }

  /**
   * Consulter / télécharger une pièce d'identité ou un document de vérification.
   * Règle stricte : accès réservé au propriétaire du document et à l'administrateur.
   */
  async serveDocumentFile(
    documentId: string,
    requestingUserId: string,
    requestingUserRole: string,
    res: Response
  ): Promise<void> {
    const doc = await db.orm.public.DocumentVerification
      .where({ id: documentId })
      .first();

    if (!doc) {
      throw new AppError("Document de vérification introuvable", 404, "DOCUMENT_NOT_FOUND");
    }

    const pro = await db.orm.public.Professionnel
      .where({ id: doc.professionnel_id })
      .first();

    if (!pro) {
      throw new AppError("Professionnel associé introuvable", 404, "PROFESSIONAL_NOT_FOUND");
    }

    // Contrôle d'accès strict côté serveur
    const isOwner = pro.utilisateur_id === requestingUserId;
    const isAdmin = requestingUserRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError("Accès refusé : vous n'avez pas l'autorisation d'accéder à ce document", 403, "FORBIDDEN");
    }

    // Résolution sécurisée du fichier dans l'espace privé
    const safeFilename = path.basename(doc.fichier);
    const filePath = path.resolve(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new AppError("Le fichier physique est introuvable sur le serveur", 404, "FILE_NOT_FOUND");
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}

export const verificationService = new VerificationService();
