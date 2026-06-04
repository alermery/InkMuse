"use client";

import { create } from "zustand";
import { defaultNovel } from "@/lib/mock-data";
import type {
  DeepSeekModel,
  EncyclopediaEntry,
  Novel,
  SavedEntry,
  ToastMessage,
} from "@/types";

type NovelStore = {
  apiKey: string;
  apiKeyPersisted: boolean;
  model: DeepSeekModel;
  currentNovel: Novel | null;
  chapterDraft: string;
  aiCallCount: number;
  tokenUsage: number;
  apiBalance: string;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  shortcutOpen: boolean;
  welcomeDismissed: boolean;
  toasts: ToastMessage[];
  savedEntries: SavedEntry[];
  encyclopediaEntries: EncyclopediaEntry[];
  dailyGoal: number;
  weeklyGoal: number;
  writingMinutes: number;
  setApiKey: (value: string, persistKey?: boolean) => void;
  setApiKeyPersisted: (value: boolean) => void;
  clearApiKey: () => void;
  hydrateFromStorage: () => void;
  setModel: (value: DeepSeekModel) => void;
  setCurrentNovel: (novel: Novel) => void;
  setChapterDraft: (value: string) => void;
  appendToDraft: (value: string) => void;
  incrementAiCallCount: () => void;
  addTokenUsage: (value: number) => void;
  setApiBalance: (value: string) => void;
  toggleSidebar: () => void;
  setCommandOpen: (value: boolean) => void;
  setShortcutOpen: (value: boolean) => void;
  dismissWelcome: () => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  saveEntry: (entry: Omit<SavedEntry, "id" | "createdAt">) => void;
  saveSetting: (entry: Omit<EncyclopediaEntry, "id" | "createdAt">) => void;
  removeSavedEntry: (id: string) => void;
  removeSetting: (id: string) => void;
  setGoals: (dailyGoal: number, weeklyGoal: number) => void;
};

const API_KEY_STORAGE = "novelmuse-api-key";
const API_KEY_PERSISTENCE_STORAGE = "novelmuse-api-key-persistence";
const STATE_STORAGE = "novelmuse-state";
const API_KEY_MASK = "novelmuse-local-key";

type PersistedState = Pick<
  NovelStore,
  | "chapterDraft"
  | "aiCallCount"
  | "tokenUsage"
  | "apiBalance"
  | "model"
  | "sidebarCollapsed"
  | "welcomeDismissed"
  | "savedEntries"
  | "encyclopediaEntries"
  | "dailyGoal"
  | "weeklyGoal"
  | "writingMinutes"
>;

const initialDraft = "";

const defaultPersistedState: PersistedState = {
  chapterDraft: initialDraft,
  aiCallCount: 0,
  tokenUsage: 0,
  apiBalance: "未知",
  model: "deepseek-chat",
  sidebarCollapsed: false,
  welcomeDismissed: true,
  savedEntries: [],
  encyclopediaEntries: [],
  dailyGoal: 3000,
  weeklyGoal: 18000,
  writingMinutes: 0,
};

function loadStoredApiKey() {
  if (typeof window === "undefined") {
    return "";
  }

  if (window.localStorage.getItem(API_KEY_PERSISTENCE_STORAGE) !== "true") {
    window.localStorage.removeItem(API_KEY_STORAGE);
    return "";
  }

  const encrypted = window.localStorage.getItem(API_KEY_STORAGE);
  if (!encrypted) {
    return "";
  }

  try {
    const decoded = decodeURIComponent(escape(window.atob(encrypted)));
    return decoded
      .split("")
      .map((char, index) =>
        String.fromCharCode(
          char.charCodeAt(0) ^
            API_KEY_MASK.charCodeAt(index % API_KEY_MASK.length),
        ),
      )
      .join("");
  } catch {
    return "";
  }
}

function encryptApiKey(value: string) {
  if (typeof window === "undefined") {
    return value;
  }

  const masked = value
    .split("")
    .map((char, index) =>
      String.fromCharCode(
        char.charCodeAt(0) ^
          API_KEY_MASK.charCodeAt(index % API_KEY_MASK.length),
      ),
    )
    .join("");

  return window.btoa(unescape(encodeURIComponent(masked)));
}

