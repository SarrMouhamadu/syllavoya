import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { authService, UploadedFileMeta } from "./modules/auth/auth.service.js";
import { adminService } from "./modules/admin/admin.service.js";
import { verificationService } from "./modules/verification/verification.service.js";
import { UPLOAD_DIR } from "./middleware/upload.js";
import { AppError } from "./errors/AppError.js";

describe("Étape 2 : Professionnel — Inscription, Pièce d'identité et Vérification", () => {
  const cleanupUserIds: string[] = [];
  const cleanupProIds: string[] = [];
  const cleanupVerifIds: string[] = [];
  const cleanupDocIds: string[] = [];
  const createdTestFiles: string[] = [];

  // Helper pour créer un fichier de test temporaire dans UPLOAD_DIR
  function createTestFile(filename: string, content: Buffer | string): UploadedFileMeta {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    const ext = path.extname(filename).toLowerCase();
    const uniqueFilename = `${randomUUID()}-${path.basename(filename, ext)}${ext}`;
    const fullPath = path.join(UPLOAD_DIR, uniqueFilename);
    fs.writeFileSync(fullPath, content);
    createdTestFiles.push(fullPath);

    const stat = fs.statSync(fullPath);
    let mimetype = "application/octet-stream";
    if (ext === ".pdf") mimetype = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") mimetype = "image/jpeg";
    else if (ext === ".png") mimetype = "image/png";
    else if (ext === ".txt") mimetype = "text/plain";

    return {
      filename: uniqueFilename,
      originalname: filename,
      path: fullPath,
      size: stat.size,
      mimetype,
    };
  }

  after(async () => {
    // Nettoyage en base
    for (const docId of cleanupDocIds) {
      try {
        await db.orm.public.DocumentVerification.where({ id: docId }).delete();
      } catch {}
    }
    for (const verifId of cleanupVerifIds) {
      try {
        await db.orm.public.Verification.where({ id: verifId }).delete();
      } catch {}
    }
    for (const proId of cleanupProIds) {
      try {
        await db.orm.public.Professionnel.where({ id: proId }).delete();
      } catch {}
    }
    for (const userId of cleanupUserIds) {
      try {
        await db.orm.public.Utilisateur.where({ id: userId }).delete();
      } catch {}
    }

    // Nettoyage des fichiers de test
    for (const fpath of createdTestFiles) {
      try {
        if (fs.existsSync(fpath)) {
          fs.unlinkSync(fpath);
        }
      } catch {}
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Inscription professionnel avec UNIQUEMENT Nom + Téléphone + Pièce d'identité
  // ---------------------------------------------------------------------------
  test("1. Inscription pro avec uniquement Nom + Téléphone + Pièce d'identité (sans email, prénom ou licence)", async () => {
    const testFile = createTestFile("cni_recto.pdf", Buffer.from("%PDF-1.4 test document"));
    const phone = "+221 77 987 65 43";

    const res = await authService.registerProfessional(
      {
        nom: "Agence Teranga Express",
        telephone: phone,
      },
      testFile
    );

    cleanupUserIds.push(res.user.id);
    cleanupProIds.push(res.professional.id);
    cleanupVerifIds.push(res.verification.id);
    cleanupDocIds.push(res.document.id);

    // Vérification du rôle et des statuts initiaux EN_ATTENTE
    assert.equal(res.user.nom, "Agence Teranga Express");
    assert.equal(res.user.role, "PROFESSIONNEL");
    assert.equal(res.professional.statut_verification, "EN_ATTENTE");
    assert.equal(res.verification.statut, "EN_ATTENTE");
    assert.equal(res.document.type_document, "PIECE_IDENTITE");
    assert.equal(res.document.statut, "EN_ATTENTE");

    // Email système généré automatiquement
    assert.ok(res.user.email.includes("@syllavoyage.pro"));

    // Vérification que le fichier existe physiquement dans l'espace privé
    const storedDoc = await db.orm.public.DocumentVerification
      .where({ id: res.document.id })
      .first();
    assert.ok(storedDoc);
    const fullPath = path.resolve(UPLOAD_DIR, storedDoc.fichier);
    assert.ok(fs.existsSync(fullPath), "Le fichier de pièce d'identité doit être présent sur le disque");

    // Connexion avec le téléphone et le mot de passe par défaut
    const loginRes = await authService.login({
      email: phone,
      mot_de_passe: "+221779876543",
    });
    assert.equal(loginRes.user.id, res.user.id);
  });

  // ---------------------------------------------------------------------------
  // 2. Rejet si l'un des 3 éléments obligatoires manque
  // ---------------------------------------------------------------------------
  test("2. Rejet si l'un des 3 éléments obligatoires manque", async () => {
    const validFile = createTestFile("cni.jpg", Buffer.from("fake-jpg-content"));

    // 2a. Nom manquant
    await assert.rejects(
      async () => {
        await authService.registerProfessional(
          {
            nom: "",
            telephone: "+221 77 100 00 01",
          },
          validFile
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );

    // 2b. Téléphone manquant
    await assert.rejects(
      async () => {
        await authService.registerProfessional(
          {
            nom: "Guide Safi",
            telephone: "",
          },
          validFile
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );

    // 2c. Pièce d'identité manquante
    await assert.rejects(
      async () => {
        await authService.registerProfessional(
          {
            nom: "Guide Safi",
            telephone: "+221 77 100 00 02",
          },
          undefined
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "IDENTITY_DOCUMENT_REQUIRED");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Upload d'un fichier autorisé (PDF, JPG, PNG)
  // ---------------------------------------------------------------------------
  test("3. Upload d'un fichier autorisé (PDF, JPG, PNG)", async () => {
    // 3a. PDF
    const pdfFile = createTestFile("cni.pdf", Buffer.from("%PDF-1.4 test"));
    const resPdf = await authService.registerProfessional(
      { nom: "Pro PDF", telephone: "+221 78 111 00 01" },
      pdfFile
    );
    cleanupUserIds.push(resPdf.user.id);
    cleanupProIds.push(resPdf.professional.id);
    cleanupVerifIds.push(resPdf.verification.id);
    cleanupDocIds.push(resPdf.document.id);
    assert.ok(resPdf.token);

    // 3b. PNG
    const pngFile = createTestFile("passeport.png", Buffer.from("\x89PNG\r\n\x1a\n"));
    const resPng = await authService.registerProfessional(
      { nom: "Pro PNG", telephone: "+221 78 111 00 02" },
      pngFile
    );
    cleanupUserIds.push(resPng.user.id);
    cleanupProIds.push(resPng.professional.id);
    cleanupVerifIds.push(resPng.verification.id);
    cleanupDocIds.push(resPng.document.id);
    assert.ok(resPng.token);
  });

  // ---------------------------------------------------------------------------
  // 4. Rejet d'un type de fichier interdit
  // ---------------------------------------------------------------------------
  test("4. Rejet d'un type de fichier interdit (ex: .txt)", async () => {
    const invalidFile = createTestFile("document.txt", "Texte simple non permis");

    await assert.rejects(
      async () => {
        await authService.registerProfessional(
          { nom: "Pro Fraud", telephone: "+221 76 222 33 44" },
          invalidFile
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "INVALID_FILE_TYPE");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Rejet d'un fichier > 25 MB
  // ---------------------------------------------------------------------------
  test("5. Rejet d'un fichier dépassant 25 Mo", async () => {
    const oversizedFile: UploadedFileMeta = {
      filename: "huge.pdf",
      originalname: "huge.pdf",
      path: "/fake/path/huge.pdf",
      size: 26 * 1024 * 1024, // 26 MB
      mimetype: "application/pdf",
    };

    await assert.rejects(
      async () => {
        await authService.registerProfessional(
          { nom: "Pro Huge", telephone: "+221 76 333 44 55" },
          oversizedFile
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "FILE_TOO_LARGE");
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Accès au document uniquement pour les utilisateurs autorisés
  // ---------------------------------------------------------------------------
  test("6. Accès au document : propriétaire et admin autorisés, tiers refusé avec 403", async () => {
    // Création d'un pro
    const file = createTestFile("cni_confidentielle.pdf", Buffer.from("%PDF-secret"));
    const proReg = await authService.registerProfessional(
      { nom: "Pro Confidentiel", telephone: "+221 77 444 55 66" },
      file
    );
    cleanupUserIds.push(proReg.user.id);
    cleanupProIds.push(proReg.professional.id);
    cleanupVerifIds.push(proReg.verification.id);
    cleanupDocIds.push(proReg.document.id);

    // Création d'un utilisateur tiers (voyageur lambda)
    const otherUser = await authService.register({
      nom: "Voyageur",
      prenom: "Curieux",
      email: `curieux.${Date.now()}@syllavoyage.com`,
      mot_de_passe: "password123",
      telephone: "+221 77 555 66 77",
      role: "VOYAGEUR",
    });
    cleanupUserIds.push(otherUser.user.id);

    // Mock Express Response
    const createMockRes = () => {
      let sentStatusCode = 200;
      let sentHeaders: Record<string, string> = {};
      let streamed = false;

      return {
        status(code: number) {
          sentStatusCode = code;
          return this;
        },
        setHeader(name: string, value: string) {
          sentHeaders[name] = value;
        },
        get sentStatusCode() {
          return sentStatusCode;
        },
        get streamed() {
          return streamed;
        },
      } as any;
    };

    // 6a. Utilisateur tiers tente d'accéder au document -> 403 FORBIDDEN
    const resTiers = createMockRes();
    await assert.rejects(
      async () => {
        await verificationService.serveDocumentFile(
          proReg.document.id,
          otherUser.user.id,
          "VOYAGEUR",
          resTiers
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, "FORBIDDEN");
        return true;
      }
    );

    // 6b. Propriétaire du document accède au document -> OK (ne rejette pas)
    const resOwner = createMockRes();
    // Stub stream pour éviter l'appel direct au socket
    const mockFileStream = {
      pipe: () => {},
      on: (_event: string, cb: any) => {
        if (_event === "error") return;
        cb();
      },
    };
    const origCreateReadStream = fs.createReadStream;
    (fs as any).createReadStream = () => mockFileStream;

    try {
      await verificationService.serveDocumentFile(
        proReg.document.id,
        proReg.user.id,
        "PROFESSIONNEL",
        resOwner
      );
      assert.equal(resOwner.sentStatusCode, 200);
    } finally {
      (fs as any).createReadStream = origCreateReadStream;
    }

    // 6c. Administrateur accède au document -> OK
    const resAdmin = createMockRes();
    (fs as any).createReadStream = () => mockFileStream;
    try {
      await verificationService.serveDocumentFile(
        proReg.document.id,
        "admin-id-arbitraire",
        "ADMIN",
        resAdmin
      );
      assert.equal(resAdmin.sentStatusCode, 200);
    } finally {
      (fs as any).createReadStream = origCreateReadStream;
    }
  });

  // ---------------------------------------------------------------------------
  // 7. Approbation, Rejet et Suspension par l'Admin
  // ---------------------------------------------------------------------------
  test("7. Workflow admin : Approbation (VERIFIE), Suspension (SUSPENDU) et Rejet (REJETE)", async () => {
    const file = createTestFile("cni_workflow.pdf", Buffer.from("%PDF-workflow"));
    const proReg = await authService.registerProfessional(
      { nom: "Pro Workflow", telephone: "+221 70 888 99 00" },
      file
    );
    cleanupUserIds.push(proReg.user.id);
    cleanupProIds.push(proReg.professional.id);
    cleanupVerifIds.push(proReg.verification.id);
    cleanupDocIds.push(proReg.document.id);

    // État initial
    assert.equal(proReg.professional.statut_verification, "EN_ATTENTE");

    // 7a. Admin APPROUVE
    const approved = await adminService.treatVerification(proReg.verification.id, {
      decision: "APPROUVEE",
      commentaire: "Dossier et CNI validés avec succès",
    });
    assert.equal(approved.professionnel.statut_verification, "VERIFIE");
    assert.equal(approved.verification.statut, "APPROUVEE");

    // Vérifier en base
    const proInDb = await db.orm.public.Professionnel
      .where({ id: proReg.professional.id })
      .first();
    assert.equal(proInDb?.statut_verification, "VERIFIE");

    const docInDb = await db.orm.public.DocumentVerification
      .where({ id: proReg.document.id })
      .first();
    assert.equal(docInDb?.statut, "APPROUVE");

    // 7b. Admin SUSPEND le professionnel
    const suspended = await adminService.treatVerification(proReg.verification.id, {
      decision: "SUSPENDUE",
      commentaire: "Suspension temporaire pour mise à jour",
    });
    assert.equal(suspended.professionnel.statut_verification, "SUSPENDU");

    const proSuspendedInDb = await db.orm.public.Professionnel
      .where({ id: proReg.professional.id })
      .first();
    assert.equal(proSuspendedInDb?.statut_verification, "SUSPENDU");

    // 7c. Admin REJETTE
    const rejected = await adminService.treatVerification(proReg.verification.id, {
      decision: "REJETEE",
      commentaire: "Document non conforme aux exigences",
    });
    assert.equal(rejected.professionnel.statut_verification, "REJETE");

    const docRejectedInDb = await db.orm.public.DocumentVerification
      .where({ id: proReg.document.id })
      .first();
    assert.equal(docRejectedInDb?.statut, "REJETE");
  });
});
