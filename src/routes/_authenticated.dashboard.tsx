import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Plane, Flame, Inbox, CheckCircle2, ArrowUpRight, Clock, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
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
    { label: t("publishedSeats"), value: stats?.published ?? 0, icon: Plane, accent: "gold" },
    { label: t("soldSeats"), value: stats?.sold ?? 0, icon: CheckCircle2, accent: "emerald" },
    { label: t("urgentOffers"), value: stats?.urgent ?? 0, icon: Flame, accent: "crimson" },
    { label: t("activeRequests"), value: stats?.pending ?? 0, icon: Inbox, accent: "sapphire" },
  ];

  const accentBg: Record<string, string> = {
    gold: "bg-[var(--gold)]",
    emerald: "bg-[var(--emerald)]",
    crimson: "bg-[var(--crimson)]",
    sapphire: "bg-[var(--sapphire)]",
  };

  return (
    <AppShell>
      {/* Hero header with mesh + greeting */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-7 rounded-[28px] overflow-hidden card-luxe card-gold-edge p-6"
      >
        <div className="absolute inset-0 opacity-90" style={{ background: "var(--gradient-aurora)" }} />
        <div className="glow-orb -top-20 -right-20 size-56 opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
            <Sparkles className="size-3" /> {t("welcome")}
          </div>
          <h1 className="font-display text-[2rem] leading-tight font-extrabold tracking-tight mt-2">
            {agency ? (
              <span className="text-shimmer">{lang === "ar" ? agency.name_ar : agency.name_en}</span>
            ) : (
              <span className="text-foreground">{lang === "ar" ? "وكالتي" : "My Agency"}</span>
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {lang === "ar" ? "مرحباً بك في مركز قيادة وكالتك اللحظي." : "Welcome to your live agency command center."}
          </p>
        </div>
      </motion.section>

      {!agency && (
        <Link to="/profile" className="block mb-6 card-luxe card-gold-edge p-4 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gold-gradient grid place-items-center shrink-0">
              <AlertCircle className="size-5 text-[oklch(0.13_0.02_265)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{lang === "ar" ? "أنشئ ملف وكالتك" : "Set up your agency"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "أكمل بيانات الوكالة لتبدأ النشر" : "Complete your agency profile to start publishing"}</p>
            </div>
            <ArrowUpRight className="size-4 text-primary rtl:rotate-90" />
          </div>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 mb-7">
        {cards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className="card-luxe p-4 relative overflow-hidden group"
          >
            <div className={`absolute -top-10 -right-10 rtl:right-auto rtl:-left-10 size-28 rounded-full blur-3xl opacity-25 group-hover:opacity-40 transition-opacity ${accentBg[s.accent]}`} />
            <div className="size-11 rounded-2xl glass-gold grid place-items-center">
              <s.icon className="size-5 text-primary" strokeWidth={2.2} />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-shimmer">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("marketOverview")}</h2>
          <div className="flex items-center gap-1 text-xs text-emerald font-semibold">
            <TrendingUp className="size-3.5" /> +24%
          </div>
        </div>
        <div className="card-luxe card-gold-edge p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-halo)" }} />
          <div className="relative flex items-end gap-2 h-32">
            {[40, 65, 50, 78, 60, 90, 72].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${h}%`, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-t-lg bg-gold-gradient relative overflow-hidden"
                style={{ boxShadow: "0 -4px 20px oklch(0.81 0.135 82 / 0.3)" }}
              >
                <div className="absolute inset-0 shimmer" />
              </motion.div>
            ))}
          </div>
          <div className="relative mt-3 flex justify-between text-[10px] text-muted-foreground font-medium">
            {["S","M","T","W","T","F","S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("urgentOpps")}</h2>
          <Link to="/market" className="text-xs text-primary font-bold flex items-center gap-1 hover:gap-1.5 transition-all">
            {lang === "ar" ? "عرض الكل" : "View all"} <ArrowUpRight className="size-3 rtl:rotate-90" />
          </Link>
        </div>
        <div className="space-y-3">
          {urgentOffers.length === 0 && (
            <div className="card-luxe p-6 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "لا توجد عروض عاجلة" : "No urgent offers"}
            </div>
          )}
          {urgentOffers.slice(0, 3).map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Link to="/offer/$id" params={{ id: o.id }} className="block">
                <div className="card-luxe p-4 flex items-center gap-3 hover:ring-1 hover:ring-primary/40 hover:-translate-y-0.5 transition-all">
                  <div className="size-12 rounded-2xl bg-gold-gradient grid place-items-center shrink-0 shadow-gold">
                    <Flame className="size-5 text-[oklch(0.13_0.02_265)]" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{o.agencies ? (lang === "ar" ? o.agencies.name_ar : o.agencies.name_en) : o.airline}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{lang === "ar" ? o.city_from_ar : o.city_from_en} → {lang === "ar" ? o.city_to_ar : o.city_to_en}</span>
                      <span>·</span>
                      <span>{o.remaining_seats} {t("seats")}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-display text-sm font-bold text-gold">{Number(o.price).toLocaleString()}</p>
                    {o.expires_at && (
                      <div className="flex items-center gap-1 text-[10px] text-crimson mt-0.5 justify-end font-semibold">
                        <Clock className="size-3" /> {Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 3600000))}h
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
