# Sylla Voyage — Règles de paiement

## 1. Moyen de paiement

Sylla Voyage utilise NabooPay pour le paiement des abonnements.

NabooPay constitue le prestataire de paiement externe du MVP.

---

## 2. Abonnements voyageurs

Les formules disponibles pour les voyageurs sont :

- Mensuel : 5 000 FCFA
- Annuel : 50 000 FCFA

---

## 3. Abonnements professionnels

Les formules disponibles pour les professionnels sont :

- Mensuel : 20 000 FCFA
- Annuel : 200 000 FCFA

---

## 4. Création d'un paiement

Lorsqu'un utilisateur choisit une formule :

1. le backend identifie la formule ;
2. le backend détermine le montant applicable ;
3. le système calcule les éventuels frais applicables ;
4. le montant total à payer est présenté à l'utilisateur ;
5. l'utilisateur confirme le paiement ;
6. le paiement est effectué via NabooPay.

---

## 5. Frais opérateurs

Les frais éventuellement appliqués par les opérateurs de paiement sont à la charge du client.

Avant la confirmation du paiement, l'utilisateur doit pouvoir voir clairement :

- le prix de l'abonnement ;
- les frais applicables ;
- le montant total à payer.

Aucun montant ne doit être ajouté de manière inattendue après la confirmation du paiement.

---

## 6. Confirmation du paiement

Le frontend ne peut pas confirmer lui-même un paiement.

La confirmation doit être effectuée côté serveur à partir des informations fiables transmises par NabooPay.

Un simple retour vers le navigateur après paiement ne suffit pas pour activer un abonnement.

---

## 7. Activation de l'abonnement

Lorsqu'un paiement est confirmé :

1. le paiement est enregistré ;
2. son statut est mis à jour ;
3. l'abonnement correspondant est activé ;
4. sa date de début est enregistrée ;
5. sa date de fin est calculée selon la formule choisie.

L'accès doit être disponible automatiquement après confirmation du paiement.

---

## 8. Paiement échoué

Lorsqu'un paiement échoue :

- l'abonnement ne doit pas être activé ;
- le paiement doit conserver son statut approprié ;
- l'utilisateur doit pouvoir réessayer le paiement.

---

## 9. Paiement en attente

Un paiement dont la confirmation n'est pas encore connue doit rester dans un état permettant son suivi.

L'abonnement ne doit pas être activé tant que le paiement n'est pas confirmé.

---

## 10. Renouvellement

Lorsqu'un utilisateur renouvelle son abonnement :

- un nouveau paiement est créé ;
- le paiement doit être confirmé ;
- l'accès doit être maintenu ou réactivé après confirmation ;
- la nouvelle période d'abonnement doit être enregistrée.

---

## 11. Expiration

À la date de fin de l'abonnement :

- l'abonnement devient expiré ;
- les fonctionnalités réservées sont bloquées ;
- le compte utilisateur n'est pas supprimé.

L'utilisateur peut souscrire à nouveau afin de récupérer son accès.

---

## 12. Traçabilité des paiements

Chaque paiement doit conserver au minimum les informations nécessaires à son suivi.

Notamment :

- référence interne ;
- référence du prestataire lorsque disponible ;
- montant ;
- statut ;
- formule concernée ;
- utilisateur concerné ;
- dates importantes.

Les données sensibles qui ne sont pas nécessaires ne doivent pas être stockées.

---

## 13. Idempotence

La confirmation d'un même paiement ne doit pas pouvoir activer plusieurs fois le même abonnement.

Le traitement des confirmations doit être idempotent.

Une même transaction ne doit pas être comptabilisée plusieurs fois.

---

## 14. Sécurité

Les informations sensibles liées au paiement doivent rester côté serveur.

Les clés et secrets NabooPay ne doivent jamais être exposés dans le frontend ou dans le dépôt Git.

Les communications avec NabooPay doivent être réalisées par le backend.

---

## 15. Règle fondamentale

Un abonnement ne peut être considéré comme payé et actif que lorsque le paiement a été confirmé de manière fiable côté serveur.

Aucune fonctionnalité ne doit contourner cette règle.

Toute règle de paiement supplémentaire non définie dans ce document doit être validée avant son implémentation.
