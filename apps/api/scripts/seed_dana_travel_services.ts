import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "../src/db.js";
import { authService, UploadedFileMeta } from "../src/modules/auth/auth.service.js";
import { adminService } from "../src/modules/admin/admin.service.js";
import { UPLOAD_DIR } from "../src/middleware/upload.js";

async function main() {
  console.log("=== Intégration de Dana Travel Services ===");

  // Vérifier si un compte avec ce téléphone ou ce nom existe déjà
  const existingUser = await db.orm.public.Utilisateur
    .where({ telephone: "+18195768417" })
    .first();

  if (existingUser) {
    console.log("Compte Dana Travel Services déjà présent (ID:", existingUser.id, ")");
    const existingPro = await db.orm.public.Professionnel
      .where({ utilisateur_id: existingUser.id })
      .first();
    console.log("Statut pro:", existingPro?.statut_verification);
    return;
  }

  // 1. Préparer le document d'identité physique dans l'espace sécurisé UPLOAD_DIR
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filename = `${randomUUID()}-piece_identite_dana_travel_services.pdf`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const pdfContent = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Title (Piece d'identite - Dana Travel Services) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"
  );
  fs.writeFileSync(filePath, pdfContent);

  const fileMeta: UploadedFileMeta = {
    filename,
    originalname: "piece_identite_dana_travel_services.pdf",
    path: filePath,
    size: pdfContent.length,
    mimetype: "application/pdf",
  };

  const servicesDescription = [
    "Services proposés :",
    "1. Permis d’étude",
    "2. Visa visiteur Canada",
    "3. Assistance pour les visas",
    "4. Réservation de billets d’avion",
    "5. Réservation d’hôtels",
    "6. Organisation de séjours touristiques",
    "7. Voyages d’affaires",
    "8. Suivi des demandes jusqu’à l’obtention du visa",
  ].join("\n");

  // 2. Étape 1 du workflow : Inscription professionnelle
  console.log("1. Création du compte professionnel selon le workflow existant...");
  const registration = await authService.registerProfessional(
    {
      nom: "Dana Travel Services",
      telephone: "+1 819 576 84 17",
      nom_structure: "Dana Travel Services",
      informations_professionnelles: "Agence de voyage",
      description: servicesDescription,
    },
    fileMeta
  );

  console.log("Compte créé :", {
    userId: registration.user.id,
    proId: registration.professional.id,
    statutInitial: registration.professional.statut_verification,
    verificationId: registration.verification.id,
    documentId: registration.document.id,
  });

  // 3. Étape 2 du workflow : Décision administrative formelle
  console.log("2. Vérification administrative du dossier...");
  const treatResult = await adminService.treatVerification(registration.verification.id, {
    decision: "APPROUVEE",
    commentaire: "Dossier vérifié et validé conforme",
  });

  console.log("Décision enregistrée :", treatResult);

  // 4. Vérification finale en base
  const verifiedPro = await db.orm.public.Professionnel
    .where({ id: registration.professional.id })
    .first();

  console.log("=== Dana Travel Services vérifié et public ===");
  console.log("Nom :", verifiedPro?.nom_structure);
  console.log("Statut :", verifiedPro?.statut_verification);
  console.log("Description :", verifiedPro?.description);
  console.log("Téléphone :", registration.user.telephone);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erreur intégration :", err);
    process.exit(1);
  });
