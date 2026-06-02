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
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom px-3 pt-2 pointer-events-none">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong shadow-luxe rounded-[28px] mx-auto max-w-xl px-2 py-2 flex items-center justify-around pointer-events-auto relative"
      >
        <div className="absolute inset-0 rounded-[28px] pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-2/3 h-full opacity-50 blur-2xl bg-gold-gradient" />
        </div>
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          if (it.primary) {
            return (
              <Link key={it.to} to={it.to} className="-mt-8 relative">
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} className="size-16 rounded-2xl bg-gold-gradient shadow-gold grid place-items-center ring-2 ring-[oklch(0.81_0.135_82/0.3)] relative">
                  <div className="absolute inset-0 rounded-2xl pulse-gold" />
                  <Icon className="size-7 text-[oklch(0.13_0.02_265)] relative" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }
          return (
            <Link key={it.to} to={it.to} className="relative flex-1 grid place-items-center py-1.5">
              <motion.div whileTap={{ scale: 0.88 }} className={cn("flex flex-col items-center gap-0.5 transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="size-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold">{it.label}</span>
              </motion.div>
              {active && (
                <motion.div layoutId="navdot" className="absolute -top-1 h-1 w-8 rounded-full bg-gold-gradient shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
