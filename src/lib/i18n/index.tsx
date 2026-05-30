import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang, type DictKey } from "./dict";

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (k: DictKey) => string;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("umriq.lang")) as Lang | null;
    if (saved) setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("umriq.lang", lang);
  }, [lang]);

  const value: I18nCtx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (k) => dict[lang][k] ?? dict.en[k] ?? k,
    setLang: setLangState,
    toggle: () => setLangState((p) => (p === "ar" ? "en" : "ar")),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
