import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { interactionsStore } from "./modules/publications/interactions.store.js";

describe("Interactions des Publications : Likes & Commentaires", () => {
  const pubId = "test-pub-" + Date.now();
  const user1 = "user-pro-1";
  const user2 = "user-traveler-2";

  it("1. Récupère les interactions initiales vides", () => {
    const data = interactionsStore.getInteractions(pubId, user1);
    assert.equal(data.likesCount, 0);
    assert.equal(data.userLiked, false);
    assert.equal(data.comments.length, 0);
  });

  it("2. Un utilisateur peut aimer une publication", () => {
    const res = interactionsStore.toggleLike(pubId, user1);
    assert.equal(res.likesCount, 1);
    assert.equal(res.userLiked, true);

    const check = interactionsStore.getInteractions(pubId, user1);
    assert.equal(check.likesCount, 1);
    assert.equal(check.userLiked, true);
  });

  it("3. Un second utilisateur peut aimer la même publication", () => {
    const res = interactionsStore.toggleLike(pubId, user2);
    assert.equal(res.likesCount, 2);
    assert.equal(res.userLiked, true);

    const check1 = interactionsStore.getInteractions(pubId, user1);
    assert.equal(check1.likesCount, 2);
    assert.equal(check1.userLiked, true);
  });

  it("4. Un utilisateur peut retirer son like", () => {
    const res = interactionsStore.toggleLike(pubId, user1);
    assert.equal(res.likesCount, 1);
    assert.equal(res.userLiked, false);

    const check1 = interactionsStore.getInteractions(pubId, user1);
    assert.equal(check1.likesCount, 1);
    assert.equal(check1.userLiked, false);
  });

  it("5. Les utilisateurs (agences ou voyageurs) peuvent commenter", () => {
    const comment1 = interactionsStore.addComment(
      pubId,
      user1,
      "Dana Travel Services",
      "PROFESSIONNEL",
      "Magnifique circuit, nous le recommandons vivement !"
    );

    assert.equal(comment1.userName, "Dana Travel Services");
    assert.equal(comment1.userRole, "PROFESSIONNEL");
    assert.equal(comment1.content, "Magnifique circuit, nous le recommandons vivement !");

    const comment2 = interactionsStore.addComment(
      pubId,
      user2,
      "Moussa Diallo",
      "VOYAGEUR",
      "Quel est le point de départ exact à Dakar ?"
    );

    assert.equal(comment2.userName, "Moussa Diallo");
    assert.equal(comment2.userRole, "VOYAGEUR");

    const data = interactionsStore.getInteractions(pubId, user2);
    assert.equal(data.comments.length, 2);
    // Vérifie le tri antéchronologique
    assert.equal(data.comments[0].userName, "Moussa Diallo");
  });
});
