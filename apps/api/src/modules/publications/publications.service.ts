import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";

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

    if (!pro || pro.statut_verification !== "VERIFIE") {
      throw new AppError(
        "Seuls les professionnels vérifiés par Sylla Voyage peuvent créer une publication",
        403,
        "FORBIDDEN"
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
    const now = Temporal.Now.instant();

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
}

export const publicationsService = new PublicationsService();
