import { useI18n } from "@/lib/i18n";
import { Bell, Languages } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export function TopBar({ title }: { title?: string }) {
  const { t, lang, toggle } = useI18n();
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-3">
      <div className="absolute inset-0 -z-10 backdrop-blur-2xl bg-[oklch(0.115_0.018_265/0.55)] border-b border-white/[0.04]" />
      <div className="flex items-center justify-between max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {title ? (
            <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
          ) : (
            <Logo size={28} />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <button onClick={toggle} className="size-10 rounded-xl glass grid place-items-center hover:ring-1 hover:ring-primary/40 transition-all active:scale-95">
            <Languages className="size-4 text-muted-foreground" />
            <span className="sr-only">{t("language")}</span>
          </button>
          <Link to="/notifications" className="size-10 rounded-xl glass grid place-items-center hover:ring-1 hover:ring-primary/40 transition-all active:scale-95 relative">
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary shadow-glow pulse-gold" />
          </Link>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">{lang}</span>
        </motion.div>
      </div>
    </header>
  );
}
