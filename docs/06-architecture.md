# Sylla Voyage — Architecture technique

## 1. Objectif

Sylla Voyage sera construit comme une application web monolithique modulaire.

L'architecture doit rester simple, maintenable, sécurisée et évolutive sans introduire de complexité inutile.

---

## 2. Architecture générale

Le système est composé principalement de :

- une application frontend ;
- une API backend ;
- une base PostgreSQL ;
- Redis ;
- des workers BullMQ ;
- un système WebSocket pour les communications temps réel ;
- un système de stockage des fichiers ;
- NabooPay pour les paiements.

---

## 3. Frontend

Technologies :

- React
- TypeScript

Responsabilités :

- afficher l'interface utilisateur ;
- gérer la navigation ;
- gérer les formulaires ;
- communiquer avec l'API ;
- afficher les états de chargement, succès et erreur ;
- gérer l'interface de messagerie temps réel.

Le frontend ne doit jamais être considéré comme une source de vérité pour les règles métier ou les paiements.

---

## 4. Backend

Technologies :

- Node.js
- TypeScript

Le backend constitue le point central de la logique métier.

Il est responsable notamment de :

- l'authentification ;
- l'autorisation ;
- la gestion des utilisateurs ;
- la gestion des professionnels ;
- la vérification ;
- les publications ;
- les abonnements ;
- les paiements ;
- les conversations ;
- les messages ;
- les documents ;
- les signalements ;
- les règles métier.

Les opérations sensibles doivent être contrôlées côté serveur.

---

## 5. API

Le backend expose une API permettant au frontend de communiquer avec le système.

L'API doit :

- valider les données reçues ;
- vérifier les permissions ;
- appliquer les règles métier ;
- retourner des réponses cohérentes ;
- gérer correctement les erreurs.

Les contrats détaillés de l'API seront définis dans :

`09-api-contract.md`

---

## 6. Base de données

Technologies :

- PostgreSQL
- Prisma

PostgreSQL constitue la source principale des données persistantes.

Prisma sera utilisé comme ORM.

La structure de la base doit respecter le MLD validé dans :

`05-merise-mld.md`

Aucune table ou relation supplémentaire ne doit être créée sans validation.

---

## 7. Redis

Redis sera utilisé lorsque nécessaire pour :

- les files de traitement ;
- les tâches asynchrones ;
- certaines données temporaires ;
- la coordination des traitements ;
- les fonctionnalités nécessitant des performances temps réel.

Redis ne doit pas remplacer PostgreSQL pour les données métier persistantes.

---

## 8. Communication temps réel

Technologie :

- WebSocket / Socket.IO

Le temps réel sera principalement utilisé pour les fonctionnalités de communication entre voyageurs et professionnels.

Les règles d'accès doivent être vérifiées côté serveur avant toute opération.

Le WebSocket ne doit jamais contourner les règles d'autorisation de l'API.

---

## 9. Traitements asynchrones

Technologies :

- BullMQ
- Redis

BullMQ sera utilisé pour les traitements qui ne nécessitent pas de bloquer directement une requête utilisateur.

Exemples possibles :

- traitements de fichiers ;
- notifications ;
- tâches techniques différées ;
- traitements nécessitant une exécution en arrière-plan.

Aucune tâche métier supplémentaire ne doit être introduite sans définition préalable.

---

## 10. Stockage des documents

Les documents doivent être stockés de manière privée.

Un document ne doit pas être accessible simplement en connaissant son emplacement de stockage.

L'accès à un document doit être contrôlé par le backend selon les droits de l'utilisateur.

Les règles détaillées de sécurité des fichiers seront définies dans :

`07-security-rules.md`

---

## 11. Paiements

Le paiement est réalisé avec NabooPay.

Le backend doit :

1. créer ou initialiser la transaction ;
2. permettre au client d'effectuer le paiement ;
3. recevoir la confirmation du paiement ;
4. vérifier le paiement côté serveur ;
5. enregistrer le paiement ;
6. activer l'abonnement lorsque le paiement est confirmé.

Le frontend ne doit jamais activer directement un abonnement après un simple retour utilisateur.

Les règles détaillées sont définies dans :

`08-payment-rules.md`

---

## 12. Authentification et autorisation

L'authentification permet d'identifier l'utilisateur.

L'autorisation détermine ce que l'utilisateur peut faire.

Ces deux responsabilités doivent être séparées.

Chaque endpoint sensible doit vérifier :

- l'identité de l'utilisateur ;
- son rôle ;
- ses permissions ;
- son état ;
- son abonnement lorsque nécessaire.

Le MVP ne nécessite pas d'OTP.

---

## 13. Organisation modulaire du backend

Le backend doit être organisé par domaines fonctionnels.

Les domaines principaux sont notamment :

```text
auth
users
professionals
verification
subscriptions
payments
publications
conversations
messages
documents
reports
admin
```