function loadApiKeyPersistence() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(API_KEY_PERSISTENCE_STORAGE) === "true";
}

function persistApiKey(value: string, shouldPersist: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value.trim() || !shouldPersist) {
    window.localStorage.removeItem(API_KEY_STORAGE);
    window.localStorage.setItem(API_KEY_PERSISTENCE_STORAGE, "false");
    return;
  }

  window.localStorage.setItem(API_KEY_STORAGE, encryptApiKey(value));
  window.localStorage.setItem(API_KEY_PERSISTENCE_STORAGE, "true");
}

function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return defaultPersistedState;
  }

  try {
    const raw = window.localStorage.getItem(STATE_STORAGE);
    if (!raw) {
      throw new Error("empty state");
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    return {
      chapterDraft: parsed.chapterDraft ?? initialDraft,
      aiCallCount: parsed.aiCallCount ?? 0,
      tokenUsage: parsed.tokenUsage ?? 0,
      apiBalance: parsed.apiBalance ?? "未知",
      model: parsed.model ?? "deepseek-chat",
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      welcomeDismissed: parsed.welcomeDismissed ?? true,
      savedEntries: parsed.savedEntries ?? [],
      encyclopediaEntries: parsed.encyclopediaEntries ?? [],
      dailyGoal: parsed.dailyGoal ?? 3000,
      weeklyGoal: parsed.weeklyGoal ?? 18000,
      writingMinutes: parsed.writingMinutes ?? 0,
    };
  } catch {
    return defaultPersistedState;
  }
}

