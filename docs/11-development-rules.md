# Sylla Voyage — Règles de développement

## 1. Source de vérité

La documentation du dossier `/docs` constitue la référence du projet.

Le code doit respecter les règles définies dans cette documentation.

En cas de contradiction entre le code et la documentation, le problème doit être signalé avant toute modification.

---

## 2. Ne rien inventer

Une fonctionnalité, une règle métier ou un comportement qui n'est pas défini ne doit pas être inventé.

Si une information nécessaire manque :

1. [ ] identifier ce qui manque ;
2. [ ] ne pas prendre de décision arbitraire ;
3. [ ] demander une clarification ;
4. [ ] attendre la validation avant l'implémentation.

---

## 3. Développement progressif

Le projet doit être développé progressivement.

Ne jamais demander à l'IA de construire toute l'application en une seule opération.

Chaque fonctionnalité doit être développée séparément ou par petit groupe cohérent.

---

## 4. Une tâche à la fois

Chaque tâche de développement doit avoir un objectif clairement défini.

Une tâche ne doit pas modifier plusieurs modules sans nécessité.

Avant de commencer une tâche, identifier :

- ce qui doit être créé ;
- ce qui doit être modifié ;
- ce qui ne doit pas être touché.

---

## 5. Pas de sur-ingénierie

Le code doit rester aussi simple que possible.

Ne pas introduire inutilement :

- des abstractions complexes ;
- des design patterns non nécessaires ;
- des bibliothèques supplémentaires ;
- des microservices ;
- des systèmes complexes.

Une solution simple et maintenable doit être privilégiée lorsqu'elle répond correctement au besoin.

---

## 6. Architecture

Le code doit respecter l'architecture définie dans :

`06-architecture.md`

Les responsabilités doivent être clairement séparées.

La logique métier ne doit pas être dispersée inutilement dans le frontend.

Les règles importantes doivent être contrôlées côté serveur.

---

## 7. Base de données

La structure de la base doit respecter :

- `04-merise-mcd.md`
- `05-merise-mld.md`

Ne pas créer de table ou de relation sans justification fonctionnelle et validation.

Les modifications du schéma doivent être réalisées avec des migrations contrôlées.

---

## 8. Sécurité

Le code doit respecter :

`07-security-rules.md`

Toute donnée provenant du client doit être considérée comme non fiable.

Les permissions doivent être vérifiées côté serveur.

Les secrets ne doivent jamais être commités.

---

## 9. Paiements

Le code de paiement doit respecter :

`08-payment-rules.md`

Aucun paiement ne doit être considéré comme confirmé uniquement à partir du frontend.

L'activation d'un abonnement doit dépendre d'une confirmation fiable côté serveur.

---

## 10. API

Le développement de l'API doit respecter :

`09-api-contract.md`

Un endpoint doit avoir une responsabilité claire.

Les données reçues doivent être validées.

Les erreurs doivent être gérées de manière cohérente.

---

## 11. Interface utilisateur

Le frontend doit respecter :

`10-ui-guidelines.md`

La simplicité et l'accessibilité sont prioritaires.

Ne pas ajouter d'éléments visuels ou fonctionnels uniquement pour rendre l'interface plus complexe.

---

## 12. Tests

Toute fonctionnalité importante doit être testée.

Utiliser :

- Vitest pour les tests unitaires et d'intégration ;
- Playwright pour les tests end-to-end.

Les fonctionnalités critiques doivent être testées avant leur validation.

---

## 13. Validation après chaque tâche

Après chaque modification :

1. vérifier le code ;
2. lancer les tests pertinents ;
3. vérifier le build lorsque nécessaire ;
4. vérifier qu'aucune fonctionnalité existante n'a été cassée ;
5. résumer clairement les modifications effectuées.

---

## 14. Git

Les commits doivent être petits et cohérents.

Un commit doit représenter une modification logique.

Éviter les commits contenant plusieurs fonctionnalités indépendantes.

Les messages de commit doivent être clairs et descriptifs.

---

## 15. Dépendances

Ne pas installer une nouvelle dépendance sans raison.

Avant d'ajouter une bibliothèque :

- vérifier qu'elle est réellement nécessaire ;
- vérifier qu'une solution existante dans le projet ne suffit pas ;
- éviter les dépendances qui ajoutent une complexité disproportionnée.

---

## 16. Gestion des erreurs

Les erreurs doivent être traitées explicitement.

Ne pas masquer silencieusement les erreurs.

Les erreurs destinées aux utilisateurs doivent être compréhensibles.

Les erreurs techniques doivent être suffisamment détaillées dans les logs sans exposer d'informations sensibles.

---

## 17. Qualité du code

Le code doit être :

- lisible ;
- typé correctement ;
- maintenable ;
- testable ;
- cohérent avec le reste du projet.

Éviter le code dupliqué lorsque cela peut être amélioré simplement.

Éviter également les abstractions prématurées.

---

## 18. Documentation du code

Ne pas commenter chaque ligne.

Les commentaires doivent expliquer principalement :

- pourquoi une décision particulière existe ;
- une contrainte métier importante ;
- un comportement qui n'est pas évident.

Le code doit rester suffisamment clair pour être compris sans commentaires inutiles.

---

## 19. Utilisation de l'IA

L'IA est un outil d'exécution et d'assistance au développement.

Elle ne remplace pas les décisions fonctionnelles ou architecturales validées.

Avant toute implémentation, l'IA doit vérifier la documentation pertinente.

Si la documentation ne permet pas de déterminer correctement le comportement attendu, elle doit s'arrêter et demander une clarification.

---

## 20. Modification contrôlée

Lorsqu'une tâche est demandée :

- ne modifier que les fichiers nécessaires ;
- ne pas réécrire inutilement du code existant ;
- ne pas supprimer du code fonctionnel sans justification ;
- ne pas modifier une fonctionnalité non concernée ;
- conserver les comportements validés.

---

## 21. Principe final

Le développement de Sylla Voyage doit suivre cette priorité :

1. comprendre le besoin ;
2. vérifier la documentation ;
3. définir ce qui manque ;
4. valider si nécessaire ;
5. implémenter ;
6. tester ;
7. vérifier ;
8. valider ;
9. passer à la tâche suivante.

La rapidité ne doit jamais être privilégiée au détriment de la fiabilité, de la sécurité ou de la maintenabilité.
