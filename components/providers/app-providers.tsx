"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ToastProvider } from "@/components/providers/toast-provider";
import { useNovelStore } from "@/lib/store";

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE = "inkmuse-theme";

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("inkmuse-theme", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("inkmuse-theme", callback);
  };
}

function subscribeToMounted(callback: () => void) {
  const frame = window.requestAnimationFrame(callback);
  return () => window.cancelAnimationFrame(frame);
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function readServerTheme(): ThemeMode {
  return "dark";
}

function readMountedSnapshot() {
  return true;
}

function readMountedServerSnapshot() {
  return false;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const storedTheme = useSyncExternalStore(
    subscribeToTheme,
    readStoredTheme,
    readServerTheme,
  );
  const theme = storedTheme;
  const mounted = useSyncExternalStore(
    subscribeToMounted,
    readMountedSnapshot,
    readMountedServerSnapshot,
  );

  if (mounted) {
    applyTheme(theme);
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme: (nextTheme) => {
        window.localStorage.setItem(THEME_STORAGE, nextTheme);
        applyTheme(nextTheme);
        window.dispatchEvent(new Event("inkmuse-theme"));
      },
      toggleTheme: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        window.localStorage.setItem(THEME_STORAGE, nextTheme);
        applyTheme(nextTheme);
        window.dispatchEvent(new Event("inkmuse-theme"));
      },
    }),
    [mounted, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ClientHydrator />
      {children}
      <ToastProvider />
    </ThemeContext.Provider>
  );
}

function ClientHydrator() {
  const hydrateFromStorage = useNovelStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    queueMicrotask(hydrateFromStorage);
  }, [hydrateFromStorage]);

  return null;
}

export function useInkMuseTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useInkMuseTheme must be used within AppProviders");
  }

  return context;
}
