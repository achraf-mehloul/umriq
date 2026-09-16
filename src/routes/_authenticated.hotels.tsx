import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Search, BedDouble, BadgeCheck, Star, ArrowRight, MapPin, Plus, CalendarCheck } from "lucide-react";
import { useHotelListings, hotelRoomsAvailable, cityZoneLabel, type HotelFilters } from "@/lib/api/hotels";

export const Route = createFileRoute("/_authenticated/hotels")({
  head: () => ({
    meta: [
      { title: "Umriq — Hotels marketplace" },
      { name: "description", content: "Browse B2B Makkah and Madinah hotel room inventory published by verified Umrah suppliers." },
      { property: "og:title", content: "Umriq — Hotels marketplace" },
      { property: "og:description", content: "Makkah and Madinah room inventory for Algerian Umrah agencies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hotels,
});

function Hotels() {
  const { lang } = useI18n();
  const [filters, setFilters] = useState<HotelFilters>({ sort: "newest" });
  const { data: list = [], isLoading } = useHotelListings(filters);

  const chips = [
    { k: "all", l: lang === "ar" ? "الكل" : "All", on: () => setFilters({ sort: "newest" }), active: !filters.cityZone && !filters.verified && !filters.minStars },
    { k: "makkah", l: lang === "ar" ? "مكة" : "Makkah", on: () => setFilters((f) => ({ ...f, cityZone: f.cityZone === "makkah" ? undefined : "makkah" })), active: filters.cityZone === "makkah" },
    { k: "madinah", l: lang === "ar" ? "المدينة" : "Madinah", on: () => setFilters((f) => ({ ...f, cityZone: f.cityZone === "madinah" ? undefined : "madinah" })), active: filters.cityZone === "madinah" },
    { k: "5", l: "5★", on: () => setFilters((f) => ({ ...f, minStars: f.minStars === 5 ? undefined : 5 })), active: filters.minStars === 5 },
    { k: "price", l: lang === "ar" ? "أفضل سعر" : "Best price", on: () => setFilters((f) => ({ ...f, sort: "price_asc" })), active: filters.sort === "price_asc" },
    { k: "ver", l: lang === "ar" ? "موثقة" : "Verified", on: () => setFilters((f) => ({ ...f, verified: !f.verified })), active: !!filters.verified },
  ];

  return (
    <AppShell title={lang === "ar" ? "الفنادق" : "Hotels"}>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/market" className="px-4 h-9 leading-9 rounded-full glass text-[13px] font-medium">
          {lang === "ar" ? "الرحلات" : "Flights"}
        </Link>
        <span className="px-4 h-9 leading-9 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[13px] font-medium">
          {lang === "ar" ? "الفنادق" : "Hotels"}
        </span>
        <Link to="/hotel-bookings" className="ms-auto flex items-center gap-1.5 px-4 h-9 rounded-full glass text-[13px] font-medium">
          <CalendarCheck className="size-4" /> {lang === "ar" ? "حجوزاتي" : "Bookings"}
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-[17px] text-muted-foreground" strokeWidth={1.8} />
        <input
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder={lang === "ar" ? "ابحث عن فندق أو مدينة..." : "Search hotel or city..."}
          className="w-full h-[52px] rounded-2xl glass ps-12 pe-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
        />
      </div>

      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        {chips.map((c) => (
          <button
            key={c.k}
            onClick={c.on}
            className={`shrink-0 px-4 h-9 rounded-full text-[13px] font-medium transition-all press ${
              c.active ? "bg-[var(--emerald)] text-[var(--ivory)]" : "glass text-foreground/70"
            }`}
          >
            {c.l}
          </button>
        ))}
      </div>

      <div className="space-y-3 mt-5">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-3xl h-48 animate-pulse glass" />)}

        {!isLoading && list.length === 0 && (
          <div className="text-center py-20">
            <div className="size-14 mx-auto mb-5 rounded-2xl glass grid place-items-center">
              <BedDouble className="size-6 text-[var(--emerald)]" strokeWidth={1.7} />
            </div>
            <p className="text-[14px] text-muted-foreground">
              {lang === "ar" ? "لا توجد غرف منشورة حالياً" : "No hotel rooms published yet"}
            </p>
            <Link to="/publish-hotel" className="inline-flex items-center gap-2 mt-5 px-7 h-12 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[14px] font-medium press">
              <Plus className="size-4" /> {lang === "ar" ? "نشر غرف" : "Publish rooms"}
            </Link>
          </div>
        )}

        {!isLoading &&
          list.map((h, i) => {
            const d = h.listing_hotel_details!;
            const agency = h.agencies;
            const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
            const left = hotelRoomsAvailable(h);
            return (
              <article key={h.id} style={{ "--i": i } as React.CSSProperties} className="card-elevated overflow-hidden press">
                <Link to="/hotel/$id" params={{ id: h.id }} className="block">
                  {h.images?.[0] && (
                    <img src={h.images[0]} alt={d.hotel_name} loading="lazy" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.25rem] font-medium tracking-tight truncate text-foreground">
                          {lang === "ar" ? d.hotel_name_ar || d.hotel_name : d.hotel_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
                          <MapPin className="size-3.5" />
                          <span>{cityZoneLabel(d.city_zone, lang as "ar" | "en")}</span>
                          {d.distance_to_haram_m != null && (
                            <>
                              <span className="opacity-50">·</span>
                              <span>{d.distance_to_haram_m} m {lang === "ar" ? "من الحرم" : "to Haram"}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!!d.hotel_stars && (
                        <span className="shrink-0 flex items-center gap-1 text-[12px] font-medium text-[var(--gold)]">
                          {d.hotel_stars} <Star className="size-3.5 fill-[var(--gold)]" />
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                      {d.room_type && <span className="px-2.5 py-1 rounded-full glass">{d.room_type}</span>}
                      {d.board_type && <span className="px-2.5 py-1 rounded-full glass">{d.board_type}</span>}
                      <span className="px-2.5 py-1 rounded-full glass">
                        {d.nights ?? 1} {lang === "ar" ? "ليالٍ" : "nights"}
                      </span>
                      <span className="px-2.5 py-1 rounded-full glass">
                        {lang === "ar" ? "حتى" : "up to"} {d.max_occupancy} {lang === "ar" ? "أشخاص" : "guests"}
                      </span>
                    </div>

                    <div className="my-4 h-px bg-[oklch(0.22_0.014_200/0.08)]" />

                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground truncate">
                          <span className="truncate">{aName}</span>
                          {agency?.verified && <BadgeCheck className="size-[14px] text-[var(--emerald)] shrink-0" />}
                        </div>
                        <p className="font-display text-[1.75rem] font-medium leading-none text-foreground tracking-[-0.02em] mt-1">
                          {Number(h.price).toLocaleString()}
                          <span className="text-[12px] text-muted-foreground font-normal ms-1.5">
                            {h.currency}/{lang === "ar" ? "ليلة" : "night"}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {left} {lang === "ar" ? "غرفة متاحة" : "rooms available"}
                        </p>
                      </div>
                      <div className="h-11 px-5 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[13px] font-medium flex items-center gap-2">
                        <span>{lang === "ar" ? "حجز" : "Book"}</span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
      </div>
    </AppShell>
  );
}
