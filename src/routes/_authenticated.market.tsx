import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plane, Clock, BadgeCheck, Star, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useOffers, type OfferFilters } from "@/lib/api";
import { useHydrateQuery, usePersistQuery } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({ meta: [{ title: "Umriq — Marketplace" }] }),
  component: Market,
});

function Market() {
  const { t, lang } = useI18n();
  const [filters, setFilters] = useState<OfferFilters>({ sort: "newest" });
  const { data: list = [], isLoading } = useOffers(filters);
  useHydrateQuery(`offers:${JSON.stringify(filters)}`, ["offers", filters]);
  usePersistQuery(`offers:${JSON.stringify(filters)}`, ["offers", filters]);

  const chips = [
    { k: "all", l: lang === "ar" ? "الكل" : "All", on: () => setFilters({ sort: "newest" }), active: !filters.urgent && !filters.verified && filters.sort === "newest" },
    { k: "urgent", l: t("urgent"), on: () => setFilters((f) => ({ ...f, urgent: !f.urgent })), active: !!filters.urgent },
    { k: "best", l: lang === "ar" ? "أفضل سعر" : "Best price", on: () => setFilters((f) => ({ ...f, sort: "price_asc" })), active: filters.sort === "price_asc" },
    { k: "soon", l: lang === "ar" ? "قريباً" : "Soon", on: () => setFilters((f) => ({ ...f, sort: "date_asc" })), active: filters.sort === "date_asc" },
    { k: "ver", l: t("verified"), on: () => setFilters((f) => ({ ...f, verified: !f.verified })), active: !!filters.verified },
  ];

  return (
    <AppShell title={t("marketTitle")}>
      {/* Sticky glass search */}
      <div
        className="sticky top-14 z-30 -mx-5 px-5 pb-4 pt-3"
        style={{
          background: "linear-gradient(180deg, oklch(0.985 0.004 75 / 0.92), oklch(0.985 0.004 75 / 0.6))",
          backdropFilter: "blur(28px) saturate(180%)",
        }}
      >
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-[17px] text-muted-foreground" strokeWidth={1.8} />
          <input
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={t("search")}
            className="w-full h-[52px] rounded-2xl glass ps-12 pe-14 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
          />
          <button className="absolute top-1/2 -translate-y-1/2 end-2 size-9 rounded-xl bg-[oklch(0.36_0.06_170/0.08)] grid place-items-center press">
            <SlidersHorizontal className="size-[16px] text-[var(--emerald)]" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {chips.map((c) => (
            <button
              key={c.k}
              onClick={c.on}
              className={`shrink-0 px-4 h-9 rounded-full text-[13px] font-medium transition-all press ${
                c.active
                  ? "bg-[var(--emerald)] text-[var(--ivory)]"
                  : "glass text-foreground/70"
              }`}
            >{c.l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-5">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl h-56 animate-pulse glass" />
        ))}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-20">
            <div className="size-14 mx-auto mb-5 rounded-2xl glass grid place-items-center">
              <Plane className="size-6 text-[var(--emerald)]" strokeWidth={1.7} />
            </div>
            <p className="text-[14px] text-muted-foreground">{lang === "ar" ? "لا توجد عروض حالياً" : "No offers available"}</p>
            <Link to="/publish" className="inline-block mt-5 px-7 h-12 leading-[48px] rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[14px] font-medium press">
              {t("publishNow")}
            </Link>
          </div>
        )}

        {!isLoading && list.length > 0 && (
          <div className="stagger space-y-3">
        {list.map((o, i) => {
          const agency = o.agencies;
          const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
          const discount = o.original_price > o.price
            ? Math.round((1 - Number(o.price) / Number(o.original_price)) * 100)
            : 0;
          return (
            <article
              key={o.id}
              style={{ "--i": i } as React.CSSProperties}
              className="card-elevated overflow-hidden press"
            >
              <Link to="/offer/$id" params={{ id: o.id }} className="block p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-2xl bg-[oklch(0.94_0.014_75)] grid place-items-center shrink-0 font-medium text-foreground/70 overflow-hidden text-[15px]">
                      {agency?.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : aName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-[15px] truncate text-foreground">{aName}</h3>
                        {agency?.verified && <BadgeCheck className="size-[15px] text-[var(--emerald)] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-muted-foreground">
                        <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                        <span>{Number(agency?.rating ?? 0).toFixed(1)}</span>
                        <span className="opacity-50">·</span>
                        <span>{o.airline}</span>
                      </div>
                    </div>
                  </div>
                  {o.urgent && (
                    <span className="text-[10px] font-medium uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[oklch(0.55_0.18_27/0.08)] text-[oklch(0.55_0.18_27)]">
                      {t("urgent")}
                    </span>
                  )}
                </div>

                {/* Route — calm, editorial */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{lang === "ar" ? "من" : "From"}</p>
                    <p className="font-display text-[1.5rem] font-medium tracking-tight mt-1 truncate text-foreground leading-none">
                      {lang === "ar" ? o.city_from_ar : o.city_from_en}
                    </p>
                  </div>
                  <div className="relative flex items-center justify-center w-16">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-[oklch(0.22_0.014_200/0.15)]" />
                    <div className="relative size-8 rounded-full bg-[oklch(0.97_0.012_170)] grid place-items-center">
                      <Plane className="size-[14px] text-[var(--emerald)] rtl:rotate-180" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-end">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{lang === "ar" ? "إلى" : "To"}</p>
                    <p className="font-display text-[1.5rem] font-medium tracking-tight mt-1 truncate text-foreground leading-none">
                      {lang === "ar" ? o.city_to_ar : o.city_to_en}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-5 flex items-center justify-between text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>
                      {new Date(o.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                    <span>{o.remaining_seats}/{o.total_seats} {t("remaining")}</span>
                  </div>
                  {o.urgent && o.expires_at && (
                    <div className="flex items-center gap-1 text-[oklch(0.55_0.18_27)] font-medium">
                      <Clock className="size-3" /> {Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 3600000))}h
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-[oklch(0.22_0.014_200/0.08)]" />

                {/* Price + CTA */}
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {discount > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium text-[var(--emerald)]">−{discount}%</span>
                        <span className="text-[12px] text-muted-foreground line-through">
                          {Number(o.original_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <p className="font-display text-[1.875rem] font-medium leading-none text-foreground tracking-[-0.02em]">
                      {Number(o.price).toLocaleString()}
                      <span className="text-[12px] text-muted-foreground font-normal ms-1.5">{o.currency}</span>
                    </p>
                  </div>
                  <div className="h-11 px-5 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[13px] font-medium flex items-center gap-2">
                    <span>{t("reserve")}</span>
                    <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2} />
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
          </div>
        )}
      </div>

    </AppShell>
  );
}
