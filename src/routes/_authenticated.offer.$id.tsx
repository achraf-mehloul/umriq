import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useOffer, useCreateBooking, useOrCreateConversation, useMyAgency, useAgencyReviews } from "@/lib/api";
import { motion } from "framer-motion";
import { Plane, Calendar, Users, Star, ArrowLeft, MessageCircle, Flame, Hotel } from "lucide-react";
import { useState } from "react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { QuickBookButton } from "@/components/QuickBookButton";
import { haptic, playSuccess } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/offer/$id")({
  head: () => ({ meta: [{ title: "Umriq — Offer" }] }),
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
    return <AppShell><div className="h-96 animate-pulse card-luxe" /></AppShell>;
  }

  const agency = offer.agencies;
  const aName = agency ? (lang === "ar" ? agency.name_ar : agency.name_en) : "—";
  const isOwn = myAgency?.id === offer.agency_id;
  const max = Math.max(1, offer.remaining_seats);

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
      <button onClick={() => nav({ to: "/market" })} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("back")}
      </button>

      {offer.images.length > 0 && (
        <div className="rounded-3xl overflow-hidden mb-4 aspect-[16/10] bg-card">
          <img src={offer.images[0]} alt="" className="size-full object-cover" />
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-luxe p-5 mb-4">
        <Link to="/agency/$id" params={{ id: offer.agency_id }} className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center font-bold text-primary overflow-hidden">
            {agency?.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : aName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold">{aName}</h2>
              {agency?.verified && <VerifiedBadge size={16} />}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-primary text-primary" />
              {Number(agency?.rating ?? 0).toFixed(1)} · {agency?.total_deals ?? 0} {lang === "ar" ? "صفقة" : "deals"}
            </div>
          </div>
          {offer.urgent && (
            <div className="flex items-center gap-1.5 bg-[var(--crimson)]/20 ring-1 ring-[var(--crimson)]/50 px-2.5 py-1 rounded-full">
              <Flame className="size-3 text-[var(--crimson)]" />
              <span className="text-[10px] font-bold uppercase text-[oklch(0.85_0.15_25)]">{t("urgent")}</span>
            </div>
          )}
        </Link>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.1_0.02_260/0.6)] border border-border/50 mb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "من" : "From"}</p>
            <p className="text-sm font-bold mt-0.5">{lang === "ar" ? offer.city_from_ar : offer.city_from_en}</p>
          </div>
          <div className="flex-1 mx-3 relative">
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <Plane className="size-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rtl:rotate-180" />
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{lang === "ar" ? "إلى" : "To"}</p>
            <p className="text-sm font-bold mt-0.5">{lang === "ar" ? offer.city_to_ar : offer.city_to_en}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={Plane} label={t("airline")} value={offer.airline} />
          <Info icon={Calendar} label={t("departureDate")} value={new Date(offer.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB")} />
          <Info icon={Users} label={t("seatsCount")} value={`${offer.remaining_seats}/${offer.total_seats}`} />
          {offer.hotel_name && <Info icon={Hotel} label={lang === "ar" ? "الفندق" : "Hotel"} value={offer.hotel_name} />}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-end justify-between">
          <div>
            {offer.original_price > offer.price && (
              <p className="text-xs text-muted-foreground line-through">{Number(offer.original_price).toLocaleString()} {offer.currency}</p>
            )}
            <p className="text-3xl font-extrabold text-gold">{Number(offer.price).toLocaleString()} <span className="text-sm text-muted-foreground font-medium">{offer.currency}</span></p>
            <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "للمقعد" : "per seat"}</p>
          </div>
        </div>
      </motion.div>

      {(offer.notes_ar || offer.notes_en) && (
        <div className="card-luxe p-4 mb-4">
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">{t("notes")}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">{lang === "ar" ? offer.notes_ar : offer.notes_en}</p>
        </div>
      )}

      {!isOwn && (
        <div className="card-luxe p-5 mb-4">
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3">{t("reserve")}</p>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--input)] border border-border mb-3">
            <button onClick={() => setSeats(Math.max(1, seats - 1))} className="size-9 rounded-lg glass grid place-items-center text-lg">−</button>
            <div className="text-center">
              <p className="text-2xl font-extrabold">{seats}</p>
              <p className="text-[10px] text-muted-foreground">{t("seatsCount")}</p>
            </div>
            <button onClick={() => setSeats(Math.min(max, seats + 1))} className="size-9 rounded-lg glass grid place-items-center text-lg">+</button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
            className="w-full min-h-[80px] rounded-xl bg-[var(--input)] border border-border p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</span>
            <span className="font-extrabold text-gold text-lg">{(Number(offer.price) * seats).toLocaleString()} {offer.currency}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleChat} disabled={chat.isPending} className="h-12 px-4 rounded-2xl glass font-semibold flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" /> {t("message")}
            </button>
            <button onClick={handleReserve} disabled={reserve.isPending} className="flex-1 h-12 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold disabled:opacity-50">
              {reserve.isPending ? "..." : t("reserve")}
            </button>
          </div>
          {agency?.verified && (
            <div className="mt-3">
              <QuickBookButton offer={offer} seats={seats} />
            </div>
          )}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3">
            {lang === "ar" ? "التقييمات" : "Reviews"} ({reviews.length})
          </h3>
          <div className="space-y-2">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="card-luxe p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--input)] border border-border">
      <Icon className="size-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
