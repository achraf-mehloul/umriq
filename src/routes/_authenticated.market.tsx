import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plane, Clock, Flame, BadgeCheck, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { useOffers, type OfferFilters } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({ meta: [{ title: "Umriq — Marketplace" }] }),
  component: Market,
});

function Market() {
  const { t, lang } = useI18n();
  const [filters, setFilters] = useState<OfferFilters>({ sort: "newest" });
  const { data: list = [], isLoading } = useOffers(filters);

  const chips: { k: string; l: string; on: () => void; active: boolean }[] = [
    { k: "all", l: lang === "ar" ? "الكل" : "All", on: () => setFilters({ sort: "newest" }), active: !filters.urgent && !filters.verified && filters.sort === "newest" },
    { k: "urgent", l: t("urgent"), on: () => setFilters((f) => ({ ...f, urgent: !f.urgent })), active: !!filters.urgent },
    { k: "best", l: lang === "ar" ? "أفضل سعر" : "Best price", on: () => setFilters((f) => ({ ...f, sort: "price_asc" })), active: filters.sort === "price_asc" },
    { k: "soon", l: lang === "ar" ? "قريباً" : "Soon", on: () => setFilters((f) => ({ ...f, sort: "date_asc" })), active: filters.sort === "date_asc" },
    { k: "ver", l: t("verified"), on: () => setFilters((f) => ({ ...f, verified: !f.verified })), active: !!filters.verified },
  ];

  return (
    <AppShell title={t("marketTitle")}>
      <div className="sticky top-[72px] z-30 -mx-4 px-4 pb-3 pt-1 bg-[oklch(0.13_0.02_260/0.85)] backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-4 text-muted-foreground" />
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={t("search")}
            className="w-full h-12 rounded-2xl bg-[var(--input)] border border-border ps-11 pe-12 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <button className="absolute top-1/2 -translate-y-1/2 end-2 size-9 rounded-xl bg-gold-gradient grid place-items-center shadow-gold">
            <SlidersHorizontal className="size-4 text-[oklch(0.15_0.02_260)]" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {chips.map((c) => (
            <button
              key={c.k}
              onClick={c.on}
              className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition ${
                c.active ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] shadow-gold" : "glass text-muted-foreground"
              }`}
            >{c.l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-luxe h-56 animate-pulse" />
        ))}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16">
            <Plane className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد عروض حالياً" : "No offers available"}</p>
            <Link to="/publish" className="inline-block mt-4 px-5 h-10 leading-10 rounded-xl bg-gold-gradient text-[oklch(0.15_0.02_260)] text-sm font-bold shadow-gold">
              {t("publishNow")}
            </Link>
          </div>
        )}
        {list.map((o, i) => {
          const agency = o.agencies;
          const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
          return (
            <motion.article
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="card-luxe overflow-hidden relative"
            >
              {o.urgent && (
                <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5 bg-[var(--crimson)]/20 ring-1 ring-[var(--crimson)]/50 backdrop-blur px-2.5 py-1 rounded-full">
                  <Flame className="size-3 text-[var(--crimson)]" />
                  <span className="text-[10px] font-bold uppercase text-[oklch(0.85_0.15_25)]">{t("urgent")}</span>
                </div>
              )}
              <Link to="/offer/$id" params={{ id: o.id }} className="block p-4">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center shrink-0 font-bold text-primary overflow-hidden">
                    {agency?.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : aName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm truncate">{aName}</h3>
                      {agency?.verified && <BadgeCheck className="size-4 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Star className="size-3 fill-primary text-primary" />
                      {Number(agency?.rating ?? 0).toFixed(1)} · {o.airline}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.1_0.02_260/0.6)] border border-border/50">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "من" : "From"}</p>
                    <p className="text-sm font-bold mt-0.5">{lang === "ar" ? o.city_from_ar : o.city_from_en}</p>
                  </div>
                  <div className="flex-1 mx-3 relative">
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    <Plane className="size-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rtl:rotate-180" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "إلى" : "To"}</p>
                    <p className="text-sm font-bold mt-0.5">{lang === "ar" ? o.city_to_ar : o.city_to_en}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{new Date(o.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short" })}</span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      {o.remaining_seats}/{o.total_seats} {t("remaining")}
                    </span>
                  </div>
                  {o.urgent && o.expires_at && (
                    <div className="flex items-center gap-1 text-[var(--crimson)] font-semibold">
                      <Clock className="size-3" /> {Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 3600000))}h
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    {o.original_price > o.price && (
                      <p className="text-[11px] text-muted-foreground line-through">{Number(o.original_price).toLocaleString()} {o.currency}</p>
                    )}
                    <p className="text-2xl font-extrabold text-gold leading-tight">{Number(o.price).toLocaleString()}<span className="text-xs text-muted-foreground font-medium ms-1">{o.currency}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <span className="size-11 rounded-xl glass grid place-items-center">
                      <MessageCircle className="size-4 text-primary" />
                    </span>
                    <span className="h-11 px-5 leading-[44px] rounded-xl bg-gold-gradient text-[oklch(0.15_0.02_260)] text-sm font-bold shadow-gold">
                      {t("reserve")}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </AppShell>
  );
}
