# Sylla Voyage — MLD MERISE

## 1. Objectif

Le Modèle Logique de Données (MLD) traduit le MCD en relations logiques.

Il précise les tables, les clés primaires et les clés étrangères qui serviront de base à l'implémentation de la base PostgreSQL.

---

## 2. Tables principales

### UTILISATEUR

- id : clé primaire
- nom
- prénom
- email
- téléphone
- mot_de_passe
- rôle
- statut
- created_at

---

### PROFESSIONNEL

- id : clé primaire
- utilisateur_id : clé étrangère vers UTILISATEUR
- nom_structure
- description
- informations_professionnelles
- statut_verification
- created_at

---

### DOCUMENT_VERIFICATION

- id : clé primaire
- professionnel_id : clé étrangère vers PROFESSIONNEL
- type_document
- fichier
- statut
- created_at

---

### VERIFICATION

- id : clé primaire
- professionnel_id : clé étrangère vers PROFESSIONNEL
- statut
- date_debut
- date_decision
- commentaire

---

### FORMULE_ABONNEMENT

- id : clé primaire
- nom
- durée
- prix
- type_utilisateur
- statut

---

### ABONNEMENT

- id : clé primaire
- utilisateur_id : clé étrangère vers UTILISATEUR
- formule_id : clé étrangère vers FORMULE_ABONNEMENT
- date_debut
- date_fin
- statut

---

### PAIEMENT

- id : clé primaire
- abonnement_id : clé étrangère vers ABONNEMENT
- reference
- montant
- statut
- moyen_paiement
- date_creation
- date_confirmation

---

### PUBLICATION

- id : clé primaire
- professionnel_id : clé étrangère vers PROFESSIONNEL
- titre
- contenu
- statut
- date_creation
- date_publication

---

### CONVERSATION

- id : clé primaire
- voyageur_id : clé étrangère vers UTILISATEUR
- professionnel_id : clé étrangère vers PROFESSIONNEL
- date_creation
- statut

---

### MESSAGE

- id : clé primaire
- conversation_id : clé étrangère vers CONVERSATION
- expediteur_id : clé étrangère vers UTILISATEUR
- contenu
- date_envoi
- statut

---

### DOCUMENT_ECHANGE

- id : clé primaire
- conversation_id : clé étrangère vers CONVERSATION
- expediteur_id : clé étrangère vers UTILISATEUR
- fichier
- date_envoi

---

### SIGNALEMENT

- id : clé primaire
- utilisateur_id : clé étrangère vers UTILISATEUR
- type_cible
- cible_id
- motif
- description
- statut
- date_creation

---

### AUDIT_LOG

- id : clé primaire
- utilisateur_id : clé étrangère vers UTILISATEUR
- action
- date
- informations_complementaires

---

## 3. Relations et clés étrangères

```text
PROFESSIONNEL.utilisateur_id
    → UTILISATEUR.id

DOCUMENT_VERIFICATION.professionnel_id
    → PROFESSIONNEL.id

VERIFICATION.professionnel_id
    → PROFESSIONNEL.id

ABONNEMENT.utilisateur_id
    → UTILISATEUR.id

ABONNEMENT.formule_id
    → FORMULE_ABONNEMENT.id

PAIEMENT.abonnement_id
    → ABONNEMENT.id

PUBLICATION.professionnel_id
    → PROFESSIONNEL.id

CONVERSATION.voyageur_id
    → UTILISATEUR.id

CONVERSATION.professionnel_id
    → PROFESSIONNEL.id

MESSAGE.conversation_id
    → CONVERSATION.id

MESSAGE.expediteur_id
    → UTILISATEUR.id

DOCUMENT_ECHANGE.conversation_id
    → CONVERSATION.id

DOCUMENT_ECHANGE.expediteur_id
    → UTILISATEUR.id

SIGNALEMENT.utilisateur_id
    → UTILISATEUR.id

AUDIT_LOG.utilisateur_id
    → UTILISATEUR.id
```
