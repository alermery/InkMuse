import type {
  Chapter,
  Character,
  InspirationEntry,
  Novel,
  WorldSetting,
} from "@/types";

export const defaultNovel: Novel = {
  id: "novel-1",
  title: "未命名项目",
  genre: "",
  synopsis: "",
  createdAt: new Date("2026-06-04T00:00:00+08:00"),
  updatedAt: new Date("2026-06-04T00:00:00+08:00"),
};

export const defaultCharacters: Character[] = [];

export const defaultChapters: Chapter[] = [];

export const defaultWorldSettings: WorldSetting[] = [];

export const defaultInspirations: InspirationEntry[] = [];
