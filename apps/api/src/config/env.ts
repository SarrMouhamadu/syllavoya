import dotenv from "dotenv";

dotenv.config();

// Liste des variables d'environnement obligatoires (secrets critiques)
const REQUIRED_SECRETS = [
  "JWT_SECRET",
  "NABOOPAY_WEBHOOK_SECRET",
  "BICTORYS_WEBHOOK_SECRET",
] as const;

export function validateRequiredEnv(): void {
  const missing = REQUIRED_SECRETS.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(
      `[SÉCURITÉ CRITIQUE] Démarrage impossible : les variables d'environnement obligatoires suivantes sont manquantes ou vides : ${missing.join(", ")}`
    );
  }
}

// Validation immédiate au chargement du module
validateRequiredEnv();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET!.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  naboopayApiKey: process.env.NABOOPAY_API_KEY || "",
  naboopayWebhookSecret: process.env.NABOOPAY_WEBHOOK_SECRET!.trim(),
  naboopayBaseUrl: process.env.NABOOPAY_BASE_URL || "https://api.naboopay.com",
  bictorysApiKey: process.env.BICTORYS_API_KEY || "",
  bictorysWebhookSecret: process.env.BICTORYS_WEBHOOK_SECRET!.trim(),
  bictorysBaseUrl: process.env.BICTORYS_BASE_URL || "https://api.bictorys.com",
};

