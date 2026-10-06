import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "verification");

// S'assurer que le dossier privé existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${randomUUID()}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"];
  if (mime.startsWith("video/") || videoExtensions.includes(ext)) {
    return cb(
      new AppError(
        "Les vidéos sont formellement refusées. Seules les photos (JPG, PNG) et documents PDF sont acceptés.",
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(
      new AppError(
        "Format de fichier non autorisé. Formats acceptés : PDF, JPG, JPEG, PNG.",
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
  cb(null, true);
};

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Middleware Express pour intercepter l'upload de pièce d'identité
 * et traduire proprement les erreurs Multer (ex: dépassement des 25 Mo).
 */
export function uploadIdentityDocument(fieldName = "piece_identite") {
  const uploader = multerUpload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    uploader(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new AppError(
                "La taille du fichier dépasse la limite maximale de 25 Mo.",
                400,
                "FILE_TOO_LARGE"
              )
            );
          }
          return next(new AppError(`Erreur de téléchargement : ${err.message}`, 400, "UPLOAD_ERROR"));
        }
        return next(err);
      }
      next();
    });
  };
}
