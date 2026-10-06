import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";
import { validateAndNormalizeSenegalPhone } from "../../utils/phone.js";
import { loginRateLimiter } from "./login-rate-limiter.js";

export interface RegisterDTO {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  telephone: string;
  role?: string;
}

export interface LoginDTO {
  email: string;
  mot_de_passe: string;
  role?: string;
}

export interface UserResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
  statut: string;
  created_at: string;
}

export interface RegisterProfessionalDTO {
  nom: string;
  telephone: string;
  mot_de_passe?: string;
  prenom?: string;
  email?: string;
  nom_structure?: string;
  description?: string;
  informations_professionnelles?: string;
  rccm?: string;
  ninea?: string;
  licence?: string;
  identifiant_commercial?: string;
}

export interface UploadedFileMeta {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface RegisterProfessionalResponse {
  user: UserResponse;
  professional: {
    id: string;
    nom_structure: string;
    statut_verification: string;
  };
  verification: {
    id: string;
    statut: string;
  };
  document: {
    id: string;
    type_document: string;
    statut: string;
  };
  token: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  verifyToken(token: string): { userId: string; role: string } {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        role: string;
      };
      return decoded;
    } catch {
      throw new AppError("Token invalide ou expiré", 401, "INVALID_TOKEN");
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async register(data: RegisterDTO & { file?: UploadedFileMeta }): Promise<{ user: UserResponse; token: string }> {
    // Si c'est un professionnel, déléguer vers le parcours professionnel obligatoire
    if (data.role === "PROFESSIONNEL") {
      if (!data.file) {
        throw new AppError(
          "La pièce d'identité est obligatoire (fichier réel PDF, JPG ou PNG requis)",
          400,
          "IDENTITY_DOCUMENT_REQUIRED"
        );
      }
      return this.registerProfessional(data, data.file);
    }

    // Validation serveur Voyageur
    if (!data.nom || typeof data.nom !== "string" || !data.nom.trim()) {
      throw new AppError("Le nom est obligatoire", 400, "VALIDATION_ERROR");
    }
    if (!data.prenom || typeof data.prenom !== "string" || !data.prenom.trim()) {
      throw new AppError("Le prénom est obligatoire", 400, "VALIDATION_ERROR");
    }
    if (!data.email || typeof data.email !== "string" || !this.validateEmail(data.email.trim())) {
      throw new AppError("Un email valide est obligatoire", 400, "VALIDATION_ERROR");
    }
    if (!data.mot_de_passe || typeof data.mot_de_passe !== "string" || data.mot_de_passe.length < 6) {
      throw new AppError("Le mot de passe doit contenir au moins 6 caractères", 400, "VALIDATION_ERROR");
    }

    // Le téléphone est obligatoire pour tous les utilisateurs (numéro sénégalais validé et normalisé)
    const normalizedPhone = validateAndNormalizeSenegalPhone(data.telephone);

    const normalizedEmail = data.email.trim().toLowerCase();

    // Vérifier l'unicité de l'email pour le rôle VOYAGEUR
    const existingEmail = await db.orm.public.Utilisateur
      .where({ email: normalizedEmail, role: "VOYAGEUR" })
      .first();

    if (existingEmail) {
      throw new AppError("Un compte voyageur avec cet email existe déjà", 409, "EMAIL_ALREADY_EXISTS");
    }

    // Vérifier l'unicité du téléphone pour le rôle VOYAGEUR
    const existingPhone = await db.orm.public.Utilisateur
      .where({ telephone: normalizedPhone, role: "VOYAGEUR" })
      .first();

    if (existingPhone) {
      throw new AppError("Un compte voyageur avec ce numéro de téléphone existe déjà", 409, "PHONE_ALREADY_EXISTS");
    }

    const hashedPassword = await this.hashPassword(data.mot_de_passe);
    const userId = randomUUID();

    const createdUser = await db.orm.public.Utilisateur.create({
      id: userId,
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      email: normalizedEmail,
      telephone: normalizedPhone,
      mot_de_passe: hashedPassword,
      role: "VOYAGEUR",
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });

    const token = this.generateToken({ userId: createdUser.id, role: createdUser.role });

    return {
      user: this.sanitizeUser(createdUser),
      token,
    };
  }

  /**
   * Inscription d'un professionnel avec SEULEMENT 3 champs obligatoires :
   * 1. Nom
   * 2. Numéro de téléphone (validé et normalisé sénégalais)
   * 3. Pièce d'identité (avec fichier réel)
   *
   * Tous les autres champs sont strictement facultatifs (prénom, email, nom de structure, RCCM, NINEA, licence, etc.)
   */
  async registerProfessional(
    data: RegisterProfessionalDTO,
    file?: UploadedFileMeta
  ): Promise<RegisterProfessionalResponse> {
    // 1. Nom obligatoire
    if (!data.nom || typeof data.nom !== "string" || !data.nom.trim()) {
      throw new AppError("Le nom est obligatoire", 400, "VALIDATION_ERROR");
    }

    // 2. Numéro de téléphone obligatoire
    if (!data.telephone || typeof data.telephone !== "string" || !data.telephone.trim()) {
      throw new AppError("Le numéro de téléphone est obligatoire", 400, "INVALID_PHONE");
    }
    const normalizedPhone = validateAndNormalizeSenegalPhone(data.telephone, { allowInternational: true });

    // 3. Pièce d'identité avec fichier réel obligatoire
    if (!file || !file.filename || !file.size) {
      throw new AppError(
        "La pièce d'identité est obligatoire (fichier réel PDF, JPG ou PNG requis)",
        400,
        "IDENTITY_DOCUMENT_REQUIRED"
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new AppError(
        "La taille du fichier dépasse la limite maximale de 25 Mo.",
        400,
        "FILE_TOO_LARGE"
      );
    }

    const allowedMimes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedMimes.includes((file.mimetype || "").toLowerCase())) {
      throw new AppError(
        "Format de fichier non autorisé. Formats acceptés : PDF, JPG, JPEG, PNG.",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    // Vérifier l'unicité du téléphone pour le rôle PROFESSIONNEL
    const existingPhone = await db.orm.public.Utilisateur
      .where({ telephone: normalizedPhone, role: "PROFESSIONNEL" })
      .first();

    if (existingPhone) {
      throw new AppError("Un compte professionnel avec ce numéro de téléphone existe déjà", 409, "PHONE_ALREADY_EXISTS");
    }

    // Email facultatif : si fourni, le valider et vérifier l'unicité pour le rôle PROFESSIONNEL ; sinon générer un email système
    let normalizedEmail: string;
    if (data.email && typeof data.email === "string" && data.email.trim()) {
      if (!this.validateEmail(data.email.trim())) {
        throw new AppError("L'adresse email fournie est invalide", 400, "VALIDATION_ERROR");
      }
      normalizedEmail = data.email.trim().toLowerCase();
      const existingEmail = await db.orm.public.Utilisateur
        .where({ email: normalizedEmail, role: "PROFESSIONNEL" })
        .first();
      if (existingEmail) {
        throw new AppError("Un compte professionnel avec cet email existe déjà", 409, "EMAIL_ALREADY_EXISTS");
      }
    } else {
      const cleanDigits = normalizedPhone.replace(/\+/g, "");
      normalizedEmail = `pro.${cleanDigits}@syllavoyage.pro`;
    }

    // Mot de passe facultatif : s'il n'est pas fourni, utiliser par défaut le numéro de téléphone
    const rawPassword = data.mot_de_passe && data.mot_de_passe.trim()
      ? data.mot_de_passe.trim()
      : normalizedPhone;

    if (rawPassword.length < 6) {
      throw new AppError("Le mot de passe doit comporter au moins 6 caractères", 400, "VALIDATION_ERROR");
    }
    const hashedPassword = await this.hashPassword(rawPassword);

    // Champs facultatifs
    const prenom = data.prenom && typeof data.prenom === "string" ? data.prenom.trim() : "";
    const nomStructure = data.nom_structure && typeof data.nom_structure === "string" && data.nom_structure.trim()
      ? data.nom_structure.trim()
      : data.nom.trim();

    // Regrouper les justificatifs / identifiants administratifs facultatifs
    const extraInfos: string[] = [];
    if (data.rccm && typeof data.rccm === "string" && data.rccm.trim()) {
      extraInfos.push(`RCCM: ${data.rccm.trim()}`);
    }
    if (data.ninea && typeof data.ninea === "string" && data.ninea.trim()) {
      extraInfos.push(`NINEA: ${data.ninea.trim()}`);
    }
    if (data.licence && typeof data.licence === "string" && data.licence.trim()) {
      extraInfos.push(`Licence: ${data.licence.trim()}`);
    }
    if (data.identifiant_commercial && typeof data.identifiant_commercial === "string" && data.identifiant_commercial.trim()) {
      extraInfos.push(`ID: ${data.identifiant_commercial.trim()}`);
    }
    if (data.informations_professionnelles && typeof data.informations_professionnelles === "string" && data.informations_professionnelles.trim()) {
      extraInfos.push(data.informations_professionnelles.trim());
    }
    const infoString = extraInfos.length > 0 ? extraInfos.join(" | ") : null;

    const now = Temporal.Now.instant();
    const userId = randomUUID();
    const proId = randomUUID();
    const verificationId = randomUUID();
    const docId = randomUUID();

    // 1. Création de l'utilisateur avec rôle PROFESSIONNEL
    const createdUser = await db.orm.public.Utilisateur.create({
      id: userId,
      nom: data.nom.trim(),
      prenom: prenom,
      email: normalizedEmail,
      telephone: normalizedPhone,
      mot_de_passe: hashedPassword,
      role: "PROFESSIONNEL",
      statut: "ACTIF",
      created_at: now,
    });

    // 2. Création de la structure professionnelle en statut d'attente
    const createdPro = await db.orm.public.Professionnel.create({
      id: proId,
      utilisateur_id: userId,
      nom_structure: nomStructure,
      description: data.description && typeof data.description === "string" ? data.description.trim() : null,
      informations_professionnelles: infoString,
      statut_verification: "EN_ATTENTE", // Workflow : EN_ATTENTE
      created_at: now,
    });

    // 3. Création de la demande de vérification administrative
    await db.orm.public.Verification.create({
      id: verificationId,
      professionnel_id: proId,
      statut: "EN_ATTENTE",
      date_debut: now,
      date_decision: null,
      commentaire: null,
    });

    // 4. Enregistrement de la pièce d'identité réelle
    const createdDoc = await db.orm.public.DocumentVerification.create({
      id: docId,
      professionnel_id: proId,
      type_document: "PIECE_IDENTITE",
      fichier: file.filename, // identifiant sécurisé dans l'espace privé
      statut: "EN_ATTENTE",
      created_at: now,
    });

    const token = this.generateToken({ userId: createdUser.id, role: createdUser.role });

    return {
      user: this.sanitizeUser(createdUser),
      professional: {
        id: createdPro.id,
        nom_structure: createdPro.nom_structure,
        statut_verification: createdPro.statut_verification,
      },
      verification: {
        id: verificationId,
        statut: "EN_ATTENTE",
      },
      document: {
        id: createdDoc.id,
        type_document: createdDoc.type_document,
        statut: createdDoc.statut,
      },
      token,
    };
  }

  async login(data: LoginDTO, clientIp = "127.0.0.1"): Promise<{ user: UserResponse; token: string }> {
    const rawIdentifier = typeof data?.email === "string" ? data.email.trim() : "";
    const normalizedIdentifier = rawIdentifier.toLowerCase();

    // 1. Vérifier si le taux de 5 tentatives échouées par IP/identifiant sur 15 min est dépassé
    if (loginRateLimiter.isRateLimited(clientIp, normalizedIdentifier)) {
      throw new AppError(
        "Trop de tentatives de connexion échouées. Veuillez réessayer dans 15 minutes.",
        429,
        "TOO_MANY_REQUESTS"
      );
    }

    if (!normalizedIdentifier) {
      loginRateLimiter.recordFailedAttempt(clientIp, normalizedIdentifier);
      throw new AppError("L'email ou le numéro de téléphone est requis", 400, "VALIDATION_ERROR");
    }
    if (!data.mot_de_passe || typeof data.mot_de_passe !== "string") {
      loginRateLimiter.recordFailedAttempt(clientIp, normalizedIdentifier);
      throw new AppError("Le mot de passe est requis", 400, "VALIDATION_ERROR");
    }

    // Rechercher tous les comptes candidats par email OU par numéro de téléphone
    let candidates = await db.orm.public.Utilisateur
      .where({ email: normalizedIdentifier })
      .all();

    if (candidates.length === 0) {
      try {
        const phone = validateAndNormalizeSenegalPhone(rawIdentifier, { allowInternational: true });
        candidates = await db.orm.public.Utilisateur
          .where({ telephone: phone })
          .all();
      } catch {
        // Pas un numéro de téléphone valide, ignorer
      }
    }

    if (candidates.length === 0) {
      loginRateLimiter.recordFailedAttempt(clientIp, normalizedIdentifier);
      throw new AppError("Identifiants invalides", 401, "INVALID_CREDENTIALS");
    }

    // Si un rôle spécifique est précisé, filtrer les candidats
    if (data.role && typeof data.role === "string" && data.role.trim()) {
      const filtered = candidates.filter((c) => c.role.toUpperCase() === data.role!.trim().toUpperCase());
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    // Vérifier quel compte candidat correspond au mot de passe
    let matchedUser = null;
    for (const candidate of candidates) {
      const passwordMatches = await this.comparePassword(data.mot_de_passe, candidate.mot_de_passe);
      if (passwordMatches) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      loginRateLimiter.recordFailedAttempt(clientIp, normalizedIdentifier);
      throw new AppError("Identifiants invalides", 401, "INVALID_CREDENTIALS");
    }

    if (matchedUser.statut === "SUSPENDU") {
      throw new AppError("Ce compte est suspendu", 403, "ACCOUNT_SUSPENDED");
    }

    // Connexion réussie : réinitialiser le compteur de tentatives échouées
    loginRateLimiter.reset(clientIp, normalizedIdentifier);

    const token = this.generateToken({ userId: matchedUser.id, role: matchedUser.role });

    return {
      user: this.sanitizeUser(matchedUser),
      token,
    };
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await db.orm.public.Utilisateur
      .where({ id })
      .first();

    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Assistance en cas d'oubli de mot de passe :
   * Valide l'identifiant fourni (email ou téléphone) et indique la procédure sécurisée
   * de réinitialisation sans dépendance à un service email payant ni OTP artificiel.
   */
  async forgotPassword(rawIdentifier?: string): Promise<{ message: string }> {
    const identifiant = typeof rawIdentifier === "string" ? rawIdentifier.trim() : "";
    if (!identifiant) {
      throw new AppError("L'email ou le numéro de téléphone est requis.", 400, "VALIDATION_ERROR");
    }

    const normalized = identifiant.toLowerCase();
    let candidates = await db.orm.public.Utilisateur.where({ email: normalized }).all();
    if (candidates.length === 0) {
      try {
        const phone = validateAndNormalizeSenegalPhone(identifiant, { allowInternational: true });
        candidates = await db.orm.public.Utilisateur.where({ telephone: phone }).all();
      } catch {}
    }

    return {
      message:
        "Si un compte correspond à ces informations, votre demande a été prise en compte. Pour des raisons de sécurité, contactez le support Sylla Voyage au (+221) 33 800 00 00 ou à support@syllavoyage.sn pour finaliser la réinitialisation de vos accès.",
    };
  }

  // Omettre mot_de_passe des réponses
  private sanitizeUser(user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    role: string;
    statut: string;
    created_at: { toString(): string } | string | Date;
  }): UserResponse {
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
}

export const authService = new AuthService();
