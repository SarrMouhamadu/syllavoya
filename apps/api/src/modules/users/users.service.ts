import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { validateAndNormalizeSenegalPhone } from "../../utils/phone.js";

export interface UpdateProfileDTO {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  email?: string;
  [key: string]: unknown;
}

export interface UserProfileResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  statut: string;
  created_at: string;
}

export class UsersService {
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private sanitizeUser(user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    role: string;
    statut: string;
    created_at: { toString(): string } | string | Date;
  }): UserProfileResponse {
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      statut: user.statut,
      created_at: typeof user.created_at === "string" ? user.created_at : user.created_at.toString(),
    };
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404, "USER_NOT_FOUND");
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfileResponse> {
    // 1. Refus strict de toute tentative de modification des champs protégés (rôle, statut, id, mot de passe, etc.)
    const forbiddenFields = ["role", "statut", "mot_de_passe", "id", "created_at"];
    for (const field of forbiddenFields) {
      if (field in data) {
        throw new AppError(
          `Modification non autorisée : le champ '${field}' ne peut pas être modifié par l'utilisateur`,
          403,
          "FORBIDDEN"
        );
      }
    }

    // 2. Vérification de l'existence de l'utilisateur
    const existingUser = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    if (!existingUser) {
      throw new AppError("Utilisateur non trouvé", 404, "USER_NOT_FOUND");
    }

    // 3. Validation des champs autorisés
    const updates: {
      nom?: string;
      prenom?: string;
      telephone?: string | null;
      email?: string;
    } = {};

    if (data.nom !== undefined) {
      if (typeof data.nom !== "string" || !data.nom.trim()) {
        throw new AppError("Le nom ne peut pas être vide", 400, "VALIDATION_ERROR");
      }
      updates.nom = data.nom.trim();
    }

    if (data.prenom !== undefined) {
      if (typeof data.prenom !== "string" || !data.prenom.trim()) {
        throw new AppError("Le prénom ne peut pas être vide", 400, "VALIDATION_ERROR");
      }
      updates.prenom = data.prenom.trim();
    }

    if (data.telephone !== undefined) {
      updates.telephone = validateAndNormalizeSenegalPhone(data.telephone);
    }

    if (data.email !== undefined) {
      if (typeof data.email !== "string" || !this.validateEmail(data.email.trim())) {
        throw new AppError("L'adresse email fournie est invalide", 400, "VALIDATION_ERROR");
      }
      const normalizedEmail = data.email.trim().toLowerCase();

      if (normalizedEmail !== existingUser.email) {
        const emailInUse = await db.orm.public.Utilisateur
          .where({ email: normalizedEmail })
          .first();

        if (emailInUse && emailInUse.id !== userId) {
          throw new AppError("Cette adresse email est déjà utilisée", 409, "EMAIL_ALREADY_EXISTS");
        }
        updates.email = normalizedEmail;
      }
    }

    // Vérifier qu'au moins une modification valide a été demandée
    if (Object.keys(updates).length === 0) {
      throw new AppError("Aucune modification valide fournie", 400, "VALIDATION_ERROR");
    }

    // 4. Application de la mise à jour
    await db.orm.public.Utilisateur
      .where({ id: userId })
      .update(updates);

    // 5. Récupération de l'utilisateur à jour
    const updatedUser = await db.orm.public.Utilisateur
      .where({ id: userId })
      .first();

    if (!updatedUser) {
      throw new AppError("Erreur lors de la récupération du profil mis à jour", 500, "INTERNAL_SERVER_ERROR");
    }

    return this.sanitizeUser(updatedUser);
  }
}

export const usersService = new UsersService();
