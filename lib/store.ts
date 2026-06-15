"use client";

import { create } from "zustand";
import { defaultNovel } from "@/lib/mock-data";
import { getDefaultBaseUrl, getDefaultModel, normalizeModel, normalizeProvider } from "@/lib/llm";
import type {
  EncyclopediaEntry,
  LlmModel,
  LlmProvider,
  Novel,
  SavedEntry,
  ToastMessage,
} from "@/types";

type DailyWritingStat = {
  date: string;
  words: number;
  minutes: number;
};

type NovelStore = {
  provider: LlmProvider;
  apiBaseUrl: string;
  apiKey: string;
  apiKeyPersisted: boolean;
  model: LlmModel;
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
  dailyStats: DailyWritingStat[];
  dailyGoal: number;
  weeklyGoal: number;
  writingMinutes: number;
  setProvider: (value: LlmProvider) => void;
  setApiBaseUrl: (value: string) => void;
  setApiKey: (value: string, persistKey?: boolean) => void;
  setApiKeyPersisted: (value: boolean) => void;
  clearApiKey: () => void;
  hydrateFromStorage: () => void;
  setModel: (value: LlmModel) => void;
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
  updateSavedEntry: (id: string, entry: Pick<SavedEntry, "title" | "content" | "tags">) => void;
  saveSetting: (entry: Omit<EncyclopediaEntry, "id" | "createdAt">) => void;
  removeSavedEntry: (id: string) => void;
  removeSetting: (id: string) => void;
  setGoals: (dailyGoal: number, weeklyGoal: number) => void;
};

const API_KEY_STORAGE = "novelmuse-api-key";
const API_KEY_PERSISTENCE_STORAGE = "novelmuse-api-key-persistence";
const STATE_STORAGE = "novelmuse-state";
const API_KEY_MASK = "novelmuse-local-key";
const initialDraft = "";

type PersistedState = Pick<
  NovelStore,
  | "provider"
  | "apiBaseUrl"
  | "chapterDraft"
  | "aiCallCount"
  | "tokenUsage"
  | "apiBalance"
  | "model"
  | "sidebarCollapsed"
  | "welcomeDismissed"
  | "savedEntries"
  | "encyclopediaEntries"
  | "dailyStats"
  | "dailyGoal"
  | "weeklyGoal"
  | "writingMinutes"
>;

const defaultPersistedState: PersistedState = {
  provider: "deepseek",
  apiBaseUrl: getDefaultBaseUrl("deepseek"),
  chapterDraft: initialDraft,
  aiCallCount: 0,
  tokenUsage: 0,
  apiBalance: "未知",
  model: getDefaultModel("deepseek"),
  sidebarCollapsed: false,
  welcomeDismissed: true,
  savedEntries: [],
  encyclopediaEntries: [],
  dailyStats: [],
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
        String.fromCharCode(char.charCodeAt(0) ^ API_KEY_MASK.charCodeAt(index % API_KEY_MASK.length)),
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
      String.fromCharCode(char.charCodeAt(0) ^ API_KEY_MASK.charCodeAt(index % API_KEY_MASK.length)),
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
    const provider = normalizeProvider(parsed.provider);

    return {
      provider,
      apiBaseUrl: parsed.apiBaseUrl?.trim() ?? getDefaultBaseUrl(provider),
      chapterDraft: parsed.chapterDraft ?? initialDraft,
      aiCallCount: parsed.aiCallCount ?? 0,
      tokenUsage: parsed.tokenUsage ?? 0,
      apiBalance: parsed.apiBalance ?? "未知",
      model: normalizeModel(provider, parsed.model),
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      welcomeDismissed: parsed.welcomeDismissed ?? true,
      savedEntries: parsed.savedEntries ?? [],
      encyclopediaEntries: parsed.encyclopediaEntries ?? [],
      dailyStats: parsed.dailyStats ?? [],
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
    provider: state.provider,
    apiBaseUrl: state.apiBaseUrl,
    chapterDraft: state.chapterDraft,
    aiCallCount: state.aiCallCount,
    tokenUsage: state.tokenUsage,
    apiBalance: state.apiBalance,
    model: state.model,
    sidebarCollapsed: state.sidebarCollapsed,
    welcomeDismissed: state.welcomeDismissed,
    savedEntries: state.savedEntries,
    encyclopediaEntries: state.encyclopediaEntries,
    dailyStats: state.dailyStats,
    dailyGoal: state.dailyGoal,
    weeklyGoal: state.weeklyGoal,
    writingMinutes: state.writingMinutes,
  };

  window.localStorage.setItem(STATE_STORAGE, JSON.stringify(payload));
}

