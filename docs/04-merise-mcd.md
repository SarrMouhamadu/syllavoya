# Sylla Voyage — MCD MERISE

## 1. Objectif

Le Modèle Conceptuel de Données (MCD) décrit les principales données de Sylla Voyage et les relations entre elles.

Il constitue la base du futur modèle de données.

Aucune implémentation technique ne doit être déduite directement de ce document sans validation du MLD.

---

## 2. Entités principales

### UTILISATEUR

Représente une personne possédant un compte sur la plateforme.

Attributs principaux :

- id
- nom
- prénom
- email
- téléphone
- mot de passe
- rôle
- statut
- date de création

---

### PROFESSIONNEL

Représente un professionnel du voyage présent sur la plateforme.

Attributs principaux :

- id
- utilisateur
- nom de la structure
- description
- informations professionnelles
- statut de vérification
- date de création

---

### DOCUMENT_VERIFICATION

Représente un document fourni par un professionnel dans le cadre de sa vérification.

Attributs principaux :

- id
- professionnel
- type de document
- fichier
- statut
- date de soumission

---

### VERIFICATION

Représente le processus de vérification d'un professionnel.

Attributs principaux :

- id
- professionnel
- statut
- date de début
- date de décision
- commentaire

---

### ABONNEMENT

Représente l'abonnement d'un utilisateur ou professionnel.

Attributs principaux :

- id
- utilisateur
- formule
- date de début
- date de fin
- statut

---

### FORMULE_ABONNEMENT

Représente une formule d'abonnement disponible sur la plateforme.

Attributs principaux :

- id
- nom
- durée
- prix
- type d'utilisateur
- statut

---

### PAIEMENT

Représente une transaction liée à un abonnement.

Attributs principaux :

- id
- abonnement
- référence
- montant
- statut
- moyen de paiement
- date de création
- date de confirmation

---

### PUBLICATION

Représente un contenu publié ou soumis par un professionnel.

Attributs principaux :

- id
- professionnel
- titre
- contenu
- statut
- date de création
- date de publication

---

### CONVERSATION

Représente une conversation entre un voyageur et un professionnel.

Attributs principaux :

- id
- voyageur
- professionnel
- date de création
- statut

---

### MESSAGE

Représente un message envoyé dans une conversation.

Attributs principaux :

- id
- conversation
- expéditeur
- contenu
- date d'envoi
- statut

---

### DOCUMENT_ECHANGE

Représente un document envoyé dans le cadre d'une conversation.

Attributs principaux :

- id
- conversation
- expéditeur
- fichier
- date d'envoi

---

### SIGNALEMENT

Représente un signalement effectué sur la plateforme.

Attributs principaux :

- id
- utilisateur
- type de cible
- cible
- motif
- description
- statut
- date de création

---

### AUDIT_LOG

Représente une trace d'une action importante réalisée sur la plateforme.

Attributs principaux :

- id
- utilisateur
- action
- date
- informations complémentaires

---

## 3. Relations principales

### UTILISATEUR — PROFESSIONNEL

Un utilisateur peut être associé à un professionnel.

Un professionnel est associé à un compte utilisateur.

---

### PROFESSIONNEL — DOCUMENT_VERIFICATION

Un professionnel peut fournir plusieurs documents de vérification.

Un document de vérification appartient à un seul professionnel.

---

### PROFESSIONNEL — VERIFICATION

Un professionnel peut faire l'objet de plusieurs opérations de vérification dans le temps.

Une vérification concerne un seul professionnel.

---

### UTILISATEUR — ABONNEMENT

Un utilisateur peut avoir plusieurs abonnements dans le temps.

Un abonnement appartient à un seul utilisateur.

---

### FORMULE_ABONNEMENT — ABONNEMENT

Une formule peut être utilisée par plusieurs abonnements.

Un abonnement correspond à une seule formule.

---

### ABONNEMENT — PAIEMENT

Un abonnement peut être associé à plusieurs tentatives ou paiements.

Un paiement concerne un seul abonnement.

---

### PROFESSIONNEL — PUBLICATION

Un professionnel peut créer plusieurs publications.

Une publication appartient à un seul professionnel.

---

### VOYAGEUR — CONVERSATION

Un voyageur peut avoir plusieurs conversations.

Une conversation concerne un seul voyageur.

---

### PROFESSIONNEL — CONVERSATION

Un professionnel peut avoir plusieurs conversations.

Une conversation concerne un seul professionnel.

---

### CONVERSATION — MESSAGE

Une conversation peut contenir plusieurs messages.

Un message appartient à une seule conversation.

---

### CONVERSATION — DOCUMENT_ECHANGE

Une conversation peut contenir plusieurs documents échangés.

Un document échangé appartient à une seule conversation.

---

### UTILISATEUR — SIGNALEMENT

Un utilisateur peut effectuer plusieurs signalements.

Un signalement est effectué par un seul utilisateur.

---

### UTILISATEUR — AUDIT_LOG

Un utilisateur peut être associé à plusieurs traces d'activité.

Une trace peut être associée à un utilisateur lorsque l'action nécessite une identification.

---

## 4. Règles importantes du modèle

- Un professionnel doit être associé à un compte utilisateur.
- Un professionnel doit être vérifié avant de pouvoir publier.
- Une conversation associe un voyageur et un professionnel.
- Le premier message d'une conversation doit être envoyé par le voyageur.
- Les messages appartiennent à une conversation.
- Les documents échangés appartiennent à une conversation.
- Un abonnement est associé à une formule.
- Les paiements sont associés aux abonnements.
- Les publications sont associées aux professionnels.
- Les documents de vérification sont associés aux professionnels.

---

## 5. Point à préciser avant le MLD

Le MCD actuel représente les concepts principaux du projet.

Les cardinalités exactes, les identifiants techniques, les contraintes, les types de données et les tables seront définis dans le MLD.

Aucune structure SQL ou Prisma ne doit être créée directement à partir de ce document sans validation du MLD.
