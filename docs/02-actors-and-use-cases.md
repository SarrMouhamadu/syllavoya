# Sylla Voyage — Acteurs et cas d'utilisation

## 1. Acteurs

### 1.1 Voyageur

Le voyageur utilise la plateforme pour :

- créer et gérer son compte ;
- souscrire à un abonnement ;
- consulter les contenus accessibles ;
- rechercher des professionnels vérifiés ;
- consulter leur profil ;
- contacter un professionnel ;
- échanger des messages et documents ;
- signaler un problème.

### 1.2 Professionnel du voyage

Le professionnel utilise la plateforme pour :

- créer une demande d'inscription ;
- fournir les informations nécessaires à sa vérification ;
- consulter son profil ;
- publier du contenu après vérification ;
- recevoir les messages des voyageurs ;
- répondre aux voyageurs ;
- échanger des documents.

### 1.3 Administrateur

L'administrateur utilise la plateforme pour :

- gérer les utilisateurs ;
- vérifier les professionnels ;
- accepter ou refuser une vérification ;
- suspendre un professionnel ;
- gérer les publications ;
- accepter ou refuser une publication ;
- gérer les abonnements ;
- consulter les paiements ;
- traiter les signalements ;
- assurer la supervision générale de la plateforme.

### 1.4 NabooPay

NabooPay intervient comme service externe de paiement.

Il permet notamment :

- la création d'une transaction ;
- le traitement du paiement ;
- la transmission de la confirmation du paiement à la plateforme.

---

# 2. Cas d'utilisation

## 2.1 Gestion du compte

### Voyageur

- Créer un compte
- Se connecter
- Consulter son profil
- Modifier son profil
- Se déconnecter

### Professionnel

- Créer une demande d'inscription
- Se connecter
- Consulter son profil
- Modifier les informations autorisées
- Se déconnecter

### Administrateur

- Se connecter
- Gérer les comptes

---

## 2.2 Gestion des abonnements

### Voyageur

- Consulter les formules
- Souscrire à une formule
- Payer un abonnement
- Consulter son abonnement
- Renouveler son abonnement

### Professionnel

- Consulter les formules
- Souscrire à une formule
- Payer un abonnement
- Consulter son abonnement
- Renouveler son abonnement

### Administrateur

- Consulter les abonnements
- Consulter leur état
- Gérer les situations nécessitant une intervention administrative

---

## 2.3 Gestion des professionnels

### Professionnel

- Soumettre une demande de vérification
- Fournir les informations nécessaires
- Fournir les documents nécessaires
- Consulter l'état de sa vérification

### Administrateur

- Consulter une demande de vérification
- Examiner les informations
- Examiner les documents
- Accepter une vérification
- Refuser une vérification
- Suspendre un professionnel
- Retirer une vérification

### Voyageur

- Consulter les professionnels vérifiés
- Consulter le profil d'un professionnel vérifié

---

## 2.4 Gestion des publications

### Professionnel

- Créer une publication
- Soumettre une publication
- Consulter l'état d'une publication
- Modifier une publication lorsque cela est autorisé

### Administrateur

- Consulter les publications soumises
- Accepter une publication
- Refuser une publication
- Gérer les publications publiées

### Voyageur

- Consulter les publications accessibles
- Consulter les publications verrouillées lorsqu'il n'a pas les droits d'accès

---

## 2.5 Communication

### Voyageur

- Consulter un professionnel
- Initier une conversation
- Envoyer un message
- Envoyer un document
- Consulter l'historique d'une conversation

### Professionnel

- Recevoir une conversation initiée par un voyageur
- Répondre à un voyageur
- Envoyer un message
- Envoyer un document
- Consulter l'historique d'une conversation

### Règle

Le professionnel ne peut pas initier la première conversation avec un voyageur.

---

## 2.6 Signalements

### Voyageur

- Signaler un professionnel
- Signaler une publication
- Consulter l'état de son signalement lorsque cette fonctionnalité est disponible

### Professionnel

- Signaler un problème concernant un utilisateur ou un contenu lorsque cela est autorisé

### Administrateur

- Consulter les signalements
- Examiner un signalement
- Traiter un signalement
- Prendre une décision administrative

---

## 2.7 Administration

### Administrateur

- Consulter les utilisateurs
- Consulter les professionnels
- Consulter les publications
- Consulter les abonnements
- Consulter les paiements
- Consulter les signalements
- Effectuer les actions administratives autorisées

---

# 3. Relations principales

Les principales interactions sont :

- Voyageur → Abonnement
- Voyageur → Publication
- Voyageur → Professionnel
- Voyageur → Conversation
- Voyageur → Signalement
- Professionnel → Vérification
- Professionnel → Publication
- Professionnel → Conversation
- Professionnel → Abonnement
- Administrateur → Utilisateurs
- Administrateur → Professionnels
- Administrateur → Publications
- Administrateur → Abonnements
- Administrateur → Signalements
- NabooPay → Paiement

---

# 4. Règle de conception

Les cas d'utilisation décrits ici représentent les fonctionnalités fonctionnelles principales.

Les détails du fonctionnement de chaque cas d'utilisation seront précisés dans les user stories et les règles métier.

Aucun cas d'utilisation supplémentaire ne doit être ajouté sans validation.
