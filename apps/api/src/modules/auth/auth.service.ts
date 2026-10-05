import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import { db } from "../../db.js";
import { config } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";

export interface RegisterDTO {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  telephone?: string | null;
  role?: string;
}

export interface LoginDTO {
  email: string;
  mot_de_passe: string;
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

  async register(data: RegisterDTO): Promise<{ user: UserResponse; token: string }> {
    // Validation serveur
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

    const normalizedEmail = data.email.trim().toLowerCase();

    // Vérifier l'unicité de l'email
    const existing = await db.orm.public.Utilisateur
      .where({ email: normalizedEmail })
      .first();

    if (existing) {
      throw new AppError("Un compte avec cet email existe déjà", 409, "EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await this.hashPassword(data.mot_de_passe);
    const userId = randomUUID();
    const role = data.role === "PROFESSIONNEL" ? "PROFESSIONNEL" : "VOYAGEUR";

    const createdUser = await db.orm.public.Utilisateur.create({
      id: userId,
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      email: normalizedEmail,
      telephone: data.telephone ? data.telephone.trim() : null,
      mot_de_passe: hashedPassword,
      role: role,
      statut: "ACTIF",
      created_at: Temporal.Now.instant(),
    });

    const token = this.generateToken({ userId: createdUser.id, role: createdUser.role });

    return {
      user: this.sanitizeUser(createdUser),
      token,
    };
  }

  async login(data: LoginDTO): Promise<{ user: UserResponse; token: string }> {
    if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
      throw new AppError("L'email est requis", 400, "VALIDATION_ERROR");
    }
    if (!data.mot_de_passe || typeof data.mot_de_passe !== "string") {
      throw new AppError("Le mot de passe est requis", 400, "VALIDATION_ERROR");
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await db.orm.public.Utilisateur
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      // Do not disclose whether email or password is wrong
      throw new AppError("Identifiants invalides", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await this.comparePassword(data.mot_de_passe, user.mot_de_passe);
    if (!passwordMatches) {
      throw new AppError("Identifiants invalides", 401, "INVALID_CREDENTIALS");
    }

    if (user.statut === "SUSPENDU") {
      throw new AppError("Ce compte est suspendu", 403, "ACCOUNT_SUSPENDED");
    }

    const token = this.generateToken({ userId: user.id, role: user.role });

    return {
      user: this.sanitizeUser(user),
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
