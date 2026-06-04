import Dexie, { type Table } from "dexie";
import type {
  Chapter,
  Character,
  InspirationEntry,
  Novel,
  WorldSetting,
} from "@/types";

export class NovelMuseDB extends Dexie {
  novels!: Table<Novel, string>;
  characters!: Table<Character, string>;
  chapters!: Table<Chapter, string>;
  worldSettings!: Table<WorldSetting, string>;
  inspirations!: Table<InspirationEntry, string>;

  constructor() {
    super("novelmuse");

    this.version(1).stores({
      novels: "id, title, genre, updatedAt",
      characters: "id, novelId, name, role",
      chapters: "id, novelId, order, status",
      worldSettings: "id, novelId, category, title",
      inspirations: "id, type, createdAt",
    });
  }
}

export const db = new NovelMuseDB();
