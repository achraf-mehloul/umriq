import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Inbox, Users, Clock, Check, X, Star } from "lucide-react";
import { useState } from "react";
import { useMyBookings, useUpdateBookingStatus, useSubmitReview, useMyAgency, type Booking } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Umriq — Requests" }] }),
  component: Requests,
});

function Requests() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const { data: agency } = useMyAgency();
  const { data: bookings = [], isLoading } = useMyBookings("all");
  const update = useUpdateBookingStatus();

  const incoming = bookings.filter((b) => b.seller_agency_id === agency?.id);
  const outgoing = bookings.filter((b) => b.buyer_agency_id === agency?.id);
  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <AppShell title={t("requestsTitle")}>
      <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-[var(--input)] border border-border">
        {(["incoming", "outgoing"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition ${tab === k ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] shadow-gold" : "text-muted-foreground"}`}
          >
            {k === "incoming" ? (lang === "ar" ? `الواردة (${incoming.length})` : `Incoming (${incoming.length})`) : (lang === "ar" ? `الصادرة (${outgoing.length})` : `Outgoing (${outgoing.length})`)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <div className="h-24 card-luxe animate-pulse" />}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16">
            <Inbox className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات" : "No requests"}</p>
          </div>
        )}
        {list.map((b, i) => (
          <BookingCard key={b.id} b={b} role={tab} onUpdate={(status) => update.mutate({ id: b.id, status })} delay={i * 0.05} />
        ))}
      </div>
    </AppShell>
  );
}

function BookingCard({ b, role, onUpdate, delay }: { b: Booking; role: "incoming" | "outgoing"; onUpdate: (s: Booking["status"]) => void; delay: number }) {
  const { lang } = useI18n();
  const [showReview, setShowReview] = useState(false);
  const offer = b.offers;
  const otherId = role === "incoming" ? b.buyer_agency_id : b.seller_agency_id;
  const stColor: Record<string, string> = {
    pending: "bg-primary/15 text-primary",
    confirmed: "bg-emerald-400/15 text-emerald-400",
    paid: "bg-emerald-400/15 text-emerald-400",
    completed: "bg-blue-400/15 text-blue-400",
    cancelled: "bg-[var(--crimson)]/15 text-[var(--crimson)]",
  };
  const stLabel: Record<string, { ar: string; en: string }> = {
    pending: { ar: "معلق", en: "Pending" },
    confirmed: { ar: "مؤكد", en: "Confirmed" },
    paid: { ar: "مدفوع", en: "Paid" },
    completed: { ar: "مكتمل", en: "Completed" },
    cancelled: { ar: "ملغى", en: "Cancelled" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card-luxe p-4">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center">
          <Inbox className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{offer ? offer.airline : "—"}</p>
          {offer && <p className="text-xs text-muted-foreground">{lang === "ar" ? offer.city_from_ar : offer.city_from_en} → {lang === "ar" ? offer.city_to_ar : offer.city_to_en}</p>}
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${stColor[b.status]}`}>
          {lang === "ar" ? stLabel[b.status].ar : stLabel[b.status].en}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="size-3.5" /> {b.seats}</span>
        {offer && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {new Date(offer.departure_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "en-GB")}</span>}
        <span className="ms-auto font-bold text-gold">{Number(b.total_price).toLocaleString()} DZD</span>
      </div>
      {b.notes && <p className="mt-2 text-xs text-muted-foreground italic">"{b.notes}"</p>}

      {role === "incoming" && b.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onUpdate("rejected")} className="flex-1 h-10 rounded-xl glass text-[var(--crimson)] font-semibold text-sm flex items-center justify-center gap-1">
            <X className="size-4" /> {lang === "ar" ? "رفض" : "Reject"}
          </button>
          <button onClick={() => onUpdate("confirmed")} className="flex-1 h-10 rounded-xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold text-sm flex items-center justify-center gap-1 shadow-gold">
            <Check className="size-4" /> {lang === "ar" ? "قبول" : "Accept"}
          </button>
        </div>
      )}
      {b.status === "confirmed" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onUpdate("completed")} className="flex-1 h-10 rounded-xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold text-sm shadow-gold">
            {lang === "ar" ? "تأكيد الإتمام" : "Mark completed"}
          </button>
        </div>
      )}
      {b.status === "completed" && !showReview && (
        <button onClick={() => setShowReview(true)} className="mt-3 w-full h-10 rounded-xl glass text-sm font-semibold flex items-center justify-center gap-1">
          <Star className="size-4 text-primary" /> {lang === "ar" ? "تقييم" : "Leave review"}
        </button>
      )}
      {showReview && <ReviewForm bookingId={b.id} reviewedAgencyId={otherId} onDone={() => setShowReview(false)} />}
    </motion.div>
  );
}

function ReviewForm({ bookingId, reviewedAgencyId, onDone }: { bookingId: string; reviewedAgencyId: string; onDone: () => void }) {
  const { lang } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const submit = useSubmitReview();
  return (
    <div className="mt-3 p-3 rounded-xl bg-[var(--input)] border border-border space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star className={`size-5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={lang === "ar" ? "تعليق (اختياري)" : "Comment (optional)"} className="w-full min-h-[60px] rounded-lg bg-card border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 h-9 rounded-lg glass text-xs">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
        <button
          onClick={async () => { await submit.mutateAsync({ booking_id: bookingId, reviewed_agency_id: reviewedAgencyId, rating, comment }); onDone(); }}
          disabled={submit.isPending}
          className="flex-1 h-9 rounded-lg bg-gold-gradient text-[oklch(0.15_0.02_260)] text-xs font-bold"
        >
          {lang === "ar" ? "إرسال" : "Submit"}
        </button>
      </div>
    </div>
  );
}
