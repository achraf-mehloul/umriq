import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, PlusCircle, MessageCircle, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const { t } = useI18n();
  const loc = useLocation();
  const items = [
    { to: "/dashboard", icon: Home, label: t("navHome") },
    { to: "/market", icon: Store, label: t("navMarket") },
    { to: "/publish", icon: PlusCircle, label: t("navPublish"), primary: true },
    { to: "/messages", icon: MessageCircle, label: t("navMessages") },
    { to: "/profile", icon: User, label: t("navProfile") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom px-3 pt-2">
      <div className="glass-strong shadow-luxe rounded-3xl mx-auto max-w-xl px-2 py-2 flex items-center justify-around">
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          if (it.primary) {
            return (
              <Link key={it.to} to={it.to} className="-mt-7 relative">
                <motion.div whileTap={{ scale: 0.92 }} className="size-14 rounded-2xl bg-gold-gradient shadow-gold grid place-items-center ring-1 ring-[oklch(0.78_0.13_78/0.4)]">
                  <Icon className="size-6 text-[oklch(0.15_0.02_260)]" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }
          return (
            <Link key={it.to} to={it.to} className="relative flex-1 grid place-items-center py-1.5">
              <motion.div whileTap={{ scale: 0.9 }} className={cn("flex flex-col items-center gap-0.5 transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-medium">{it.label}</span>
              </motion.div>
              {active && (
                <motion.div layoutId="navdot" className="absolute -top-1 size-1 rounded-full bg-primary shadow-glow" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
