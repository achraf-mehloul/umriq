import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Plane, Flame, Inbox, CheckCircle2, ArrowUpRight, Clock, AlertCircle } from "lucide-react";
import { useDashboardStats, useMyAgency, useOffers } from "@/lib/api";
import { MarketChart } from "@/components/MarketChart";
import { useHydrateQuery, usePersistQuery } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Umriq — Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { data: agency } = useMyAgency();
  const { data: stats } = useDashboardStats();
  const { data: urgentOffers = [] } = useOffers({ urgent: true, sort: "newest" });

  // Offline: hydrate urgent offers from IndexedDB on cold start, persist updates.
  useHydrateQuery("urgent-offers", ["offers", { urgent: true, sort: "newest" }]);
  usePersistQuery("urgent-offers", ["offers", { urgent: true, sort: "newest" }]);

  const cards = [
    { label: t("publishedSeats"), value: stats?.published ?? 0, icon: Plane },
    { label: t("soldSeats"), value: stats?.sold ?? 0, icon: CheckCircle2 },
    { label: t("urgentOffers"), value: stats?.urgent ?? 0, icon: Flame },
    { label: t("activeRequests"), value: stats?.pending ?? 0, icon: Inbox },
  ];

  const greeting = lang === "ar" ? "السلام عليكم" : "Welcome back";

  return (
    <AppShell>
      {/* Editorial greeting */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="hero-rail"
      >
        <p className="eyebrow">{greeting}</p>
        <h1 className="display-lg mt-3 text-foreground">
          {agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : (lang === "ar" ? "وكالتي" : "Your agency")}
        </h1>
        <p className="mt-4 text-[15px] text-muted-foreground max-w-md leading-relaxed">
          {lang === "ar"
            ? "نظرة هادئة على رحلتك اليومية ومقاعدك المنشورة."
            : "A calm overview of your day and published seats."}
        </p>
      </motion.section>

      {!agency && (
        <Link to="/profile" className="block mb-8 card-glass p-5 press">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[oklch(0.36_0.06_170/0.1)] grid place-items-center shrink-0">
              <AlertCircle className="size-5 text-[var(--emerald)]" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-foreground">{lang === "ar" ? "أنشئ ملف وكالتك" : "Set up your agency"}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{lang === "ar" ? "أكمل بياناتك لتبدأ النشر" : "Complete your profile to start"}</p>
            </div>
            <ArrowUpRight className="size-4 text-foreground/40 rtl:rotate-90" />
          </div>
        </Link>
      )}

      {/* Stats — quiet glass tiles with stagger */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 stagger">
        {cards.map((s, i) => (
          <div
            key={s.label}
            style={{ "--i": i } as React.CSSProperties}
            className="card-glass p-5"
          >
            <s.icon className="size-[18px] text-[var(--emerald)]" strokeWidth={1.7} />
            <p className="mt-5 font-display text-[2rem] font-medium tracking-[-0.02em] text-foreground leading-none">
              {s.value}
            </p>
            <p className="eyebrow mt-2 !normal-case !tracking-normal !text-[12px] !font-normal text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>


      {/* Market overview — live trading-style chart */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[1.25rem] font-medium tracking-tight">{t("marketOverview")}</h2>
          <Link to="/market" className="text-[12px] text-[var(--emerald)] font-medium">
            {lang === "ar" ? "افتح السوق" : "Open market"}
          </Link>
        </div>
        <MarketChart />
      </section>

      {/* Urgent — editorial list */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[1.25rem] font-medium tracking-tight">{t("urgentOpps")}</h2>
          <Link to="/market" className="text-[13px] text-[var(--emerald)] font-medium flex items-center gap-1">
            {lang === "ar" ? "عرض الكل" : "View all"} <ArrowUpRight className="size-3.5 rtl:rotate-90" />
          </Link>
        </div>
        <div className="space-y-2">
          {urgentOffers.length === 0 && (
            <div className="rounded-2xl glass p-8 text-center text-[14px] text-muted-foreground">
              {lang === "ar" ? "لا توجد عروض عاجلة" : "No urgent offers"}
            </div>
          )}
          {urgentOffers.slice(0, 3).map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
            >
              <Link to="/offer/$id" params={{ id: o.id }} className="block press">
                <div className="rounded-2xl glass p-4 flex items-center gap-4">
                  <div className="size-11 rounded-2xl bg-[oklch(0.97_0.012_170)] grid place-items-center shrink-0">
                    <Plane className="size-[18px] text-[var(--emerald)]" strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground truncate">
                      {o.agencies ? (lang === "ar" ? o.agencies.name_ar : o.agencies.name_en) : o.airline}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-1">
                      <span className="truncate">{lang === "ar" ? o.city_from_ar : o.city_from_en} — {lang === "ar" ? o.city_to_ar : o.city_to_en}</span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-display text-[15px] font-medium text-foreground">{Number(o.price).toLocaleString()}</p>
                    {o.expires_at && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 justify-end">
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
