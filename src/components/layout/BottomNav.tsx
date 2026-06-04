import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const { t } = useI18n();
  const loc = useLocation();
  const items = [
    { to: "/dashboard", icon: Home, label: t("navHome") },
    { to: "/market", icon: Compass, label: t("navMarket") },
    { to: "/publish", icon: Plus, label: t("navPublish") },
    { to: "/messages", icon: MessageCircle, label: t("navMessages") },
    { to: "/profile", icon: User, label: t("navProfile") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom px-5 pointer-events-none">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="relative glass-strong rounded-full mx-auto max-w-md px-2 py-2 flex items-center justify-between pointer-events-auto"
      >
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="relative flex-1 grid place-items-center py-1.5 press"
            >
              {active && (
                <motion.div
                  layoutId="navpill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-1 rounded-full bg-[oklch(0.36_0.06_170/0.08)]"
                />
              )}
              <div
                className={cn(
                  "relative flex flex-col items-center gap-0.5 transition-colors duration-300",
                  active ? "text-[var(--emerald)]" : "text-foreground/45"
                )}
              >
                <Icon className="size-[20px]" strokeWidth={active ? 2.2 : 1.7} />
                <span className="text-[10px] font-medium tracking-tight">{it.label}</span>
              </div>
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