function persist(state: NovelStore) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: PersistedState = {
    chapterDraft: state.chapterDraft,
    aiCallCount: state.aiCallCount,
    tokenUsage: state.tokenUsage,
    apiBalance: state.apiBalance,
    model: state.model,
    sidebarCollapsed: state.sidebarCollapsed,
    welcomeDismissed: state.welcomeDismissed,
    savedEntries: state.savedEntries,
    encyclopediaEntries: state.encyclopediaEntries,
    dailyGoal: state.dailyGoal,
    weeklyGoal: state.weeklyGoal,
    writingMinutes: state.writingMinutes,
  };

  window.localStorage.setItem(STATE_STORAGE, JSON.stringify(payload));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNovelStore = create<NovelStore>((set) => ({
  apiKey: "",
  apiKeyPersisted: false,
  model: defaultPersistedState.model,
  currentNovel: defaultNovel,
  chapterDraft: defaultPersistedState.chapterDraft,
  aiCallCount: defaultPersistedState.aiCallCount,
  tokenUsage: defaultPersistedState.tokenUsage,
  apiBalance: defaultPersistedState.apiBalance,
  sidebarCollapsed: defaultPersistedState.sidebarCollapsed,
  commandOpen: false,
  shortcutOpen: false,
  welcomeDismissed: defaultPersistedState.welcomeDismissed,
  toasts: [],
  savedEntries: defaultPersistedState.savedEntries,
  encyclopediaEntries: defaultPersistedState.encyclopediaEntries,
  dailyGoal: defaultPersistedState.dailyGoal,
  weeklyGoal: defaultPersistedState.weeklyGoal,
  writingMinutes: defaultPersistedState.writingMinutes,
  setApiKey: (value, persistKey = false) => {
    persistApiKey(value, persistKey);
    set({ apiKey: value, apiKeyPersisted: persistKey && Boolean(value.trim()) });
  },
  setApiKeyPersisted: (value) => {
    set((state) => {
      persistApiKey(state.apiKey, value);
      return { apiKeyPersisted: value && Boolean(state.apiKey.trim()) };
    });
  },
  clearApiKey: () => {
    persistApiKey("", false);
    set({ apiKey: "", apiKeyPersisted: false, apiBalance: "未知" });
  },
  hydrateFromStorage: () => {
    const persisted = loadPersistedState();
    const apiKeyPersisted = loadApiKeyPersistence();
    set({
      apiKey: apiKeyPersisted ? loadStoredApiKey() : "",
      apiKeyPersisted,
      model: persisted.model,
      chapterDraft: persisted.chapterDraft,
      aiCallCount: persisted.aiCallCount,
      tokenUsage: persisted.tokenUsage,
      apiBalance: persisted.apiBalance,
      sidebarCollapsed: persisted.sidebarCollapsed,
      welcomeDismissed: persisted.welcomeDismissed,
      savedEntries: persisted.savedEntries,
      encyclopediaEntries: persisted.encyclopediaEntries,
      dailyGoal: persisted.dailyGoal,
      weeklyGoal: persisted.weeklyGoal,
      writingMinutes: persisted.writingMinutes,
    });
  },
  setModel: (value) =>
    set((state) => {
      const next = { ...state, model: value };
      persist(next);
      return { model: value };
    }),
  setCurrentNovel: (novel) => set({ currentNovel: novel }),
  setChapterDraft: (value) =>
    set((state) => {
      const next = { ...state, chapterDraft: value };
      persist(next);
      return { chapterDraft: value };
    }),
  appendToDraft: (value) =>
    set((state) => {
      const nextDraft = `${state.chapterDraft}<hr /><div>${value}</div>`;
      const next = { ...state, chapterDraft: nextDraft };
      persist(next);
      return { chapterDraft: nextDraft };
    }),
  incrementAiCallCount: () =>
    set((state) => {
      const next = { ...state, aiCallCount: state.aiCallCount + 1 };
      persist(next);
      return { aiCallCount: next.aiCallCount };
    }),
  addTokenUsage: (value) =>
    set((state) => {
      const next = { ...state, tokenUsage: state.tokenUsage + value };
      persist(next);
      return { tokenUsage: next.tokenUsage };
    }),
  setApiBalance: (value) =>
    set((state) => {
      const next = { ...state, apiBalance: value };
      persist(next);
      return { apiBalance: value };
    }),
  toggleSidebar: () =>
    set((state) => {
      const next = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
      persist(next);
      return { sidebarCollapsed: next.sidebarCollapsed };
    }),
  setCommandOpen: (value) => set({ commandOpen: value }),
  setShortcutOpen: (value) => set({ shortcutOpen: value }),
  dismissWelcome: () =>
    set((state) => {
      const next = { ...state, welcomeDismissed: true };
      persist(next);
      return { welcomeDismissed: true };
    }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: createId("toast") },
      ].slice(-5),
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  saveEntry: (entry) =>
    set((state) => {
      const nextEntry: SavedEntry = {
        ...entry,
        id: createId("saved"),
        createdAt: new Date().toISOString(),
      };
      const next = {
        ...state,
        savedEntries: [nextEntry, ...state.savedEntries],
      };
      persist(next);
      return { savedEntries: next.savedEntries };
    }),
  saveSetting: (entry) =>
    set((state) => {
      const nextEntry: EncyclopediaEntry = {
        ...entry,
        id: createId("setting"),
        createdAt: new Date().toISOString(),
      };
      const next = {
        ...state,
        encyclopediaEntries: [nextEntry, ...state.encyclopediaEntries],
      };
      persist(next);
      return { encyclopediaEntries: next.encyclopediaEntries };
    }),
  removeSavedEntry: (id) =>
    set((state) => {
      const next = {
        ...state,
        savedEntries: state.savedEntries.filter((entry) => entry.id !== id),
      };
      persist(next);
      return { savedEntries: next.savedEntries };
    }),
  removeSetting: (id) =>
    set((state) => {
      const next = {
        ...state,
        encyclopediaEntries: state.encyclopediaEntries.filter(
          (entry) => entry.id !== id,
        ),
      };
      persist(next);
      return { encyclopediaEntries: next.encyclopediaEntries };
    }),
  setGoals: (dailyGoal, weeklyGoal) =>
    set((state) => {
      const next = { ...state, dailyGoal, weeklyGoal };
      persist(next);
      return { dailyGoal, weeklyGoal };
    }),
}));
