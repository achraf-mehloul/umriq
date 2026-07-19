/**
 * Local-first autosave for multi-step forms (publish, booking).
 * Persists to localStorage with a debounced writer; hydrates once on mount.
 */
import { useEffect, useRef, useState } from "react";

const NS = "umriq.draft.v1.";

export function useAutosave<T>(key: string, initial: T, debounceMs = 500) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(NS + key);
      if (!raw) return initial;
      return { ...initial, ...JSON.parse(raw) } as T;
    } catch {
      return initial;
    }
  });
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
      } catch {
        /* quota — silent */
      }
    }, debounceMs);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [key, value, debounceMs]);

  const clear = () => {
    try {
      localStorage.removeItem(NS + key);
    } catch {
      /* silent */
    }
  };
  return [value, setValue, clear] as const;
}
