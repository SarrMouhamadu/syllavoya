import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { AppError } from "./errors/AppError.js";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Configuration CORS restrictive
const allowedOrigins = (config.frontendUrl || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

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
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

// API Routes
app.use("/api", apiRouter);

// 404 Not Found handling
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);
