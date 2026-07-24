import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useOffer, useCreateBooking, useOrCreateConversation, useMyAgency, useAgencyReviews } from "@/lib/api";
import { motion } from "framer-motion";
import { Plane, Calendar, Users, Star, ArrowLeft, MessageCircle, Flame, Hotel, BadgeCheck, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { QuickBookButton } from "@/components/QuickBookButton";
import { Btn } from "@/components/ui/Btn";
import { haptic, playSuccess } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/offer/$id")({
  head: () => ({
    meta: [
      { title: "Umriq — Offer detail" },
      { name: "description", content: "Reserve a verified Umrah seat from a trusted agency on Umriq." },
    ],
  }),
  component: OfferDetail,
  errorComponent: ({ error }) => (
    <AppShell><div className="text-center py-20 text-muted-foreground">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => (
    <AppShell><div className="text-center py-20">Offer not found</div></AppShell>
  ),
});

function OfferDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const { data: offer, isLoading } = useOffer(id);
  const { data: myAgency } = useMyAgency();
  const { data: reviews = [] } = useAgencyReviews(offer?.agency_id);
  const reserve = useCreateBooking();
  const chat = useOrCreateConversation();
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState("");

  if (isLoading || !offer) {
    return (
      <AppShell>
        <div className="space-y-3 pt-4">
          <div className="rounded-[28px] aspect-[16/10] skeleton" />
          <div className="rounded-[28px] h-64 skeleton" />
        </div>
      </AppShell>
    );
  }

  const agency = offer.agencies;
  const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
  const isOwn = myAgency?.id === offer.agency_id;
  const max = Math.max(1, offer.remaining_seats);
  const discount = offer.original_price > offer.price
    ? Math.round((1 - Number(offer.price) / Number(offer.original_price)) * 100)
    : 0;

  const handleReserve = async () => {
    haptic("medium");
    await reserve.mutateAsync({ offer, seats, notes });
    playSuccess();
    haptic("success");
    nav({ to: "/requests" });
  };
  const handleChat = async () => {
    haptic("light");
    const conv = await chat.mutateAsync(offer.agency_id);
    nav({ to: "/messages", search: { c: conv.id } as never });
  };

  return (
    <AppShell>
      <button
        onClick={() => nav({ to: "/market" })}
        className="mt-2 mb-4 inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" strokeWidth={1.8} /> {t("back")}
      </button>

      <div className="stagger">
        {/* Editorial hero */}
        <motion.section
          style={{ "--i": 0 } as React.CSSProperties}
          className="hero-rail"
        >
          <p className="eyebrow">
            {new Date(offer.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="display-lg mt-3 text-foreground max-w-xl">
            {lang === "ar" ? offer.city_from_ar : offer.city_from_en}
            <span className="text-muted-foreground/50 mx-3">→</span>
            {lang === "ar" ? offer.city_to_ar : offer.city_to_en}
          </h1>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {offer.urgent && (
              <span className="chip" style={{ background: "oklch(0.55 0.18 27 / 0.10)", color: "oklch(0.55 0.18 27)", borderColor: "transparent" }}>
                <Flame className="size-3" /> {t("urgent")}
              </span>
            )}
            <span className="chip"><Plane className="size-3" strokeWidth={1.8} /> {offer.airline}</span>
            <span className="chip"><Users className="size-3" strokeWidth={1.8} /> {offer.remaining_seats}/{offer.total_seats}</span>
          </div>
        </motion.section>

        {/* Image */}
        {offer.images.length > 0 && (
          <div style={{ "--i": 1 } as React.CSSProperties} className="rounded-[28px] overflow-hidden mb-5 aspect-[16/10] card-glass p-0">
            <img src={offer.images[0]} alt="" className="size-full object-cover" loading="lazy" />
          </div>
        )}

        {/* Agency */}
        <Link
          to="/agency/$id"
          params={{ id: offer.agency_id }}
          style={{ "--i": 2 } as React.CSSProperties}
          className="card-glass p-4 flex items-center gap-3 press mb-3"
        >
          <div className="size-12 rounded-2xl bg-sand grid place-items-center font-medium text-foreground/70 overflow-hidden shrink-0">
            {agency?.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : aName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-medium truncate text-foreground">{aName}</p>
              {agency?.verified && <VerifiedBadge size={15} />}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5">
              <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
              <span>{Number(agency?.rating ?? 0).toFixed(1)}</span>
              <span className="opacity-50">·</span>
              <span>{agency?.total_deals ?? 0} {lang === "ar" ? "صفقة" : "deals"}</span>
            </div>
          </div>
        </Link>

        {/* Facts grid */}
        <section style={{ "--i": 3 } as React.CSSProperties} className="card-glass p-5 mb-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Fact icon={Calendar} label={t("departureDate")} value={new Date(offer.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB", { day: "numeric", month: "short" })} />
            <Fact icon={Plane} label={t("airline")} value={offer.airline} />
            <Fact icon={Users} label={t("seatsCount")} value={`${offer.remaining_seats}/${offer.total_seats}`} />
            {offer.hotel_name && <Fact icon={Hotel} label={lang === "ar" ? "الفندق" : "Hotel"} value={offer.hotel_name} />}
          </div>
          <div className="divider-hair my-5" />
          <div className="flex items-end justify-between">
            <div>
              {discount > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-[var(--emerald)]">−{discount}%</span>
                  <span className="text-[12px] text-muted-foreground line-through">{Number(offer.original_price).toLocaleString()}</span>
                </div>
              )}
              <p className="display-md text-foreground">
                {Number(offer.price).toLocaleString()}
                <span className="text-[13px] text-muted-foreground font-normal ms-2">{offer.currency}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{lang === "ar" ? "للمقعد" : "per seat"}</p>
            </div>
          </div>
        </section>

        {(offer.notes_ar || offer.notes_en) && (
          <section style={{ "--i": 4 } as React.CSSProperties} className="card-glass p-5 mb-3">
            <p className="eyebrow mb-3">{t("notes")}</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-line text-foreground/85">
              {lang === "ar" ? offer.notes_ar : offer.notes_en}
            </p>
          </section>
        )}

        {!isOwn && (
          <section style={{ "--i": 5 } as React.CSSProperties} className="card-elevated p-5 mb-3">
            <p className="eyebrow mb-4">{t("reserve")}</p>
            <div className="flex items-center justify-between rounded-2xl bg-sand p-3 mb-3">
              <button
                onClick={() => { haptic("light"); setSeats(Math.max(1, seats - 1)); }}
                className="btn btn-secondary btn-icon"
              ><Minus className="size-4" strokeWidth={1.8} /></button>
              <div className="text-center">
                <p className="display-md leading-none text-foreground">{seats}</p>
                <p className="eyebrow mt-1.5">{t("seatsCount")}</p>
              </div>
              <button
                onClick={() => { haptic("light"); setSeats(Math.min(max, seats + 1)); }}
                className="btn btn-secondary btn-icon"
              ><Plus className="size-4" strokeWidth={1.8} /></button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
              className="w-full min-h-[84px] rounded-2xl glass px-4 py-3 text-[14px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="eyebrow">{lang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="display-md text-foreground">
                {(Number(offer.price) * seats).toLocaleString()}
                <span className="text-[12px] text-muted-foreground font-normal ms-1.5">{offer.currency}</span>
              </span>
            </div>
            <div className="mt-5 flex gap-2">
              <Btn variant="secondary" size="lg" onClick={handleChat} disabled={chat.isPending} className="!flex-none">
                <MessageCircle className="size-[16px]" strokeWidth={1.8} />
                <span className="hidden sm:inline">{t("message")}</span>
              </Btn>
              <Btn variant="primary" size="lg" onClick={handleReserve} disabled={reserve.isPending} className="flex-1">
                {reserve.isPending ? "…" : t("reserve")}
              </Btn>
            </div>
            {agency?.verified && (
              <div className="mt-3"><QuickBookButton offer={offer} seats={seats} /></div>
            )}
          </section>
        )}

        {reviews.length > 0 && (
          <section style={{ "--i": 6 } as React.CSSProperties} className="mt-6">
            <p className="eyebrow mb-3">{lang === "ar" ? "التقييمات" : "Reviews"} · {reviews.length}</p>
            <div className="space-y-2">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="card-glass p-4">
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3 ${i < r.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/25"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-[13px] leading-relaxed text-foreground/80">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {agency?.verified && (
        <div className="mt-6 flex items-center gap-2 text-[12px] text-muted-foreground">
          <BadgeCheck className="size-4 text-[var(--emerald)]" strokeWidth={1.8} />
          {lang === "ar" ? "وكالة موثقة رسمياً" : "Officially verified agency"}
        </div>
      )}
    </AppShell>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="size-3.5 text-[var(--emerald)]" strokeWidth={1.8} />
        <p className="eyebrow">{label}</p>
      </div>
      <p className="text-[14px] font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
