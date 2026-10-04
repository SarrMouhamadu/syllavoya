# Sylla Voyage — Règles métier

## 1. Comptes

- Un utilisateur doit disposer d'un compte pour accéder aux fonctionnalités nécessitant une authentification.
- Un compte voyageur reste actif même lorsque son abonnement arrive à expiration.
- L'expiration de l'abonnement ne supprime pas le compte.

## 2. Voyageurs

- Un voyageur peut souscrire à un abonnement.
- Un voyageur disposant d'un abonnement actif peut accéder aux fonctionnalités et contenus réservés.
- Un voyageur dont l'abonnement est expiré ne peut plus accéder aux contenus et fonctionnalités réservés.
- Les contenus verrouillés peuvent rester visibles comme aperçu afin d'inviter le voyageur à s'abonner ou à renouveler son abonnement.

## 3. Professionnels du voyage

- Un professionnel doit être vérifié avant d'être considéré comme professionnel vérifié sur la plateforme.
- Une structure non formalisée ne peut pas être acceptée comme professionnel vérifié.
- La vérification est réalisée par Sylla Voyage.
- Sylla Voyage peut accepter, refuser, suspendre ou retirer la vérification d'un professionnel.

## 4. Publications

- Seuls les professionnels vérifiés peuvent publier.
- Une publication doit être soumise à validation avant sa diffusion publique.
- Sylla Voyage peut accepter ou refuser une publication.
- Un professionnel est limité à une publication par semaine.

## 5. Communication

- Un professionnel ne peut pas initier une conversation avec un voyageur.
- Le voyageur doit envoyer le premier message.
- Après le premier message du voyageur, les deux parties peuvent communiquer.
- Les communications doivent rester sur la plateforme.
- Les documents importants peuvent être échangés sur la plateforme.
- Les échanges doivent être conservés afin de permettre leur traçabilité.

## 6. Abonnements

### Voyageur

- Abonnement mensuel : 5 000 FCFA.
- Abonnement annuel : 50 000 FCFA.

### Professionnel

- Abonnement mensuel : 20 000 FCFA.
- Abonnement annuel : 200 000 FCFA.
- Un abonnement commence après confirmation du paiement.
- Un abonnement arrivé à expiration ne doit plus donner accès aux fonctionnalités réservées.
- Le renouvellement d'un abonnement doit permettre de restaurer l'accès aux fonctionnalités correspondantes.

## 7. Paiements

- Les paiements des abonnements sont réalisés avec NabooPay.
- La confirmation d'un paiement doit être vérifiée côté serveur.
- Une simple confirmation provenant du navigateur ne suffit pas pour considérer un paiement comme confirmé.
- Un paiement confirmé doit permettre l'activation automatique de l'abonnement correspondant.
- Les frais appliqués par les opérateurs de paiement sont à la charge du client.
- Le montant total à payer, incluant les éventuels frais applicables, doit être présenté clairement avant la confirmation du paiement.

## 8. Authentification

- Le MVP ne nécessite pas de système OTP.
- Aucun service payant d'envoi de SMS ou d'e-mail ne doit être ajouté pour mettre en place un OTP.
- Toute nouvelle méthode d'authentification doit être validée avant son implémentation.

## 9. Signalements

- Un utilisateur doit pouvoir signaler un contenu ou un professionnel lorsqu'il rencontre un problème.
- Un administrateur peut examiner les signalements.
- Un signalement ne doit pas entraîner automatiquement une sanction sans décision ou règle définie.

## 10. Administration

- L'administrateur peut gérer les utilisateurs.
- L'administrateur peut gérer les professionnels.
- L'administrateur peut gérer les publications.
- L'administrateur peut gérer les abonnements.
- L'administrateur peut traiter les signalements.
- L'administrateur peut suspendre un professionnel ou retirer sa vérification.

## 11. Principe général

Toute règle métier non définie dans ce document doit être considérée comme non spécifiée.

Aucune fonctionnalité ou règle métier ne doit être inventée pour compléter un manque.

Lorsqu'une règle nécessaire au fonctionnement du système n'est pas définie, elle doit être identifiée et validée avant son implémentation.
