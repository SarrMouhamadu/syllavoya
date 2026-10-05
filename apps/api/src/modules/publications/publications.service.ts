import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";
import { subscriptionsService } from "../subscriptions/subscriptions.service.js";

export interface CreatePublicationDTO {
  titre: string;
  contenu: string;
}

export interface PublicationResponse {
  id: string;
  professionnel_id: string;
  titre: string;
  contenu: string;
  statut: string;
  date_creation: string;
  date_publication: string | null;
  professionnel?: {
    id: string;
    nom_structure: string;
  } | null;
}

export class PublicationsService {
  private formatPublication(
    pub: {
      id: string;
      professionnel_id: string;
      titre: string;
      contenu: string;
      statut: string;
      date_creation: { toString(): string } | string | Date;
      date_publication: { toString(): string } | string | Date | null;
    },
    pro?: { id: string; nom_structure: string } | null
  ): PublicationResponse {
    return {
      id: pub.id,
      professionnel_id: pub.professionnel_id,
      titre: pub.titre,
      contenu: pub.contenu,
      statut: pub.statut,
      date_creation: typeof pub.date_creation === "string" ? pub.date_creation : pub.date_creation.toString(),
      date_publication: pub.date_publication ? pub.date_publication.toString() : null,
      professionnel: pro ? { id: pro.id, nom_structure: pro.nom_structure } : null,
    };
  }

  async create(userId: string, data: CreatePublicationDTO): Promise<PublicationResponse> {
    // 1. Règle stricte : seuls les professionnels vérifiés peuvent créer une publication
    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    const isVerified = pro && (pro.statut_verification === "VERIFIE" || pro.statut_verification === "ACCEPTEE");
    if (!isVerified) {
      throw new AppError(
        "Seuls les professionnels vérifiés par Sylla Voyage peuvent créer une publication",
        403,
        "FORBIDDEN"
      );
    }

    // 2. Règle d'abonnement : le professionnel doit posséder un abonnement actif
    const hasActiveSub = await subscriptionsService.hasActiveSubscription(userId);
    if (!hasActiveSub) {
      throw new AppError(
        "Un abonnement professionnel actif est requis pour créer une publication.",
        403,
        "SUBSCRIPTION_REQUIRED"
      );
    }

    // 3. Règle de quota absolue : un professionnel peut créer au maximum 2 publications sur une période glissante de 7 jours
    const existingPubs = await db.orm.public.Publication
      .where({ professionnel_id: pro.id })
      .all();

    const now = Temporal.Now.instant();
    const sevenDaysSeconds = 7 * 24 * 3600;
    const sevenDaysAgo = now.subtract({ seconds: sevenDaysSeconds });

    // Filtrer les publications créées au cours des 7 derniers jours (fenêtre glissante)
    const recentPubs = existingPubs.filter((pub) => {
      try {
        const createdInstant = Temporal.Instant.from(pub.date_creation.toString());
        return Temporal.Instant.compare(createdInstant, sevenDaysAgo) >= 0;
      } catch {
        return false;
      }
    });

    if (recentPubs.length >= 2) {
      // Trouver la plus ancienne publication parmi celles de la fenêtre glissante
      recentPubs.sort((a, b) => {
        const tA = Temporal.Instant.from(a.date_creation.toString());
        const tB = Temporal.Instant.from(b.date_creation.toString());
        return Temporal.Instant.compare(tA, tB);
      });

      const oldestInWindow = recentPubs[0];
      const oldestInstant = Temporal.Instant.from(oldestInWindow.date_creation.toString());
      const nextAvailableInstant = oldestInstant.add({ seconds: sevenDaysSeconds });
      const nextDateStr = nextAvailableInstant.toString();

      throw new AppError(
        `Limite de publication atteinte (maximum 2 publications sur les 7 derniers jours glissants). Vous pourrez à nouveau publier à partir du ${nextDateStr}.`,
        403,
        "WEEKLY_QUOTA_EXCEEDED"
      );
    }

    // 2. Validation des données
    if (!data.titre || typeof data.titre !== "string" || !data.titre.trim()) {
      throw new AppError("Le titre de la publication est obligatoire", 400, "VALIDATION_ERROR");
    }

    if (!data.contenu || typeof data.contenu !== "string" || !data.contenu.trim()) {
      throw new AppError("Le contenu de la publication est obligatoire", 400, "VALIDATION_ERROR");
    }

    // 3. Création : toute publication créée est soumise à modération (statut initial EN_ATTENTE)
    const id = randomUUID();

    const created = await db.orm.public.Publication.create({
      id,
      professionnel_id: pro.id,
      titre: data.titre.trim(),
      contenu: data.contenu.trim(),
      statut: "EN_ATTENTE",
      date_creation: now,
      date_publication: null,
    });

    return this.formatPublication(created, { id: pro.id, nom_structure: pro.nom_structure });
  }

  async listPublic(): Promise<PublicationResponse[]> {
    // Seules les publications approuvées sont visibles publiquement
    const publications = await db.orm.public.Publication
      .where({ statut: "APPROUVEE" })
      .all();

    const results: PublicationResponse[] = [];
    for (const pub of publications) {
      const pro = await db.orm.public.Professionnel
        .where({ id: pub.professionnel_id })
        .first();

      results.push(this.formatPublication(pub, pro ? { id: pro.id, nom_structure: pro.nom_structure } : null));
    }

    return results;
  }

