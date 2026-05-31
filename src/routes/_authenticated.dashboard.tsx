import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Plane, Flame, Inbox, CheckCircle2, ArrowUpRight, Clock, TrendingUp } from "lucide-react";
import { offers } from "@/data/mock";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Umriq — Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();

  const stats = [
    { label: t("publishedSeats"), value: "48", icon: Plane, trend: "+12%", accent: "primary" },
    { label: t("soldSeats"), value: "127", icon: CheckCircle2, trend: "+34%", accent: "emerald" },
    { label: t("urgentOffers"), value: "6", icon: Flame, trend: "live", accent: "crimson" },
    { label: t("activeRequests"), value: "19", icon: Inbox, trend: "+5", accent: "primary" },
  ];

  return (
    <AppShell>
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">{t("welcome")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {lang === "ar" ? "وكالة الحرمين" : "Al Haramain Travel"}
        </h1>
      </section>

      <section className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="card-luxe p-4 relative overflow-hidden"
          >
            <div className={`absolute -top-8 -right-8 rtl:right-auto rtl:-left-8 size-24 rounded-full blur-2xl opacity-30 ${s.accent === "emerald" ? "bg-[var(--emerald)]" : s.accent === "crimson" ? "bg-[var(--crimson)]" : "bg-primary"}`} />
            <div className="flex items-center justify-between relative">
              <div className="size-10 rounded-xl glass grid place-items-center">
                <s.icon className="size-5 text-primary" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{s.trend}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight relative">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 relative">{s.label}</p>
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
          <div className="relative">
            <div className="flex items-end gap-2 h-28">
              {[40, 65, 50, 78, 60, 90, 72].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 rounded-t-md bg-gold-gradient opacity-90"
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>{lang === "ar" ? "آخر 7 أيام" : "Last 7 days"}</span>
              <span className="text-primary font-bold">+24%</span>
            </div>
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
          {offers.filter(o => o.urgent).slice(0, 2).map((o) => (
            <Link key={o.id} to="/market" className="block">
              <div className="card-luxe p-4 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition">
                <div className="size-12 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/40 grid place-items-center shrink-0">
                  <Flame className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{lang === "ar" ? o.agencyAr : o.agencyEn}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{lang === "ar" ? o.cityAr : o.cityEn} → مكة</span>
                    <span>·</span>
                    <span>{o.remaining} {t("seats")}</span>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-gold">{o.price.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-[10px] text-crimson mt-0.5">
                    <Clock className="size-3" /> {o.hoursLeft}h
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("recentActivity")}</h2>
        <div className="card-luxe p-2 divide-y divide-border/50">
          {[
            { i: CheckCircle2, t: lang === "ar" ? "تم بيع 4 مقاعد" : "4 seats sold", s: "12m", c: "text-emerald-400" },
            { i: Inbox, t: lang === "ar" ? "طلب جديد من النور" : "New request from An-Nour", s: "1h", c: "text-primary" },
            { i: Flame, t: lang === "ar" ? "عرض عاجل نشر" : "Urgent offer published", s: "3h", c: "text-orange-400" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="size-9 rounded-lg glass grid place-items-center">
                <a.i className={`size-4 ${a.c}`} />
              </div>
              <p className="flex-1 text-sm">{a.t}</p>
              <span className="text-xs text-muted-foreground">{a.s}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
