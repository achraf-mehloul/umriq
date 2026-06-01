import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Plane, Flame, Inbox, CheckCircle2, ArrowUpRight, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { useDashboardStats, useMyAgency, useOffers } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Umriq — Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { data: agency } = useMyAgency();
  const { data: stats } = useDashboardStats();
  const { data: urgentOffers = [] } = useOffers({ urgent: true, sort: "newest" });

  const cards = [
    { label: t("publishedSeats"), value: stats?.published ?? 0, icon: Plane, accent: "primary" },
    { label: t("soldSeats"), value: stats?.sold ?? 0, icon: CheckCircle2, accent: "emerald" },
    { label: t("urgentOffers"), value: stats?.urgent ?? 0, icon: Flame, accent: "crimson" },
    { label: t("activeRequests"), value: stats?.pending ?? 0, icon: Inbox, accent: "primary" },
  ];

  return (
    <AppShell>
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">{t("welcome")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : (lang === "ar" ? "وكالتي" : "My Agency")}
        </h1>
      </section>

      {!agency && (
        <Link to="/profile" className="block mb-6 card-luxe p-4 ring-1 ring-primary/40 bg-primary/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">{lang === "ar" ? "أنشئ ملف وكالتك" : "Set up your agency"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "أكمل بيانات الوكالة لتبدأ النشر" : "Complete your agency profile to start publishing"}</p>
            </div>
            <ArrowUpRight className="size-4 text-primary rtl:rotate-90" />
          </div>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-luxe p-4 relative overflow-hidden">
            <div className={`absolute -top-8 -right-8 rtl:right-auto rtl:-left-8 size-24 rounded-full blur-2xl opacity-30 ${s.accent === "emerald" ? "bg-[var(--emerald)]" : s.accent === "crimson" ? "bg-[var(--crimson)]" : "bg-primary"}`} />
            <div className="size-10 rounded-xl glass grid place-items-center"><s.icon className="size-5 text-primary" strokeWidth={2} /></div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("marketOverview")}</h2>
          <TrendingUp className="size-4 text-primary" />
        </div>
        <div className="card-luxe p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-halo)" }} />
          <div className="relative flex items-end gap-2 h-28">
            {[40, 65, 50, 78, 60, 90, 72].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.1 + i * 0.07, duration: 0.6 }} className="flex-1 rounded-t-md bg-gold-gradient opacity-90" />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("urgentOpps")}</h2>
          <Link to="/market" className="text-xs text-primary font-semibold flex items-center gap-1">
            {lang === "ar" ? "عرض الكل" : "View all"} <ArrowUpRight className="size-3 rtl:rotate-90" />
          </Link>
        </div>
        <div className="space-y-3">
          {urgentOffers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">—</p>}
          {urgentOffers.slice(0, 3).map((o) => (
            <Link key={o.id} to="/offer/$id" params={{ id: o.id }} className="block">
              <div className="card-luxe p-4 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition">
                <div className="size-12 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/40 grid place-items-center shrink-0">
                  <Flame className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{o.agencies ? (lang === "ar" ? o.agencies.name_ar : o.agencies.name_en) : o.airline}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{lang === "ar" ? o.city_from_ar : o.city_from_en} → {lang === "ar" ? o.city_to_ar : o.city_to_en}</span>
                    <span>·</span>
                    <span>{o.remaining_seats} {t("seats")}</span>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-gold">{Number(o.price).toLocaleString()}</p>
                  {o.expires_at && (
                    <div className="flex items-center gap-1 text-[10px] text-crimson mt-0.5 justify-end">
                      <Clock className="size-3" /> {Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 3600000))}h
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
