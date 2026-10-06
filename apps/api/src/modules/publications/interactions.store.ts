import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface PublicationInteractions {
  publicationId: string;
  likedUserIds: string[];
  comments: CommentItem[];
}

export interface InteractionsSummary {
  likesCount: number;
  userLiked: boolean;
  comments: CommentItem[];
}

class InteractionsStore {
  private filePath: string;
  private cache: Map<string, PublicationInteractions> = new Map();
  private loaded = false;

  constructor() {
    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    this.filePath = path.join(dataDir, "publication_interactions.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.loaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const list: PublicationInteractions[] = JSON.parse(raw);
        for (const item of list) {
          this.cache.set(item.publicationId, {
            publicationId: item.publicationId,
            likedUserIds: Array.isArray(item.likedUserIds) ? item.likedUserIds : [],
            comments: Array.isArray(item.comments) ? item.comments : [],
          });
        }
      }
    } catch (err) {
      console.warn("Could not load interactions from disk, starting empty:", err);
    }
    this.loaded = true;
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.cache.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.warn("Could not save interactions to disk:", err);
    }
  }

  private getOrCreate(publicationId: string): PublicationInteractions {
    this.loadFromDisk();
    let item = this.cache.get(publicationId);
    if (!item) {
      item = {
        publicationId,
        likedUserIds: [],
        comments: [],
      };
      this.cache.set(publicationId, item);
    }
    return item;
  }

  getInteractions(publicationId: string, currentUserId?: string): InteractionsSummary {
    const item = this.getOrCreate(publicationId);
    return {
      likesCount: item.likedUserIds.length,
      userLiked: Boolean(currentUserId && item.likedUserIds.includes(currentUserId)),
      comments: [...item.comments].reverse(),
    };
  }

  toggleLike(publicationId: string, userId: string): { likesCount: number; userLiked: boolean } {
    const item = this.getOrCreate(publicationId);
    const index = item.likedUserIds.indexOf(userId);
    let userLiked = false;
    if (index >= 0) {
      item.likedUserIds.splice(index, 1);
      userLiked = false;
    } else {
      item.likedUserIds.push(userId);
      userLiked = true;
    }
    this.saveToDisk();
    return {
      likesCount: item.likedUserIds.length,
      userLiked,
    };
  }

  addComment(
    publicationId: string,
    userId: string,
    userName: string,
    userRole: string,
    content: string
  ): CommentItem {
    const item = this.getOrCreate(publicationId);
    const comment: CommentItem = {
      id: randomUUID(),
      userId,
      userName: userName.trim() || "Utilisateur Sylla Voyage",
      userRole,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    item.comments.push(comment);
    this.saveToDisk();
    return comment;
  }
}

export const interactionsStore = new InteractionsStore();