function plainTextLength(html: string) {
  return html.replace(/<[^>]+>/g, "").trim().length;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function updateDailyStats(stats: DailyWritingStat[], previousDraft: string, nextDraft: string) {
  const previousWords = plainTextLength(previousDraft);
  const nextWords = plainTextLength(nextDraft);
  const wordDelta = Math.max(0, nextWords - previousWords);
  const date = todayKey();
  const nextMinutes = wordDelta > 0 ? Math.max(1, Math.ceil(wordDelta / 120)) : 0;
  const existing = stats.find((item) => item.date === date);

  if (!existing) {
    return [...stats, { date, words: nextWords, minutes: nextMinutes }].slice(-14);
  }

  return stats.map((item) =>
    item.date === date
      ? { ...item, words: Math.max(item.words, nextWords), minutes: item.minutes + nextMinutes }
      : item,
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNovelStore = create<NovelStore>((set) => ({
  provider: defaultPersistedState.provider,
  apiBaseUrl: defaultPersistedState.apiBaseUrl,
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
  dailyStats: defaultPersistedState.dailyStats,
  dailyGoal: defaultPersistedState.dailyGoal,
  weeklyGoal: defaultPersistedState.weeklyGoal,
  writingMinutes: defaultPersistedState.writingMinutes,
  setProvider: (value) =>
    set((state) => {
      const model = normalizeModel(value, state.model);
      const apiBaseUrl =
        value === "openai-compatible" ? state.apiBaseUrl || getDefaultBaseUrl(value) : getDefaultBaseUrl(value);
      const next = { ...state, provider: value, model, apiBaseUrl, apiBalance: "未知" };
      persist(next);
      return { provider: value, model, apiBaseUrl, apiBalance: "未知" };
    }),
  setApiBaseUrl: (value) =>
    set((state) => {
      const next = { ...state, apiBaseUrl: value };
      persist(next);
      return { apiBaseUrl: value };
    }),
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
      provider: persisted.provider,
      apiBaseUrl: persisted.apiBaseUrl,
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
      dailyStats: persisted.dailyStats,
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
      const dailyStats = updateDailyStats(state.dailyStats, state.chapterDraft, value);
      const writingMinutes = dailyStats.reduce((sum, item) => sum + item.minutes, 0);
      const next = { ...state, chapterDraft: value, dailyStats, writingMinutes };
      persist(next);
      return { chapterDraft: value, dailyStats, writingMinutes };
    }),
  appendToDraft: (value) =>
    set((state) => {
      const nextDraft = `${state.chapterDraft}<hr /><div>${value}</div>`;
      const dailyStats = updateDailyStats(state.dailyStats, state.chapterDraft, nextDraft);
      const writingMinutes = dailyStats.reduce((sum, item) => sum + item.minutes, 0);
      const next = { ...state, chapterDraft: nextDraft, dailyStats, writingMinutes };
      persist(next);
      return { chapterDraft: nextDraft, dailyStats, writingMinutes };
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
      toasts: [...state.toasts, { ...toast, id: createId("toast") }].slice(-5),
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
      const next = { ...state, savedEntries: [nextEntry, ...state.savedEntries] };
      persist(next);
      return { savedEntries: next.savedEntries };
    }),
  updateSavedEntry: (id, entry) =>
    set((state) => {
      const next = {
        ...state,
        savedEntries: state.savedEntries.map((item) =>
          item.id === id ? { ...item, title: entry.title, content: entry.content, tags: entry.tags } : item,
        ),
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
        encyclopediaEntries: state.encyclopediaEntries.filter((entry) => entry.id !== id),
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
