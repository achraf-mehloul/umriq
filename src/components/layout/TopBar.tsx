import { useI18n } from "@/lib/i18n";
import { Bell, Languages } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function TopBar({ title }: { title?: string }) {
  const { t, lang, toggle } = useI18n();
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-3 backdrop-blur-xl bg-[oklch(0.13_0.02_260/0.7)] border-b border-border/40">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          {title ? (
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          ) : (
            <Logo size={28} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="size-10 rounded-xl glass grid place-items-center hover:ring-1 hover:ring-primary/40 transition">
            <Languages className="size-4 text-muted-foreground" />
            <span className="sr-only">{t("language")}</span>
          </button>
          <Link to="/notifications" className="size-10 rounded-xl glass grid place-items-center hover:ring-1 hover:ring-primary/40 transition relative">
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary shadow-glow" />
          </Link>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">{lang}</span>
        </div>
      </div>
    </header>
  );
}
