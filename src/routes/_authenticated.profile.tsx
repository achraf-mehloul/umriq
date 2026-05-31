import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { BadgeCheck, Star, Award, Zap, ShieldCheck, Crown, Settings, LogOut, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Umriq — Profile" }] }),
  component: Profile,
});

function Profile() {
  const { t, lang } = useI18n();
  const nav = useNavigate();

  return (
    <AppShell title={t("profileTitle")}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-luxe overflow-hidden mb-5">
        <div className="h-28 relative" style={{ background: "var(--gradient-gold)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 50%, oklch(1 0 0 / 0.3), transparent)" }} />
          <div className="absolute top-3 end-3 flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
            <Crown className="size-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("premium")}</span>
          </div>
        </div>
        <div className="px-5 pb-5 -mt-12 relative">
          <div className="size-24 rounded-3xl bg-card ring-4 ring-card grid place-items-center text-3xl font-extrabold text-gold shadow-luxe">
            ح
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">{lang === "ar" ? "وكالة الحرمين" : "Al Haramain Travel"}</h2>
            <BadgeCheck className="size-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "الجزائر · منذ 2018" : "Algiers · Since 2018"}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <Star className="size-4 fill-primary text-primary" />
            <span className="font-bold text-sm">4.9</span>
            <span className="text-xs text-muted-foreground">({lang === "ar" ? "127 صفقة" : "127 deals"})</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { v: "127", l: t("completedDeals") },
          { v: "4.9", l: t("rating") },
          { v: "8", l: t("experience") },
        ].map((s) => (
          <div key={s.l} className="card-luxe p-3 text-center">
            <p className="text-xl font-extrabold text-gold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.l}</p>
          </div>
        ))}
      </div>

      <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">{t("badges")}</h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { i: Award, l: t("badgeGold"), c: "from-amber-400/30 to-yellow-600/20 text-primary ring-primary/40" },
          { i: Zap, l: t("badgeFast"), c: "from-blue-400/20 to-cyan-600/20 text-blue-400 ring-blue-400/40" },
          { i: ShieldCheck, l: t("badgeTrusted"), c: "from-emerald-400/20 to-green-600/20 text-emerald-400 ring-emerald-400/40" },
        ].map((b) => (
          <div key={b.l} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-br ring-1 ${b.c}`}>
            <b.i className="size-4" />
            <span className="text-xs font-bold">{b.l}</span>
          </div>
        ))}
      </div>

      <div className="card-luxe divide-y divide-border/50">
        {[
          { i: Settings, l: lang === "ar" ? "الإعدادات" : "Settings" },
          { i: ShieldCheck, l: lang === "ar" ? "الأمان والخصوصية" : "Security & privacy" },
          { i: Crown, l: t("subscription"), tag: t("premium") },
        ].map((it) => (
          <button key={it.l} className="w-full flex items-center gap-3 p-4 text-start hover:bg-white/[0.02] transition">
            <div className="size-9 rounded-lg glass grid place-items-center">
              <it.i className="size-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium">{it.l}</span>
            {it.tag && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{it.tag}</span>}
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </button>
        ))}
      </div>

      <button onClick={() => nav({ to: "/login" })} className="mt-5 w-full h-12 rounded-2xl glass text-[var(--crimson)] font-semibold flex items-center justify-center gap-2">
        <LogOut className="size-4" /> {t("logout")}
      </button>
    </AppShell>
  );
}
