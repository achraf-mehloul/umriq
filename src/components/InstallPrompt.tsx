import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const { lang } = useI18n();
  const [ev, setEv] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("umriq.install.dismissed")) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEv(e as BIPEvent);
      setTimeout(() => setShow(true), 1200);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("umriq.install.dismissed", "1");
    setShow(false);
  };
  const install = async () => {
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && ev && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-28 inset-x-3 z-[60] max-w-xl mx-auto"
        >
          <div className="glass-strong card-gold-edge rounded-2xl p-4 flex items-center gap-3 shadow-luxe">
            <div className="size-11 rounded-xl bg-gold-gradient grid place-items-center shrink-0 shadow-gold">
              <Download className="size-5 text-[oklch(0.13_0.02_265)]" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{lang === "ar" ? "ثبّت تطبيق Umriq" : "Install Umriq"}</p>
              <p className="text-[11px] text-muted-foreground">{lang === "ar" ? "وصول أسرع، تجربة كاملة" : "Faster access, full experience"}</p>
            </div>
            <button onClick={install} className="h-9 px-4 rounded-xl bg-gold-gradient text-[oklch(0.13_0.02_265)] text-xs font-bold shadow-gold active:scale-95 transition">
              {lang === "ar" ? "تثبيت" : "Install"}
            </button>
            <button onClick={dismiss} className="size-8 grid place-items-center text-muted-foreground hover:text-foreground transition">
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
