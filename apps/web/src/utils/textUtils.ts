/**
 * Utilitaires d'affichage pur (UI uniquement)
 * Remplacement des drapeaux emojis par du texte en clair et assainissement visuel
 * sans aucune altération de données sous-jacentes.
 */

export const formatDisplayNoEmoji = (text: string | null | undefined): string => {
  if (!text) return "";
  let clean = text;

  // Remplacement intelligent évitant la duplication si le nom suit ou précède le drapeau
  clean = clean.replace(/🇨🇦\s*Canada|Canada\s*🇨🇦/gi, "Canada").replace(/🇨🇦/g, "Canada");
  clean = clean.replace(/🇸🇳\s*Sénégal|Sénégal\s*🇸🇳/gi, "Sénégal").replace(/🇸🇳/g, "Sénégal");
  clean = clean.replace(/🇨🇳\s*Chine|Chine\s*🇨🇳/gi, "Chine").replace(/🇨🇳/g, "Chine");
  clean = clean.replace(/🇫🇷\s*France|France\s*🇫🇷/gi, "France").replace(/🇫🇷/g, "France");
  clean = clean.replace(/🇺🇸\s*États-Unis|États-Unis\s*🇺🇸/gi, "États-Unis").replace(/🇺🇸/g, "États-Unis");
  clean = clean.replace(/🇲🇦\s*Maroc|Maroc\s*🇲🇦/gi, "Maroc").replace(/🇲🇦/g, "Maroc");
  clean = clean.replace(/🇨🇮\s*Côte d'Ivoire|Côte d'Ivoire\s*🇨🇮/gi, "Côte d'Ivoire").replace(/🇨🇮/g, "Côte d'Ivoire");
  clean = clean.replace(/🇬🇧\s*Royaume-Uni|Royaume-Uni\s*🇬🇧/gi, "Royaume-Uni").replace(/🇬🇧/g, "Royaume-Uni");
  clean = clean.replace(/🇦🇪\s*Dubaï|Dubaï\s*🇦🇪/gi, "Dubaï / Émirats").replace(/🇦🇪/g, "Dubaï / Émirats");

  // Remplacement des puces et pictogrammes décoratifs
  clean = clean.replace(/📍/g, "");
  clean = clean.replace(/📞/g, "");
  clean = clean.replace(/✉️|📧/g, "");
  clean = clean.replace(/✈️|🛫/g, "");
  clean = clean.replace(/🏢/g, "");
  clean = clean.replace(/🛡️|🔒/g, "");
  clean = clean.replace(/✨|⭐|🌟/g, "");
  clean = clean.replace(/👉|➡️/g, "");

  // Nettoyage générique des emojis restants pour garantir un design Apple épuré
  clean = clean.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, "");

  // Normalisation des espaces multiples
  return clean.replace(/\s{2,}/g, " ").trim();
};
