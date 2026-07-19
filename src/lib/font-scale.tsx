import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FontScale = "sm" | "md" | "lg" | "xl";

const scales: Record<FontScale, string> = {
  sm: "93.75%", // 15px
  md: "100%",   // 16px
  lg: "112.5%", // 18px
  xl: "125%",   // 20px
};

interface Ctx {
  scale: FontScale;
  setScale: (s: FontScale) => void;
}

const FontScaleContext = createContext<Ctx | null>(null);
const KEY = "umriq.fontScale";

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<FontScale>("md");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem(KEY) as FontScale | null) ?? "md";
    setScaleState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.fontSize = scales[scale];
  }, [scale]);

  const setScale = (s: FontScale) => {
    setScaleState(s);
    try { localStorage.setItem(KEY, s); } catch { /* silent */ }
  };

  return <FontScaleContext.Provider value={{ scale, setScale }}>{children}</FontScaleContext.Provider>;
}

export function useFontScale() {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error("useFontScale must be inside FontScaleProvider");
  return ctx;
}