  async getById(id: string, requestingUserId?: string, requestingUserRole?: string): Promise<PublicationResponse> {
    const pub = await db.orm.public.Publication
      .where({ id })
      .first();

    if (!pub) {
      throw new AppError("Publication introuvable", 404, "PUBLICATION_NOT_FOUND");
    }

    const pro = await db.orm.public.Professionnel
      .where({ id: pub.professionnel_id })
      .first();

    // Si la publication n'est pas approuvée, seul l'auteur ou un admin peut y accéder
    if (pub.statut !== "APPROUVEE") {
      const isAuthor = requestingUserId && pro?.utilisateur_id === requestingUserId;
      const isAdmin = requestingUserRole === "ADMIN";

      if (!isAuthor && !isAdmin) {
        throw new AppError("Publication introuvable ou non publiée", 404, "PUBLICATION_NOT_FOUND");
      }
    }

    return this.formatPublication(pub, pro ? { id: pro.id, nom_structure: pro.nom_structure } : null);
  }

  async listMine(userId: string): Promise<PublicationResponse[]> {
    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Profil professionnel introuvable", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const publications = await db.orm.public.Publication
      .where({ professionnel_id: pro.id })
      .all();

    return publications.map((pub) => this.formatPublication(pub, { id: pro.id, nom_structure: pro.nom_structure }));
  }

  async submit(id: string, userId: string): Promise<PublicationResponse> {
    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    if (!pro) {
      throw new AppError("Profil professionnel introuvable", 404, "PROFESSIONAL_NOT_FOUND");
    }

    const pub = await db.orm.public.Publication
      .where({ id })
      .first();

    if (!pub) {
      throw new AppError("Publication introuvable", 404, "PUBLICATION_NOT_FOUND");
    }

    if (pub.professionnel_id !== pro.id) {
      throw new AppError("Vous n'êtes pas l'auteur de cette publication", 403, "FORBIDDEN");
    }

    await db.orm.public.Publication
      .where({ id })
      .update({ statut: "EN_ATTENTE" });

    const updated = await db.orm.public.Publication
      .where({ id })
      .first();

    return this.formatPublication(updated!, { id: pro.id, nom_structure: pro.nom_structure });
  }

  /**
   * Modifier une publication.
   * Règle d'auteur : seul l'auteur (ou l'administrateur) peut modifier.
   * Règle de modération : toute modification de contenu remet la publication en EN_ATTENTE.
   */
  async update(
    id: string,
    userId: string,
    data: { titre?: string; contenu?: string },
    userRole?: string
  ): Promise<PublicationResponse> {
    const pub = await db.orm.public.Publication
      .where({ id })
      .first();

    if (!pub) {
      throw new AppError("Publication introuvable", 404, "PUBLICATION_NOT_FOUND");
    }

    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    const isAuthor = pro && pub.professionnel_id === pro.id;
    const isAdmin = userRole === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new AppError("Vous n'êtes pas l'auteur de cette publication.", 403, "FORBIDDEN");
    }

    if (pub.statut === "SUPPRIMEE") {
      throw new AppError("Une publication supprimée ne peut pas être modifiée.", 400, "INVALID_STATUS");
    }

    const updateFields: any = {};

    if (data.titre !== undefined) {
      if (typeof data.titre !== "string" || !data.titre.trim()) {
        throw new AppError("Le titre de la publication ne peut pas être vide", 400, "VALIDATION_ERROR");
      }
      updateFields.titre = data.titre.trim();
    }

    if (data.contenu !== undefined) {
      if (typeof data.contenu !== "string" || !data.contenu.trim()) {
        throw new AppError("Le contenu de la publication ne peut pas être vide", 400, "VALIDATION_ERROR");
      }
      updateFields.contenu = data.contenu.trim();
    }

    // Remettre dans le workflow de modération approprié
    updateFields.statut = "EN_ATTENTE";
    updateFields.date_publication = null;

    await db.orm.public.Publication
      .where({ id })
      .update(updateFields);

    const updated = await db.orm.public.Publication
      .where({ id })
      .first();

    const authorPro = await db.orm.public.Professionnel
      .where({ id: pub.professionnel_id })
      .first();

    return this.formatPublication(updated!, authorPro ? { id: authorPro.id, nom_structure: authorPro.nom_structure } : null);
  }

  /**
   * Supprimer une publication.
   * Règle d'auteur : seul l'auteur (ou l'administrateur) peut supprimer sa publication.
   */
  async delete(id: string, userId: string, userRole?: string): Promise<{ success: boolean }> {
    const pub = await db.orm.public.Publication
      .where({ id })
      .first();

    if (!pub) {
      throw new AppError("Publication introuvable", 404, "PUBLICATION_NOT_FOUND");
    }

    const pro = await db.orm.public.Professionnel
      .where({ utilisateur_id: userId })
      .first();

    const isAuthor = pro && pub.professionnel_id === pro.id;
    const isAdmin = userRole === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new AppError("Vous n'êtes pas autorisé à supprimer cette publication.", 403, "FORBIDDEN");
    }

    await db.orm.public.Publication
      .where({ id })
      .delete();

    return { success: true };
  }
}

export const publicationsService = new PublicationsService();
