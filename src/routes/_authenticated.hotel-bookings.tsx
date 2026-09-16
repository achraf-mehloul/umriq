import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import { BedDouble, Check, X, CalendarDays, Users } from "lucide-react";
import { useMyAgency } from "@/lib/api";
import { useMyHotelBookings, useConfirmHotelBooking, useCancelHotelBooking, cityZoneLabel } from "@/lib/api/hotels";

export const Route = createFileRoute("/_authenticated/hotel-bookings")({
  head: () => ({
    meta: [
      { title: "Umriq — Hotel bookings" },
      { name: "description", content: "Track, confirm and cancel B2B hotel room bookings between Umrah agencies." },
      { property: "og:title", content: "Umriq — Hotel bookings" },
      { property: "og:description", content: "Your hotel room bookings as buyer and as supplier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HotelBookings,
});

const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  paid: { ar: "مدفوع", en: "Paid" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

function HotelBookings() {
  const { lang } = useI18n();
  const { data: agency } = useMyAgency();
  const { data: rows = [], isLoading } = useMyHotelBookings();
  const confirm = useConfirmHotelBooking();
  const cancel = useCancelHotelBooking();

  return (
    <AppShell title={lang === "ar" ? "حجوزات الفنادق" : "Hotel bookings"}>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/hotels" className="px-4 h-9 leading-9 rounded-full glass text-[13px] font-medium">
          {lang === "ar" ? "تصفح الفنادق" : "Browse hotels"}
        </Link>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-36 rounded-3xl glass animate-pulse" />)}</div>}

      {!isLoading && rows.length === 0 && (
        <div className="text-center py-20">
          <div className="size-14 mx-auto mb-5 rounded-2xl glass grid place-items-center">
            <BedDouble className="size-6 text-[var(--emerald)]" strokeWidth={1.7} />
          </div>
          <p className="text-[14px] text-muted-foreground">{lang === "ar" ? "لا توجد حجوزات فندقية" : "No hotel bookings yet"}</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((b) => {
          const isSeller = agency?.id === b.seller_agency_id;
          const canConfirm = isSeller && b.status === "pending";
          const canCancel = b.status === "pending" || b.status === "confirmed";
          return (
            <article key={b.id} className="card-elevated p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-[1.15rem] font-medium truncate">
                    {lang === "ar" ? b.hotel_name_ar || b.hotel_name : b.hotel_name}
                  </h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {cityZoneLabel(b.city_zone, lang as "ar" | "en")}
                    {b.room_type ? ` · ${b.room_type}` : ""}
                    {b.board_type ? ` · ${b.board_type}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full glass">
                  {(STATUS_LABEL[b.status] ?? STATUS_LABEL.pending)[lang as "ar" | "en"]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {b.check_in} → {b.check_out} ({b.nights} {lang === "ar" ? "ليالٍ" : "nights"})
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {b.rooms} {lang === "ar" ? "غرفة" : "rooms"} × {b.guests_per_room} {lang === "ar" ? "ضيوف" : "guests"}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[1.5rem] font-medium leading-none">
                    {Number(b.total_price).toLocaleString()}
                    <span className="text-[12px] text-muted-foreground font-normal ms-1.5">{b.currency}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {Number(b.price_per_room).toLocaleString()} {b.currency}/{lang === "ar" ? "غرفة/ليلة" : "room/night"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canConfirm && (
                    <button
                      onClick={async () => {
                        try {
                          await confirm.mutateAsync(b.id);
                          toast.success(lang === "ar" ? "تم تأكيد الحجز" : "Booking confirmed");
                        } catch (e) {
                          toast.error(friendlyError(e, lang as "ar" | "en"));
                        }
                      }}
                      className="h-10 px-4 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[13px] font-medium flex items-center gap-1.5 press"
                    >
                      <Check className="size-4" /> {lang === "ar" ? "تأكيد" : "Confirm"}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={async () => {
                        const reason = window.prompt(lang === "ar" ? "سبب الإلغاء (اختياري)" : "Cancellation reason (optional)") ?? undefined;
                        try {
                          await cancel.mutateAsync({ bookingId: b.id, reason });
                          toast.success(lang === "ar" ? "تم الإلغاء وإرجاع الغرف" : "Cancelled, rooms released");
                        } catch (e) {
                          toast.error(friendlyError(e, lang as "ar" | "en"));
                        }
                      }}
                      className="h-10 px-4 rounded-full glass text-[13px] font-medium flex items-center gap-1.5 press"
                    >
                      <X className="size-4" /> {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {b.cancellation_policy && (
                <p className="mt-3 text-[11px] text-muted-foreground">{b.cancellation_policy}</p>
              )}
              {b.cancelled_reason && (
                <p className="mt-2 text-[11px] text-[oklch(0.55_0.18_27)]">{b.cancelled_reason}</p>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
