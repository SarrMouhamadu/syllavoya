import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";

export interface ApplyProfessionalDTO {
  nom_structure: string;
  description?: string;
  informations_professionnelles?: string;
}

export interface UpdateProfessionalDTO {
  nom_structure?: string;
  description?: string | null;
  informations_professionnelles?: string | null;
  [key: string]: unknown;
}

export interface ProfessionalResponse {
  id: string;
  utilisateur_id: string;
  nom_structure: string;
  description: string | null;
  informations_professionnelles: string | null;
  statut_verification: string;
  created_at: string;
  telephone: string | null;
}

export class ProfessionalsService {
  private formatProfessional(
    pro: {
      id: string;
      utilisateur_id: string;
      nom_structure: string;
      description: string | null;
      informations_professionnelles: string | null;
      statut_verification: string;
      created_at: { toString(): string } | string | Date;
    },
    telephone?: string | null
  ): ProfessionalResponse {
    return {
      id: pro.id,
      utilisateur_id: pro.utilisateur_id,
      nom_structure: pro.nom_structure,
      description: pro.description,
      informations_professionnelles: pro.informations_professionnelles,
      statut_verification: pro.statut_verification,
      created_at: typeof pro.created_at === "string" ? pro.created_at : pro.created_at.toString(),
      telephone: telephone || null,
    };
  }

  async apply(userId: string, data: ApplyProfessionalDTO): Promise<{ professional: ProfessionalResponse; verificationId: string }> {
    // Règle : une structure doit être formalisée (nom_structure obligatoire)
    if (!data.nom_structure || typeof data.nom_structure !== "string" || !data.nom_structure.trim()) {
      throw new AppError("Le nom de la structure est obligatoire (structure formalisée requise)", 400, "VALIDATION_ERROR");
    }

    const existing = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (existing) {
      throw new AppError("Une demande ou un profil professionnel existe déjà pour ce compte", 409, "PROFESSIONAL_ALREADY_EXISTS");
    }

    const proId = randomUUID();
    const verificationId = randomUUID();
    const now = Temporal.Now.instant();

    const createdPro = await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: userId,
      nom_structure: data.nom_structure.trim(),
      description: data.description ? data.description.trim() : null,
      informations_professionnelles: data.informations_professionnelles ? data.informations_professionnelles.trim() : null,
      statut_verification: "EN_ATTENTE",
      created_at: now,
    });

    // Création de la demande de vérification initiale associée
    await db.orm.public.Verification.create({
      id: verificationId,
      professionnel_id: proId,
      statut: "EN_ATTENTE",
      date_debut: now,
      date_decision: null,
      commentaire: null,
    });

    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    return {
      professional: this.formatProfessional(createdPro, user?.telephone),
      verificationId,
    };
  }

  async getMe(userId: string): Promise<ProfessionalResponse> {
    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Aucun profil professionnel associé à ce compte", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    return this.formatProfessional(pro, user?.telephone);
  }

  async updateMe(userId: string, data: UpdateProfessionalDTO): Promise<ProfessionalResponse> {
    // Sécurité stricte : interdiction formelle pour le professionnel de modifier son statut de vérification
    const forbiddenFields = ["statut_verification", "id", "utilisateur_id", "created_at"];
    for (const field of forbiddenFields) {
      if (field in data) {
        throw new AppError(
          `Modification non autorisée : le champ '${field}' ne peut pas être modifié par le professionnel`,
          403,
          "FORBIDDEN"
        );
      }
    }

    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Aucun profil professionnel associé à ce compte", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const updates: {
      nom_structure?: string;
      description?: string | null;
      informations_professionnelles?: string | null;
    } = {};

    if (data.nom_structure !== undefined) {
      if (typeof data.nom_structure !== "string" || !data.nom_structure.trim()) {
        throw new AppError("Le nom de la structure ne peut pas être vide", 400, "VALIDATION_ERROR");
      }
      updates.nom_structure = data.nom_structure.trim();
    }

    if (data.description !== undefined) {
      updates.description = typeof data.description === "string" ? data.description.trim() : null;
    }

    if (data.informations_professionnelles !== undefined) {
      updates.informations_professionnelles = typeof data.informations_professionnelles === "string" ? data.informations_professionnelles.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("Aucune modification valide fournie", 400, "VALIDATION_ERROR");
    }

    await db.orm.public.Professionnel
      .where({ id: pro.id })
      .update(updates);

    const updated = await db.orm.public.Professionnel
      .where({ id: pro.id })
      .first();

    if (!updated) {
      throw new AppError("Erreur lors de la mise à jour du profil professionnel", 500, "INTERNAL_SERVER_ERROR");
    }

    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    return this.formatProfessional(updated, user?.telephone);
  }

  async listVerified(): Promise<ProfessionalResponse[]> {
    // Seuls les professionnels vérifiés sont visibles dans la liste publique
    const pros = await db.orm.public.Professionnel
      .where({ statut_verification: "VERIFIE" })
      .all();

    const results: ProfessionalResponse[] = [];
    for (const pro of pros) {
      const user = await db.orm.public.Utilisateur
        .where({ id: pro.utilisateur_id })
        .first();
      results.push(this.formatProfessional(pro, user?.telephone));
    }

    return results;
  }

  async getById(id: string, requestingUserId?: string, requestingUserRole?: string): Promise<ProfessionalResponse> {
    const pro = await db.orm.public.Professionnel
      .where({ id })
      .first();

    if (!pro) {
      throw new AppError("Professionnel non trouvé", 404, "PROFESSIONAL_NOT_FOUND");
    }

    // Si le professionnel n'est pas vérifié, seul le propriétaire ou l'admin peut y accéder
    if (pro.statut_verification !== "VERIFIE") {
      const isOwner = requestingUserId && pro.utilisateur_id === requestingUserId;
      const isAdmin = requestingUserRole === "ADMIN";

      if (!isOwner && !isAdmin) {
        throw new AppError("Ce professionnel n'est pas accessible", 404, "PROFESSIONAL_NOT_FOUND");
      }
    }

    const user = await db.orm.public.Utilisateur
      .where({ id: pro.utilisateur_id })
      .first();

    return this.formatProfessional(pro, user?.telephone);
  }
}

export const professionalsService = new ProfessionalsService();
