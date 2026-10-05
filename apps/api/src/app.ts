import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Global middleware
app.use(cors());
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
