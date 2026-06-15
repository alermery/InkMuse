"use client";

import { useEffect, useState } from "react";
import { PROJECT_MEMORY_SYNC_EVENT } from "@/lib/project-memory";

function readStoredValue<T>(key: string, initialValue: T) {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (key !== PROJECT_MEMORY_SYNC_EVENT) {
      window.dispatchEvent(new Event(PROJECT_MEMORY_SYNC_EVENT));
    }
  }, [key, value]);

  return [value, setValue] as const;
}
