import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plane, Clock, Flame, BadgeCheck, Star, ArrowRight } from "lucide-react";
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
      {/* Glass sticky search */}
      <div
        className="sticky top-[78px] z-30 -mx-4 px-4 pb-4 pt-2"
        style={{
          background: "linear-gradient(180deg, oklch(0.115 0.018 265 / 0.92), oklch(0.115 0.018 265 / 0.6))",
          backdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-4 text-muted-foreground" />
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={t("search")}
            className="w-full h-[52px] rounded-2xl glass-strong ps-11 pe-14 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <button className="absolute top-1/2 -translate-y-1/2 end-2 size-10 rounded-xl bg-gold-gradient grid place-items-center shadow-gold">
            <SlidersHorizontal className="size-4 text-[oklch(0.13_0.02_265)]" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {chips.map((c) => (
            <button
              key={c.k}
              onClick={c.on}
              className={`shrink-0 px-4 h-9 rounded-full text-[12px] font-bold transition-all ${
                c.active
                  ? "bg-gold-gradient text-[oklch(0.13_0.02_265)] shadow-gold scale-[1.02]"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >{c.l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-5">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl h-60 animate-pulse glass" />
        ))}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-20">
            <div className="size-16 mx-auto mb-4 rounded-2xl glass-gold grid place-items-center">
              <Plane className="size-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد عروض حالياً" : "No offers available"}</p>
            <Link to="/publish" className="inline-block mt-4 px-6 h-11 leading-[44px] rounded-xl bg-gold-gradient text-[oklch(0.13_0.02_265)] text-sm font-bold shadow-gold">
              {t("publishNow")}
            </Link>
          </div>
        )}

        {list.map((o, i) => {
          const agency = o.agencies;
          const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
          const discount = o.original_price > o.price
            ? Math.round((1 - Number(o.price) / Number(o.original_price)) * 100)
            : 0;
          return (
            <motion.article
              key={o.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-[28px] overflow-hidden card-gold-edge"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.22 0.028 265 / 0.75), oklch(0.13 0.02 265 / 0.92))",
                backdropFilter: "blur(28px) saturate(180%)",
                border: "1px solid oklch(1 0 0 / 0.06)",
                boxShadow:
                  "0 24px 60px -24px oklch(0 0 0 / 0.7), 0 8px 24px -12px oklch(0 0 0 / 0.5)",
              }}
            >
              {/* ambient glow */}
              <div
                className="absolute -top-24 -end-24 size-56 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
                style={{
                  background: o.urgent
                    ? "radial-gradient(circle, oklch(0.66 0.22 25 / 0.6), transparent 70%)"
                    : "radial-gradient(circle, oklch(0.81 0.135 82 / 0.5), transparent 70%)",
                }}
              />

              <Link to="/offer/$id" params={{ id: o.id }} className="relative block p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-2xl glass-gold ring-1 ring-primary/30 grid place-items-center shrink-0 font-bold text-primary overflow-hidden">
                      {agency?.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : aName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm truncate">{aName}</h3>
                        {agency?.verified && <BadgeCheck className="size-4 text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                        <Star className="size-3 fill-primary text-primary" />
                        {Number(agency?.rating ?? 0).toFixed(1)} · {o.airline}
                      </div>
                    </div>
                  </div>
                  {o.urgent && (
                    <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full ring-1 ring-[var(--crimson)]/40 shrink-0">
                      <Flame className="size-3 text-[var(--crimson)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.85_0.15_25)]">{t("urgent")}</span>
                    </div>
                  )}
                </div>

                {/* Route */}
                <div className="mt-5 relative">
                  <div className="flex items-center justify-between gap-3 px-4 py-4 rounded-2xl glass">
                    <div className="text-center min-w-0 flex-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[0.15em]">{lang === "ar" ? "من" : "From"}</p>
                      <p className="text-sm font-extrabold mt-1 truncate">{lang === "ar" ? o.city_from_ar : o.city_from_en}</p>
                    </div>
                    <div className="relative flex-1 flex items-center justify-center">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                      <div className="relative size-9 rounded-full bg-gold-gradient grid place-items-center shadow-gold">
                        <Plane className="size-4 text-[oklch(0.13_0.02_265)] rtl:rotate-180" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="text-center min-w-0 flex-1">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[0.15em]">{lang === "ar" ? "إلى" : "To"}</p>
                      <p className="text-sm font-extrabold mt-1 truncate">{lang === "ar" ? o.city_to_ar : o.city_to_en}</p>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-medium">
                      {new Date(o.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.74_0.16_162/0.7)]" />
                      {o.remaining_seats}/{o.total_seats} {t("remaining")}
                    </span>
                  </div>
                  {o.urgent && o.expires_at && (
                    <div className="flex items-center gap-1 text-[var(--crimson)] font-bold">
                      <Clock className="size-3" /> {Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 3600000))}h
                    </div>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {discount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--emerald)]/15 text-emerald-400 ring-1 ring-[var(--emerald)]/30">
                          −{discount}%
                        </span>
                      )}
                      {o.original_price > o.price && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {Number(o.original_price).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <p className="font-display text-[28px] font-extrabold leading-none text-shimmer mt-1">
                      {Number(o.price).toLocaleString()}
                      <span className="text-[11px] text-muted-foreground font-semibold ms-1">{o.currency}</span>
                    </p>
                  </div>
                  <div className="relative h-12 px-5 rounded-2xl bg-gold-gradient text-[oklch(0.13_0.02_265)] text-sm font-extrabold shadow-gold flex items-center gap-2 overflow-hidden">
                    <span className="absolute inset-0 shimmer opacity-60" />
                    <span className="relative">{t("reserve")}</span>
                    <ArrowRight className="relative size-4 rtl:rotate-180" strokeWidth={2.6} />
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
