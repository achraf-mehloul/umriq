import { Logo } from "@/components/Logo";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TopBar({ title }: { title?: string }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className="absolute inset-0 -z-10 backdrop-blur-2xl bg-[oklch(0.985_0.004_75/0.7)] border-b hairline" />
      <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {title ? (
            <h1 className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            <Logo size={22} />
          )}
        </div>
        <Link
          to="/notifications"
          aria-label={t("notifTitle") as string}
          className="relative size-9 rounded-full glass grid place-items-center press"
        >
          <Bell className="size-[17px] text-foreground/70" strokeWidth={1.8} />
          <span className="absolute top-1.5 end-1.5 size-1.5 rounded-full bg-[var(--emerald)]" />
        </Link>
      </div>
    </header>
  );
}
