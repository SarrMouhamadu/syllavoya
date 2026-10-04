# Sylla Voyage — Règles de sécurité

## 1. Principe général

La sécurité doit être appliquée côté serveur.

Le frontend ne doit jamais être considéré comme une source de confiance.

Toute donnée reçue du client doit être considérée comme non fiable jusqu'à sa validation.

---

## 2. Authentification

- Les utilisateurs doivent être authentifiés pour accéder aux fonctionnalités protégées.
- Les mots de passe doivent être stockés sous forme de hash sécurisé.
- Les mots de passe ne doivent jamais être stockés en clair.
- Les secrets d'authentification ne doivent jamais être exposés au frontend.
- Le MVP ne nécessite pas d'OTP.

---

## 3. Autorisation

Chaque opération protégée doit vérifier les droits de l'utilisateur.

Le système doit notamment vérifier :

- l'identité de l'utilisateur ;
- son rôle ;
- son statut ;
- son abonnement lorsque nécessaire ;
- son droit d'accès à la ressource demandée.

Un utilisateur ne doit jamais pouvoir accéder à une ressource simplement en modifiant un identifiant dans une URL ou une requête.

---

## 4. Protection des données

Les données personnelles doivent être protégées.

L'accès aux données doit être limité aux personnes qui en ont besoin pour leur fonction.

Les données sensibles ne doivent pas être exposées inutilement dans les réponses API, les logs ou le frontend.

---

## 5. Documents

Les documents de vérification et les documents échangés entre utilisateurs doivent être privés par défaut.

Ils ne doivent pas être accessibles publiquement.

L'accès à un document doit être contrôlé côté serveur.

Un utilisateur ne doit pouvoir accéder qu'aux documents auxquels il a réellement droit.

---

## 6. Messagerie

Les conversations doivent être accessibles uniquement aux participants autorisés.

Un voyageur ne doit pouvoir consulter que ses propres conversations.

Un professionnel ne doit pouvoir consulter que les conversations auxquelles il participe.

Les règles d'autorisation doivent également être appliquées aux connexions WebSocket.

---

## 7. Paiements

Les informations de paiement doivent être traitées côté serveur.

Le frontend ne doit jamais pouvoir déclarer lui-même qu'un paiement est réussi.

L'activation d'un abonnement doit dépendre d'une confirmation fiable du paiement.

Les données sensibles liées au paiement ne doivent pas être stockées inutilement.

---

## 8. Validation des données

Toutes les données reçues par l'API doivent être validées.

La validation doit notamment concerner :

- les paramètres ;
- les données de formulaire ;
- les fichiers ;
- les identifiants ;
- les données utilisées dans les opérations métier.

Une donnée invalide doit être rejetée proprement.

---

## 9. Protection contre les abus

Le système doit prévoir des protections adaptées contre :

- les requêtes excessives ;
- les tentatives répétées de connexion ;
- les accès non autorisés ;
- les téléchargements abusifs ;
- les fichiers dangereux ;
- les comportements automatisés malveillants.

Les mécanismes précis seront définis selon les besoins réels du système.

---

## 10. Fichiers

Les fichiers envoyés par les utilisateurs doivent être contrôlés.

Le système doit notamment vérifier :

- le type de fichier ;
- la taille ;
- les extensions autorisées ;
- les conditions de stockage.

Les fichiers ne doivent pas être exécutables comme du code serveur.

---

## 11. Secrets et variables d'environnement

Les secrets ne doivent jamais être enregistrés dans Git.

Cela inclut notamment :

- mots de passe ;
- clés API ;
- secrets de session ;
- clés NabooPay ;
- identifiants de base de données ;
- secrets JWT ou équivalents ;
- credentials d'infrastructure.

Les secrets doivent être fournis par les variables d'environnement ou un mécanisme sécurisé adapté.

---

## 12. Base de données

La base de données ne doit pas être exposée publiquement inutilement.

Les accès doivent être protégés par authentification.

Les permissions doivent être limitées au strict nécessaire.

Les données doivent être manipulées avec des mécanismes empêchant les injections SQL.

---

## 13. API

L'API doit :

- authentifier les requêtes protégées ;
- vérifier les permissions ;
- valider les données ;
- limiter les informations retournées ;
- gérer correctement les erreurs.

Les erreurs internes ne doivent pas exposer d'informations sensibles.

---

## 14. Logs et audit

Les événements importants doivent pouvoir être tracés lorsque cela est nécessaire.

Les logs ne doivent pas contenir inutilement :

- mots de passe ;
- tokens ;
- secrets ;
- données sensibles ;
- informations de paiement sensibles.

Les actions administratives importantes doivent pouvoir être auditées.

---

## 15. Administration

Les fonctionnalités administratives doivent être fortement protégées.

Un utilisateur normal ne doit jamais pouvoir accéder aux fonctionnalités d'administration.

Les actions sensibles réalisées par un administrateur doivent être contrôlées et, lorsque nécessaire, enregistrées dans l'audit.

---

## 16. Suppression et conservation

Les données importantes liées aux paiements, aux conversations, aux documents et aux actions administratives ne doivent pas être supprimées sans considérer les besoins de traçabilité.

Les règles précises de conservation et de suppression seront définies avant leur implémentation.

---

## 17. Infrastructure

L'infrastructure de production doit être protégée contre les accès non autorisés.

Les services internes tels que PostgreSQL et Redis ne doivent pas être exposés publiquement sans nécessité.

Les accès administratifs au serveur doivent être sécurisés.

---

## 18. Principe de moindre privilège

Chaque utilisateur, service ou processus doit disposer uniquement des permissions nécessaires à son fonctionnement.

Aucun accès supplémentaire ne doit être accordé sans justification.

---

## 19. Règle fondamentale

La sécurité ne doit jamais être uniquement basée sur le comportement attendu du frontend.

Toute règle de sécurité importante doit être appliquée et vérifiée côté serveur.

Lorsqu'une exigence de sécurité n'est pas définie, elle doit être identifiée avant l'implémentation plutôt que supposée.
