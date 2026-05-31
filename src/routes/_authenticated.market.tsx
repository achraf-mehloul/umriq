import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { offers } from "@/data/mock";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plane, Clock, Flame, BadgeCheck, MessageCircle, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({ meta: [{ title: "Umriq — Marketplace" }] }),
  component: Market,
});

function Market() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<"all" | "urgent">("all");
  const list = filter === "urgent" ? offers.filter(o => o.urgent) : offers;

  return (
    <AppShell title={t("marketTitle")}>
      <div className="sticky top-[72px] z-30 -mx-4 px-4 pb-3 pt-1 bg-[oklch(0.13_0.02_260/0.85)] backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-4 text-muted-foreground" />
          <input placeholder={t("search")} className="w-full h-12 rounded-2xl bg-[var(--input)] border border-border ps-11 pe-12 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
          <button className="absolute top-1/2 -translate-y-1/2 end-2 size-9 rounded-xl bg-gold-gradient grid place-items-center shadow-gold">
            <SlidersHorizontal className="size-4 text-[oklch(0.15_0.02_260)]" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {[
            { k: "all", l: lang === "ar" ? "الكل" : "All" },
            { k: "urgent", l: t("urgent") },
            { k: "soon", l: lang === "ar" ? "قريباً" : "Soon" },
            { k: "best", l: lang === "ar" ? "أفضل سعر" : "Best price" },
            { k: "ver", l: t("verified") },
          ].map((c) => (
            <button
              key={c.k}
              onClick={() => c.k === "urgent" || c.k === "all" ? setFilter(c.k as any) : null}
              className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition ${
                (filter === c.k) ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] shadow-gold" : "glass text-muted-foreground"
              }`}
            >{c.l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {list.map((o, i) => (
          <motion.article
            key={o.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-luxe overflow-hidden relative"
          >
            {o.urgent && (
              <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5 bg-[var(--crimson)]/20 ring-1 ring-[var(--crimson)]/50 backdrop-blur px-2.5 py-1 rounded-full">
                <Flame className="size-3 text-[var(--crimson)]" />
                <span className="text-[10px] font-bold uppercase text-[oklch(0.85_0.15_25)]">{t("urgent")}</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center shrink-0 font-bold text-primary">
                  {(lang === "ar" ? o.agencyAr : o.agencyEn).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate">{lang === "ar" ? o.agencyAr : o.agencyEn}</h3>
                    {o.verified && <BadgeCheck className="size-4 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Star className="size-3 fill-primary text-primary" />
                    {o.rating} · {o.airline}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.1_0.02_260/0.6)] border border-border/50">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "من" : "From"}</p>
                  <p className="text-sm font-bold mt-0.5">{lang === "ar" ? o.cityAr : o.cityEn}</p>
                </div>
                <div className="flex-1 mx-3 relative">
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <Plane className="size-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rtl:rotate-180" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "إلى" : "To"}</p>
                  <p className="text-sm font-bold mt-0.5">{lang === "ar" ? "مكة" : "Makkah"}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{new Date(o.date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short" })}</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {o.remaining}/{o.totalSeats} {t("remaining")}
                  </span>
                </div>
                {o.urgent && (
                  <div className="flex items-center gap-1 text-[var(--crimson)] font-semibold">
                    <Clock className="size-3" /> {o.hoursLeft}h
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground line-through">{o.originalPrice.toLocaleString()} DZD</p>
                  <p className="text-2xl font-extrabold text-gold leading-tight">{o.price.toLocaleString()}<span className="text-xs text-muted-foreground font-medium ms-1">DZD</span></p>
                </div>
                <div className="flex gap-2">
                  <button className="size-11 rounded-xl glass grid place-items-center hover:ring-1 hover:ring-primary/40 transition">
                    <MessageCircle className="size-4 text-primary" />
                  </button>
                  <button className="h-11 px-5 rounded-xl bg-gold-gradient text-[oklch(0.15_0.02_260)] text-sm font-bold shadow-gold active:scale-95 transition">
                    {t("reserve")}
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </AppShell>
  );
}
