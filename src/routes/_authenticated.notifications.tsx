import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Flame, CheckCircle2, MessageCircle, ShieldCheck, Bell } from "lucide-react";
import { useNotifications, useMarkNotificationRead } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Umriq — Notifications" }] }),
  component: Notifications,
});

const iconFor = (type: string) => {
  if (type.includes("urgent")) return Flame;
  if (type.includes("booking")) return CheckCircle2;
  if (type.includes("message")) return MessageCircle;
  return ShieldCheck;
};
const tintFor = (type: string) => {
  if (type.includes("urgent")) return "text-[var(--crimson)] bg-[var(--crimson)]/15";
  if (type.includes("booking")) return "text-emerald-400 bg-emerald-400/10";
  if (type.includes("message")) return "text-primary bg-primary/15";
  return "text-blue-400 bg-blue-400/10";
};

function timeAgo(iso: string, lang: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return lang === "ar" ? "الآن" : "now";
  if (m < 60) return lang === "ar" ? `${m}د` : `${m}m`;
  if (m < 1440) return lang === "ar" ? `${Math.floor(m / 60)}س` : `${Math.floor(m / 60)}h`;
  return lang === "ar" ? `${Math.floor(m / 1440)}ي` : `${Math.floor(m / 1440)}d`;
}

function Notifications() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const { data: list = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <AppShell title={t("notifTitle")}>
      <div className="space-y-2.5">
        {isLoading && <div className="h-20 card-luxe animate-pulse" />}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16">
            <Bell className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</p>
          </div>
        )}
        {list.map((n, i) => {
          const Icon = iconFor(n.type);
          return (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
                if (n.link) nav({ to: n.link as never });
              }}
              className={`w-full card-luxe p-4 flex gap-3 relative text-start ${!n.read ? "ring-1 ring-primary/20" : ""}`}
            >
              {!n.read && <span className="absolute top-3 end-3 size-2 rounded-full bg-primary shadow-glow" />}
              <div className={`size-11 rounded-2xl grid place-items-center shrink-0 ${tintFor(n.type)}`}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{lang === "ar" ? n.title_ar : n.title_en}</p>
                {(n.body_ar || n.body_en) && <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? n.body_ar : n.body_en}</p>}
                <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(n.created_at, lang)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </AppShell>
  );
}
