import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, PlusCircle, MessageCircle, User, Bell } from "lucide-react";
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
    <>
      {/* Floating Notifications — positioned at bottom-end above the nav */}
      <Link
        to="/notifications"
        className="fixed z-50 end-5 bottom-28 group"
        aria-label={t("notifTitle" as never) as string}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 22 }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          className="relative size-12 rounded-full glass-strong grid place-items-center shadow-luxe ring-1 ring-white/[0.08]"
        >
          <span className="absolute inset-0 rounded-full bg-gold-gradient opacity-0 group-hover:opacity-20 transition-opacity" />
          <Bell className="size-[18px] text-primary" strokeWidth={2.2} />
          <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-[var(--crimson)] shadow-[0_0_10px_oklch(0.66_0.22_25/0.8)] pulse-gold" />
        </motion.div>
      </Link>

      <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom px-4 pt-2 pointer-events-none">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative glass-strong shadow-luxe rounded-[32px] mx-auto max-w-xl px-3 py-2.5 flex items-center justify-around pointer-events-auto"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.2 0.024 265 / 0.75), oklch(0.11 0.018 265 / 0.92))",
            backdropFilter: "blur(36px) saturate(200%)",
            border: "1px solid oklch(1 0 0 / 0.07)",
          }}
        >
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {items.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            const Icon = it.icon;
            if (it.primary) {
              return (
                <Link key={it.to} to={it.to} className="-mt-8 relative">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="size-[58px] rounded-[20px] bg-gold-gradient shadow-gold grid place-items-center ring-2 ring-[oklch(0.81_0.135_82/0.25)] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 rounded-[20px] pulse-gold" />
                    <div className="absolute inset-0 shimmer opacity-60" />
                    <Icon className="size-7 text-[oklch(0.13_0.02_265)] relative" strokeWidth={2.6} />
                  </motion.div>
                </Link>
              );
            }
            return (
              <Link key={it.to} to={it.to} className="relative flex-1 grid place-items-center py-1.5">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground/80"
                  )}
                >
                  <Icon className="size-[20px]" strokeWidth={active ? 2.5 : 1.9} />
                  <span className="text-[10px] font-semibold tracking-tight">{it.label}</span>
                </motion.div>
                {active && (
                  <motion.div
                    layoutId="navdot"
                    className="absolute -top-1 h-1 w-7 rounded-full bg-gold-gradient shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
}
