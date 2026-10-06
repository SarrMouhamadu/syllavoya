import type { ApiPublication } from "../api/publications";
import { parsePublicationContent } from "../api/publications";

/**
 * Exporte une liste de publications en fichier CSV compatible Excel/Numbers
 * avec encodage UTF-8 BOM pour préserver les caractères accentués français.
 */
export function exportPublicationsToCSV(
  publications: ApiPublication[],
  filenamePrefix = "sylla-voyage-publications"
): void {
  if (!publications || publications.length === 0) {
    alert("Aucune publication à exporter.");
    return;
  }

  const headers = [
    "ID",
    "Titre",
    "Statut",
    "Structure / Agence",
    "Date de création",
    "Date de publication",
    "Détails de l'offre",
    "Photo jointe",
  ];

  const escapeCSV = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const text = String(val).replace(/"/g, '""');
    return `"${text}"`;
  };

  const rows = publications.map((pub) => {
    const parsed = parsePublicationContent(pub.contenu);
    const author = pub.professionnel?.nom_structure || "Mon agence";
    const dateCreation = pub.date_creation
      ? new Date(pub.date_creation).toLocaleString("fr-FR")
      : "";
    const datePublication = pub.date_publication
      ? new Date(pub.date_publication).toLocaleString("fr-FR")
      : "";

    return [
      escapeCSV(pub.id),
      escapeCSV(pub.titre),
      escapeCSV(pub.statut),
      escapeCSV(author),
      escapeCSV(dateCreation),
      escapeCSV(datePublication),
      escapeCSV(parsed.text),
      escapeCSV(parsed.photoUrl ? "Oui" : "Non"),
    ].join(";");
  });

  // UTF-8 BOM (\uFEFF) garantit que les accents français (é, è, ê, etc.) s'affichent parfaitement
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const now = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}-${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
