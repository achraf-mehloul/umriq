import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { MapPin, Star, BadgeCheck, BedDouble, Users, Calendar, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  useHotelListing,
  useBookHotelRooms,
  useSetRoomInventory,
  unitRoomsLeft,
  cityZoneLabel,
} from "@/lib/api/hotels";
import { useMyAgency } from "@/lib/api";
import { toast } from "sonner";
import { haptic, playSuccess } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/hotel/$id")({
  head: () => ({
    meta: [
      { title: "Umriq — Hotel details" },
      { name: "description", content: "Hotel room listing details and B2B booking." },
      { property: "og:title", content: "Umriq — Hotel details" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HotelDetail,
});

function HotelDetail() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const nav = useNavigate();
  const { data: h, isLoading } = useHotelListing(id);
  const { data: myAgency } = useMyAgency();
  const book = useBookHotelRooms();
  const setInventory = useSetRoomInventory();

  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [editQty, setEditQty] = useState<number | null>(null);

  const d = h?.listing_hotel_details;
  const isOwner = !!h && !!myAgency && h.agency_id === myAgency.id;
  const unit = (h?.inventory_units ?? []).find((u) => u.active && unitRoomsLeft(u) > 0);
  const maxOcc = d?.max_occupancy ?? 4;

  const submitBooking = async () => {
    if (!unit) return;
    haptic("medium");
    try {
      await book.mutateAsync({ unitId: unit.id, rooms, guestsPerRoom: guests, notes: notes || undefined });
      playSuccess();
      toast.success(lang === "ar" ? "تم إرسال طلب الحجز" : "Booking request sent");
      nav({ to: "/hotel-bookings" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveInventory = async () => {
    if (!unit || editQty == null) return;
    try {
      await setInventory.mutateAsync({ listingId: h!.id, unitId: unit.id, quantityTotal: editQty });
      toast.success(lang === "ar" ? "تم تحديث المخزون" : "Inventory updated");
      setEditQty(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell title={lang === "ar" ? "تفاصيل الفندق" : "Hotel details"}>
      <Link to="/hotels" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground mb-4 press">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {lang === "ar" ? "عودة للفنادق" : "Back to hotels"}
      </Link>

      {isLoading && <div className="rounded-3xl h-72 animate-pulse glass" />}

      {!isLoading && !h && (
        <p className="text-center py-20 text-[14px] text-muted-foreground">
          {lang === "ar" ? "الإعلان غير موجود" : "Listing not found"}
        </p>
      )}

      {!isLoading && h && d && (
        <div className="space-y-4">
          {h.images?.[0] && (
            <img src={h.images[0]} alt={d.hotel_name} className="w-full h-56 object-cover rounded-3xl" />
          )}

          <div className="card-elevated p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-[1.6rem] font-medium tracking-tight text-foreground">
                  {lang === "ar" ? d.hotel_name_ar || d.hotel_name : d.hotel_name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{cityZoneLabel(d.city_zone, lang as "ar" | "en")}</span>
                  {d.distance_to_haram_m != null && <span>· {d.distance_to_haram_m} m</span>}
                </div>
                {d.address && <p className="text-[12px] text-muted-foreground mt-1">{d.address}</p>}
              </div>
              {!!d.hotel_stars && (
                <span className="shrink-0 flex items-center gap-1 text-[13px] font-medium text-[var(--gold)]">
                  {d.hotel_stars} <Star className="size-4 fill-[var(--gold)]" />
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
                {lang === "ar" ? "حتى" : "up to"} {maxOcc} {lang === "ar" ? "أشخاص" : "guests"}
              </span>
            </div>

            {(d.check_in || d.check_out) && (
              <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
                <Calendar className="size-4" />
                <span dir="ltr">{d.check_in} → {d.check_out}</span>
              </div>
            )}

            {(lang === "ar" ? d.landmark_note_ar : d.landmark_note_en) && (
              <p className="mt-3 text-[13px] text-foreground/70">
                {lang === "ar" ? d.landmark_note_ar : d.landmark_note_en}
              </p>
            )}

            {(lang === "ar" ? h.description_ar : h.description_en) && (
              <p className="mt-3 text-[13px] text-foreground/70 leading-relaxed">
                {lang === "ar" ? h.description_ar : h.description_en}
              </p>
            )}

            <div className="my-4 h-px bg-[oklch(0.22_0.014_200/0.08)]" />

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground truncate">
                  <span className="truncate">
                    {h.agencies ? (lang === "ar" ? h.agencies.name_ar : h.agencies.name_en) : "—"}
                  </span>
                  {h.agencies?.verified && <BadgeCheck className="size-[14px] text-[var(--emerald)] shrink-0" />}
                </div>
                <p className="font-display text-[1.75rem] font-medium leading-none text-foreground tracking-[-0.02em] mt-1">
                  {Number(h.price).toLocaleString()}
                  <span className="text-[12px] text-muted-foreground font-normal ms-1.5">
                    {h.currency}/{lang === "ar" ? "ليلة" : "night"}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {unit ? unitRoomsLeft(unit) : 0} {lang === "ar" ? "غرفة متاحة" : "rooms available"}
                </p>
              </div>
            </div>

            {(d.cancellation_policy_ar || d.cancellation_policy_en) && (
              <div className="mt-4 flex items-start gap-2 text-[12px] text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-[var(--emerald)]" />
                <span>{lang === "ar" ? d.cancellation_policy_ar || d.cancellation_policy_en : d.cancellation_policy_en || d.cancellation_policy_ar}</span>
              </div>
            )}
          </div>

          {isOwner && unit && (
            <div className="card-elevated p-5">
              <h2 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
                <BedDouble className="size-4 text-[var(--emerald)]" />
                {lang === "ar" ? "إدارة مخزون الغرف" : "Manage room inventory"}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={unit.quantity_sold}
                  value={editQty ?? unit.quantity_total}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="w-28 h-11 rounded-xl glass px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <span className="text-[12px] text-muted-foreground">
                  {lang === "ar" ? `مباع: ${unit.quantity_sold}` : `sold: ${unit.quantity_sold}`}
                </span>
                <button
                  onClick={saveInventory}
                  disabled={setInventory.isPending || editQty == null || editQty < unit.quantity_sold}
                  className="ms-auto h-11 px-5 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[13px] font-medium press disabled:opacity-50"
                >
                  {lang === "ar" ? "حفظ" : "Save"}
                </button>
              </div>
            </div>
          )}

          {!isOwner && unit && (
            <div className="card-elevated p-5">
              <h2 className="text-[14px] font-semibold mb-4">{lang === "ar" ? "حجز غرف" : "Book rooms"}</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">{lang === "ar" ? "الغرف" : "Rooms"}</span>
                  <input
                    type="number"
                    min={1}
                    max={unitRoomsLeft(unit)}
                    value={rooms}
                    onChange={(e) => setRooms(Math.max(1, Math.min(unitRoomsLeft(unit), Number(e.target.value))))}
                    className="mt-1 w-full h-12 rounded-xl glass px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Users className="size-3.5" /> {lang === "ar" ? "نزلاء/غرفة" : "Guests/room"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={maxOcc}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Math.min(maxOcc, Number(e.target.value))))}
                    className="mt-1 w-full h-12 rounded-xl glass px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </label>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
                className="mt-3 w-full rounded-xl glass px-3 py-2.5 text-[14px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[13px] text-muted-foreground">
                  {lang === "ar" ? "الإجمالي:" : "Total:"}{" "}
                  <span className="font-semibold text-foreground">
                    {(rooms * (d.nights ?? 1) * Number(h.price)).toLocaleString()} {h.currency}
                  </span>
                </p>
                <button
                  onClick={submitBooking}
                  disabled={book.isPending}
                  className="h-12 px-7 rounded-full bg-[var(--emerald)] text-[var(--ivory)] text-[14px] font-medium press disabled:opacity-50"
                >
                  {book.isPending ? "…" : lang === "ar" ? "تأكيد الطلب" : "Request booking"}
                </button>
              </div>
            </div>
          )}

          {!isOwner && !unit && (
            <div className="card-elevated p-5 text-center text-[13px] text-muted-foreground">
              {lang === "ar" ? "لا يوجد توفر حالياً" : "No availability right now"}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
