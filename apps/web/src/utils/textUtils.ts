/**
 * Utilitaires d'affichage pur (UI uniquement)
 * Remplacement des drapeaux emojis par du texte en clair et assainissement visuel
 * sans aucune altération de données sous-jacentes.
 */

export const formatDisplayNoEmoji = (text: string | null | undefined): string => {
  if (!text) return "";
  let clean = text;

  // Remplacement des drapeaux fréquents par leurs noms de pays
  clean = clean.replace(/🇨🇦/g, "Canada");
  clean = clean.replace(/🇸🇳/g, "Sénégal");
  clean = clean.replace(/🇨🇳/g, "Chine");
  clean = clean.replace(/🇫🇷/g, "France");
  clean = clean.replace(/🇺🇸/g, "États-Unis");
  clean = clean.replace(/🇲🇦/g, "Maroc");
  clean = clean.replace(/🇨🇮/g, "Côte d'Ivoire");
  clean = clean.replace(/🇬🇧/g, "Royaume-Uni");
  clean = clean.replace(/🇦🇪/g, "Dubaï / Émirats");

  // Remplacement des puces / emojis décoratifs par du texte propre
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
