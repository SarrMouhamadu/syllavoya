import { db } from "../src/db.js";

async function main() {
  console.log("=== Intégration officielle de Dana Travel Services ===");

  // 1. Nettoyer tout ancien compte Dana Travel si présent
  const existingPros = await db.orm.public.Professionnel
    .where({ nom_structure: "Dana Travel Services" })
    .all();

  for (const p of existingPros) {
    try {
      await db.orm.public.Publication.where({ professionnel_id: p.id }).delete();
    } catch (_) {}
    try {
      await db.orm.public.Verification.where({ professionnel_id: p.id }).delete();
    } catch (_) {}
    try {
      await db.orm.public.Professionnel.where({ id: p.id }).delete();
    } catch (_) {}
    try {
      await db.orm.public.Utilisateur.where({ id: p.utilisateur_id }).delete();
    } catch (_) {}
  }

  // Nettoyer par email
  try {
    await db.orm.public.Utilisateur
      .where({ email: "info.danatravelservices@gmail.com" })
      .delete();
  } catch (_) {}

  // 2. Créer l'utilisateur officiel Dana Travel Services
  const user = await db.orm.public.Utilisateur.create({
    id: "d4a1a001-dana-4000-8000-000000000001",
    nom: "Services",
    prenom: "Dana Travel",
    email: "info.danatravelservices@gmail.com",
    telephone: "+18195768417",
    mot_de_passe: "$2b$10$dk7KAjD1/K/fV2wFuCdTTuIIsqdZ9vzBTtnmV4W9DsbamtCqKU.de",
    role: "PROFESSIONNEL",
    statut: "ACTIF",
  });

  // 3. Créer le profil professionnel de l'agence
  const proDescription = [
    "Conseil · Accompagnement · Suivi",
    "",
    "Services proposés :",
    "• Permis d’études pour le Canada",
    "• Visa visiteur pour le Canada",
    "• Suivi de la demande jusqu’à l’obtention du visa",
    "• Assistance pour les visas",
    "• Réservation de billets d’avion",
    "• Réservation d’hôtels",
    "• Organisation de séjours touristiques",
    "• Voyages d’affaires",
    "",
    "Destinations : 🇨🇦 Canada · 🇸🇳 Sénégal · 🇨🇳 Chine",
    "Slogan : « Votre partenaire de voyage de confiance »",
  ].join("\n");

  const pro = await db.orm.public.Professionnel.create({
    id: "d4a1a002-dana-4000-8000-000000000002",
    utilisateur_id: user.id,
    nom_structure: "Dana Travel Services",
    description: proDescription,
    informations_professionnelles: "Agence de voyage | Slogan : « Votre partenaire de voyage de confiance » | Destinations : 🇨🇦 Canada · 🇸🇳 Sénégal · 🇨🇳 Chine",
    statut_verification: "VERIFIE",
  });

  // 4. Créer la vérification approuvée
  await db.orm.public.Verification.create({
    id: "d4a1a003-dana-4000-8000-000000000003",
    professionnel_id: pro.id,
    statut: "APPROUVEE",
    commentaire: "Dossier vérifié et validé conforme par l'administration Sylla Voyage",
  });

  // 5. Créer l'abonnement professionnel annuel
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  await db.orm.public.Abonnement.create({
    id: "d4a1a005-dana-4000-8000-000000000005",
    utilisateur_id: user.id,
    formule_id: "formule-professionnel-annuel",
    date_debut: now,
    date_fin: nextYear,
    statut: "ACTIF",
  });

  // 6. Créer les deux publications officielles de services
  await db.orm.public.Publication.create({
    id: "d4a1a006-dana-4000-8000-000000000006",
    professionnel_id: pro.id,
    titre: "Assistance Visa & Permis d’études pour le Canada",
    contenu: [
      "Dana Travel Services vous accompagne dans l’ensemble de vos formalités vers le Canada :",
      "",
      "• Permis d’études pour le Canada",
      "• Visa visiteur pour le Canada",
      "• Suivi de la demande jusqu’à l’obtention du visa",
      "• Assistance pour les visas",
      "",
      "« Votre partenaire de voyage de confiance »",
      "",
      "Coordonnées :",
      "E-mail : info.danatravelservices@gmail.com",
      "Téléphone : +1 819 576 8417",
    ].join("\n"),
    statut: "APPROUVEE",
  });

  await db.orm.public.Publication.create({
    id: "d4a1a007-dana-4000-8000-000000000007",
    professionnel_id: pro.id,
    titre: "Billetterie, Hôtels & Séjours touristiques : Canada, Sénégal, Chine",
    contenu: [
      "Conseil · Accompagnement · Suivi pour tous vos projets de voyage :",
      "",
      "• Réservation de billets d’avion",
      "• Réservation d’hôtels",
      "• Organisation de séjours touristiques",
      "• Voyages d’affaires",
      "",
      "Destinations proposées :",
      "🇨🇦 Canada · 🇸🇳 Sénégal · 🇨🇳 Chine",
      "",
      "« Votre partenaire de voyage de confiance »",
      "",
      "Coordonnées directes :",
      "E-mail : info.danatravelservices@gmail.com",
      "Téléphone : +1 819 576 8417",
    ].join("\n"),
    statut: "APPROUVEE",
  });

  console.log("=== Dana Travel Services configuré avec succès avec ses 2 publications ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erreur seeding Dana Travel :", err);
    process.exit(1);
  });
