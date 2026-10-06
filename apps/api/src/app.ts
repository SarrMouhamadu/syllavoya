import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { AppError } from "./errors/AppError.js";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Sécurité Express : désactivation de l'en-tête X-Powered-By
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Configuration CORS restrictive basée sur FRONTEND_URL
const configuredOrigins = (config.frontendUrl || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Ajouter systématiquement les domaines officiels de production
const productionDomains = ["https://syllavoyage.com", "https://www.syllavoyage.com"];
for (const prodDomain of productionDomains) {
  if (!allowedOrigins.includes(prodDomain)) {
    allowedOrigins.push(prodDomain);
  }
}

for (const origin of configuredOrigins) {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin);
  }
  // Accepter automatiquement la variante www / apex si syllavoyage.com est configuré
  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "syllavoyage.com") {
      const wwwOrigin = `${parsed.protocol}//www.${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
      if (!allowedOrigins.includes(wwwOrigin)) {
        allowedOrigins.push(wwwOrigin);
      }
    } else if (parsed.hostname === "www.syllavoyage.com") {
      const apexHostname = parsed.hostname.replace(/^www\./, "");
      const apexOrigin = `${parsed.protocol}//${apexHostname}${parsed.port ? `:${parsed.port}` : ""}`;
      if (!allowedOrigins.includes(apexOrigin)) {
        allowedOrigins.push(apexOrigin);
      }
    }
  } catch {
    // Ignorer URL invalide
  }
}

// En environnement hors-production, préserver le développement local
if (config.nodeEnv !== "production") {
  const localDevOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];
  for (const devOrigin of localDevOrigins) {
    if (!allowedOrigins.includes(devOrigin)) {
      allowedOrigins.push(devOrigin);
    }
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans en-tête Origin (ex: curl, tests automatisés, webhooks serveur à serveur)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      // Rejeter explicitement toute origine non autorisée
      return callback(
        new AppError(
          `Origine '${origin}' non autorisée par la politique CORS.`,
          403,
          "CORS_FORBIDDEN"
        )
      );
    },
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes
app.use("/api", apiRouter);

// 404 Not Found handling
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);
