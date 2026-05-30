import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { notifs } from "@/data/mock";
import { motion } from "framer-motion";
import { Flame, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Umriq — Notifications" }] }),
  component: Notifications,
});

const ICON = { urgent: Flame, deal: CheckCircle2, message: MessageCircle, system: ShieldCheck };
const TINT = { urgent: "text-[var(--crimson)] bg-[var(--crimson)]/15", deal: "text-emerald-400 bg-emerald-400/10", message: "text-primary bg-primary/15", system: "text-blue-400 bg-blue-400/10" };

function Notifications() {
  const { t, lang } = useI18n();
  return (
    <AppShell title={t("notifTitle")}>
      <div className="space-y-2.5">
        {notifs.map((n, i) => {
          const Icon = ICON[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card-luxe p-4 flex gap-3 relative ${n.unread ? "ring-1 ring-primary/20" : ""}`}
            >
              {n.unread && <span className="absolute top-3 end-3 size-2 rounded-full bg-primary shadow-glow" />}
              <div className={`size-11 rounded-2xl grid place-items-center shrink-0 ${TINT[n.type]}`}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{lang === "ar" ? n.titleAr : n.titleEn}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? n.bodyAr : n.bodyEn}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1.5">{n.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppShell>
  );
}
