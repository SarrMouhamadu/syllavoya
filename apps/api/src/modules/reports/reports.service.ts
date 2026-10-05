import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { AppError } from "../../errors/AppError.js";

export interface CreateReportDTO {
  type_cible: string;
  cible_id: string;
  motif: string;
  description: string;
}

export interface ReportResponse {
  id: string;
  utilisateur_id: string;
  type_cible: string;
  cible_id: string;
  motif: string;
  description: string;
  statut: string;
  date_creation: string;
}

export class ReportsService {
  private formatReport(r: {
    id: string;
    utilisateur_id: string;
    type_cible: string;
    cible_id: string;
    motif: string;
    description: string;
    statut: string;
    date_creation: { toString(): string } | string | Date;
  }): ReportResponse {
    return {
      id: r.id,
      utilisateur_id: r.utilisateur_id,
      type_cible: r.type_cible,
      cible_id: r.cible_id,
      motif: r.motif,
      description: r.description,
      statut: r.statut,
      date_creation: typeof r.date_creation === "string" ? r.date_creation : r.date_creation.toString(),
    };
  }

  /**
   * Créer un signalement lorsqu'un utilisateur rencontre un problème.
   * Règle : Un utilisateur doit pouvoir signaler un contenu ou un professionnel.
   */
  async createReport(userId: string, data: CreateReportDTO): Promise<ReportResponse> {
    if (!data.type_cible || typeof data.type_cible !== "string" || !data.type_cible.trim()) {
      throw new AppError("Le type de cible (type_cible) est obligatoire.", 400, "VALIDATION_ERROR");
    }

    if (!data.cible_id || typeof data.cible_id !== "string" || !data.cible_id.trim()) {
      throw new AppError("L'identifiant de la cible (cible_id) est obligatoire.", 400, "VALIDATION_ERROR");
    }

    if (!data.motif || typeof data.motif !== "string" || !data.motif.trim()) {
      throw new AppError("Le motif du signalement est obligatoire.", 400, "VALIDATION_ERROR");
    }

    if (!data.description || typeof data.description !== "string" || !data.description.trim()) {
      throw new AppError("La description du signalement est obligatoire.", 400, "VALIDATION_ERROR");
    }

    const now = Temporal.Now.instant();

    const report = await db.orm.public.Signalement.create({
      id: randomUUID(),
      utilisateur_id: userId,
      type_cible: data.type_cible.trim().toUpperCase(),
      cible_id: data.cible_id.trim(),
      motif: data.motif.trim(),
      description: data.description.trim(),
      statut: "EN_ATTENTE",
      date_creation: now,
    });

    return this.formatReport(report);
  }

  /**
   * Consulter ses propres signalements.
   * Règle de sécurité : Un utilisateur n'accède qu'aux signalements qu'il a lui-même créés.
   */
  async getMyReports(userId: string): Promise<ReportResponse[]> {
    const reports = await db.orm.public.Signalement
      .where({ utilisateur_id: userId })
      .all();

    reports.sort((a, b) => {
      const timeA = Temporal.Instant.from(a.date_creation.toString()).epochMilliseconds;
      const timeB = Temporal.Instant.from(b.date_creation.toString()).epochMilliseconds;
      return timeB - timeA;
    });

    return reports.map((r) => this.formatReport(r));
  }
}

export const reportsService = new ReportsService();
