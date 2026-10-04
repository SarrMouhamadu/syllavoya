# Sylla Voyage — Contrat API

## 1. Objectif

Ce document définit les principaux endpoints de l'API Sylla Voyage.

L'API constitue l'interface entre le frontend et le backend.

Les règles métier et de sécurité doivent toujours être appliquées côté serveur.

---

## 2. Convention générale

Base :

```text
/api
```

Les réponses doivent utiliser des statuts HTTP cohérents.
Les erreurs doivent retourner une réponse structurée et compréhensible.
Les données sensibles ne doivent jamais être retournées inutilement. 3. Authentification
POST /api/auth/register
Créer un compte utilisateur.
POST /api/auth/login
Authentifier un utilisateur.
POST /api/auth/logout
Déconnecter l'utilisateur.
GET /api/auth/me
Retourner les informations de l'utilisateur connecté. 4. Utilisateurs
GET /api/users/me
Consulter son profil.
PATCH /api/users/me
Modifier son profil. 5. Professionnels
POST /api/professionals/apply
Soumettre une demande pour devenir professionnel.
GET /api/professionals/me
Consulter son profil professionnel.
PATCH /api/professionals/me
Modifier les informations autorisées.
GET /api/professionals
Rechercher et consulter les professionnels accessibles.
GET /api/professionals/:id
Consulter le profil d'un professionnel. 6. Vérification
POST /api/professionals/me/documents
Envoyer un document nécessaire à la vérification.
GET /api/professionals/me/verification
Consulter l'état de sa vérification.
Les endpoints administratifs de vérification seront définis dans la partie administration. 7. Publications
POST /api/publications
Créer une publication.
GET /api/publications
Consulter les publications accessibles.
GET /api/publications/:id
Consulter une publication.
PATCH /api/publications/:id
Modifier une publication lorsque cela est autorisé.
POST /api/publications/:id/submit
Soumettre une publication à validation. 8. Abonnements
GET /api/subscriptions/plans
Consulter les formules disponibles.
GET /api/subscriptions/me
Consulter son abonnement.
POST /api/subscriptions
Créer une demande de souscription.
POST /api/subscriptions/:id/renew
Renouveler un abonnement. 9. Paiements
POST /api/payments
Initialiser un paiement.
GET /api/payments/:id
Consulter l'état d'un paiement appartenant à l'utilisateur.
POST /api/payments/naboopay/webhook
Recevoir les notifications de paiement de NabooPay.
Le webhook doit être traité côté serveur.
Le traitement doit être idempotent. 10. Conversations
GET /api/conversations
Consulter ses conversations.
POST /api/conversations
Créer une conversation.
La création d'une conversation doit respecter la règle selon laquelle le voyageur initie le premier contact.
GET /api/conversations/:id
Consulter une conversation autorisée. 11. Messages
GET /api/conversations/:id/messages
Consulter les messages d'une conversation.
POST /api/conversations/:id/messages
Envoyer un message dans une conversation autorisée. 12. Documents échangés
POST /api/conversations/:id/documents
Envoyer un document dans une conversation.
GET /api/conversations/:id/documents
Consulter les documents accessibles dans une conversation.
L'accès aux documents doit être contrôlé côté serveur. 13. Signalements
POST /api/reports
Créer un signalement.
GET /api/reports/me
Consulter ses signalements lorsque cette fonctionnalité est disponible. 14. Administration
Les endpoints administratifs doivent être protégés par une autorisation spécifique.
GET /api/admin/users
Consulter les utilisateurs.
GET /api/admin/professionals
Consulter les professionnels.
GET /api/admin/verifications
Consulter les demandes de vérification.
PATCH /api/admin/verifications/:id
Traiter une vérification.
GET /api/admin/publications
Consulter les publications soumises.
PATCH /api/admin/publications/:id
Traiter une publication.
GET /api/admin/subscriptions
Consulter les abonnements.
GET /api/admin/payments
Consulter les paiements.
GET /api/admin/reports
Consulter les signalements.
PATCH /api/admin/reports/:id
Traiter un signalement. 15. WebSocket
Socket.IO sera utilisé pour les fonctionnalités nécessitant du temps réel.
Le temps réel pourra notamment être utilisé pour :

- les nouveaux messages ;
- les mises à jour d'une conversation ;
- les notifications liées à la messagerie.
  Les permissions doivent être vérifiées côté serveur.

16. Format des erreurs
    Les erreurs API doivent utiliser une structure cohérente.
    Exemple :
    {
    "success": false,
    "error": {
    "code": "ERROR_CODE",
    "message": "Message compréhensible"
    }
    }

Les détails internes de l'application ne doivent pas être exposés en production. 17. Format des réponses
Lorsque cela est pertinent, les réponses peuvent suivre une structure cohérente :
{
"success": true,
"data": {}
}

Les listes peuvent également fournir les informations nécessaires à la pagination. 18. Authentification et autorisation
Les endpoints protégés doivent vérifier l'identité de l'utilisateur.
Les endpoints doivent également vérifier les permissions nécessaires.
Un utilisateur ne doit jamais pouvoir accéder aux ressources d'un autre utilisateur sans autorisation. 19. Validation
Les données reçues par l'API doivent être validées côté serveur.
Une requête invalide doit être rejetée avant l'exécution de la logique métier. 20. Règle de conception
Ce document définit les grandes routes de l'API.
Les schémas exacts des requêtes et réponses, les paramètres, les codes d'erreur détaillés et les règles de pagination seront précisés avant l'implémentation.
Aucun endpoint supplémentaire ne doit être créé sans besoin fonctionnel identifié et validé.

Ensuite, on fait **`10-ui-guidelines.md`**.
