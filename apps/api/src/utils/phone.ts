import { AppError } from "../errors/AppError.js";

/**
 * Valide et normalise un numéro de téléphone sénégalais.
 * Formats acceptés :
 * - +221 77 123 45 67, +221771234567
 * - 00221 77 123 45 67, 00221771234567
 * - 221771234567
 * - 77 123 45 67, 771234567
 * - Préfixes valides : 70, 75, 76, 77, 78 (mobiles) et 33 (fixe)
 *
 * Format cohérent stocké : E.164 (+221XXXXXXXXX)
 */
export function validateAndNormalizeSenegalPhone(rawPhone: unknown): string {
  if (typeof rawPhone !== "string") {
    throw new AppError("Le numéro de téléphone est obligatoire", 400, "INVALID_PHONE");
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    throw new AppError("Le numéro de téléphone est obligatoire", 400, "INVALID_PHONE");
  }

  // Supprimer les caractères de formatage courants (espaces, tirets, points, parenthèses, slashes)
  let cleaned = trimmed.replace(/[\s\.\-\(\)\/]/g, "");

  // Traiter le préfixe international
  if (cleaned.startsWith("+221")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("00221")) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith("221") && cleaned.length === 12) {
    cleaned = cleaned.slice(3);
  }

  // Doit comporter exactement 9 chiffres après retrait de l'indicatif pays
  if (!/^\d{9}$/.test(cleaned)) {
    throw new AppError(
      "Le numéro de téléphone doit comporter 9 chiffres (ex: 77 123 45 67 ou +221 77 123 45 67)",
      400,
      "INVALID_PHONE"
    );
  }

  // Préfixes sénégalais autorisés (70 Expresso, 75 Promobile, 76 Free, 77 Orange, 78 Orange, 33 Fixe Sonatel)
  const prefix = cleaned.slice(0, 2);
  const validPrefixes = ["70", "75", "76", "77", "78", "33"];
  if (!validPrefixes.includes(prefix)) {
    throw new AppError(
      "Numéro de téléphone sénégalais invalide (doit commencer par 70, 75, 76, 77, 78 ou 33)",
      400,
      "INVALID_PHONE"
    );
  }

  return `+221${cleaned}`;
}
