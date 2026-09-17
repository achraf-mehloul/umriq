import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { ArrowLeft, BedDouble, ImagePlus, X } from "lucide-react";
import { useCreateHotelListing, type CityZone } from "@/lib/api/hotels";
import { useMyAgency, uploadImage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { haptic, playSuccess } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/publish-hotel")({
  head: () => ({
    meta: [
      { title: "Umriq — Publish hotel rooms" },
      { name: "description", content: "Publish Makkah or Madinah hotel room inventory to the Umriq B2B marketplace." },
      { property: "og:title", content: "Umriq — Publish hotel rooms" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublishHotel,
});

const inputCls =
  "w-full h-12 rounded-xl glass px-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition";
const labelCls = "block text-[12px] text-muted-foreground mb-1.5";

function PublishHotel() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: agency } = useMyAgency();
  const createHotel = useCreateHotelListing();

  const [hotelName, setHotelName] = useState("");
  const [hotelNameAr, setHotelNameAr] = useState("");
  const [cityZone, setCityZone] = useState<CityZone>("makkah");
  const [stars, setStars] = useState(4);
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState<string>("");
  const [roomType, setRoomType] = useState("");
  const [boardType, setBoardType] = useState("");
  const [maxOcc, setMaxOcc] = useState(4);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(5);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("DZD");
  const [descAr, setDescAr] = useState("");
  const [cancelAr, setCancelAr] = useState("");
  const [freeDays, setFreeDays] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).slice(0, 5).map((f) => uploadImage("offer-images", f, user.id)),
      );
      setImages((p) => [...p, ...urls]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const valid = hotelName.trim() && checkIn && checkOut && checkOut > checkIn && rooms > 0 && price > 0;

  const submit = async () => {
    if (!agency) {
      toast.error(lang === "ar" ? "أنشئ ملف الوكالة أولاً" : "Create your agency first");
      nav({ to: "/profile" });
      return;
    }
    if (!valid) {
      toast.error(lang === "ar" ? "أكمل الحقول المطلوبة" : "Complete the required fields");
      return;
    }
    haptic("medium");
    try {
      await createHotel.mutateAsync({
        title_ar: hotelNameAr.trim() || hotelName.trim(),
        title_en: hotelName.trim(),
        description_ar: descAr.trim() || null,
        price,
        currency,
        images,
        hotel: {
          hotel_name: hotelName.trim(),
          hotel_name_ar: hotelNameAr.trim() || null,
          hotel_stars: stars || null,
          city_zone: cityZone,
          address: address.trim() || null,
          distance_to_haram_m: distance ? Number(distance) : null,
          room_type: roomType.trim() || null,
          board_type: boardType.trim() || null,
          max_occupancy: maxOcc,
          check_in: checkIn,
          check_out: checkOut,
          cancellation_policy_ar: cancelAr.trim() || null,
          free_cancellation_days: freeDays ? Number(freeDays) : null,
        },
        rooms,
      });
      playSuccess();
      toast.success(lang === "ar" ? "تم نشر الغرف" : "Rooms published");
      nav({ to: "/hotels" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell title={lang === "ar" ? "نشر غرف فندقية" : "Publish hotel rooms"}>
      <Link to="/hotels" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground mb-4 press">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {lang === "ar" ? "عودة للفنادق" : "Back to hotels"}
      </Link>

      <div className="card-elevated p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl glass grid place-items-center">
            <BedDouble className="size-5 text-[var(--emerald)]" strokeWidth={1.7} />
          </div>
          <div>
            <h1 className="text-[16px] font-semibold">{lang === "ar" ? "نشر غرف فندقية" : "Publish hotel rooms"}</h1>
            <p className="text-[12px] text-muted-foreground">
              {lang === "ar" ? "مخزون يدوي — بدون ربط خارجي" : "Manual inventory — no external APIs"}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "اسم الفندق (EN) *" : "Hotel name (EN) *"}</span>
            <input value={hotelName} onChange={(e) => setHotelName(e.target.value)} className={inputCls} placeholder="Hilton Suites" />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "اسم الفندق (عربي)" : "Hotel name (AR)"}</span>
            <input value={hotelNameAr} onChange={(e) => setHotelNameAr(e.target.value)} className={inputCls} placeholder="أجنحة هيلتون" />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "المدينة *" : "City *"}</span>
            <select value={cityZone} onChange={(e) => setCityZone(e.target.value as CityZone)} className={inputCls}>
              <option value="makkah">{lang === "ar" ? "مكة المكرمة" : "Makkah"}</option>
              <option value="madinah">{lang === "ar" ? "المدينة المنورة" : "Madinah"}</option>
              <option value="other">{lang === "ar" ? "أخرى" : "Other"}</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "التصنيف (نجوم)" : "Stars"}</span>
            <input type="number" min={1} max={5} value={stars} onChange={(e) => setStars(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>{lang === "ar" ? "العنوان" : "Address"}</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "المسافة من الحرم (م)" : "Distance to Haram (m)"}</span>
            <input type="number" min={0} value={distance} onChange={(e) => setDistance(e.target.value)} className={inputCls} placeholder="500" />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "نوع الغرفة" : "Room type"}</span>
            <input value={roomType} onChange={(e) => setRoomType(e.target.value)} className={inputCls} placeholder={lang === "ar" ? "رباعية" : "Quad"} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "نوع الوجبة" : "Board type"}</span>
            <input value={boardType} onChange={(e) => setBoardType(e.target.value)} className={inputCls} placeholder="BB / HB / FB" />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "أقصى إشغال/غرفة" : "Max occupancy/room"}</span>
            <input type="number" min={1} max={12} value={maxOcc} onChange={(e) => setMaxOcc(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "دخول *" : "Check-in *"}</span>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "خروج *" : "Check-out *"}</span>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "عدد الغرف *" : "Rooms *"}</span>
            <input type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "السعر/ليلة *" : "Price/night *"}</span>
            <input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "العملة" : "Currency"}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              <option value="DZD">DZD</option>
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className={labelCls}>{lang === "ar" ? "الوصف" : "Description"}</span>
          <textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} className="w-full rounded-xl glass px-4 py-3 text-[14px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "سياسة الإلغاء" : "Cancellation policy"}</span>
            <input value={cancelAr} onChange={(e) => setCancelAr(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{lang === "ar" ? "إلغاء مجاني قبل (أيام)" : "Free cancellation (days)"}</span>
            <input type="number" min={0} value={freeDays} onChange={(e) => setFreeDays(e.target.value)} className={inputCls} />
          </label>
        </div>

        <div>
          <span className={labelCls}>{lang === "ar" ? "الصور" : "Images"}</span>
          <div className="flex flex-wrap gap-2">
            {images.map((u) => (
              <div key={u} className="relative size-20 rounded-xl overflow-hidden">
                <img src={u} alt="" className="size-full object-cover" />
                <button
                  onClick={() => setImages((p) => p.filter((x) => x !== u))}
                  className="absolute top-1 end-1 size-5 rounded-full bg-black/60 text-white grid place-items-center"
                  aria-label="remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <label className="size-20 rounded-xl glass grid place-items-center cursor-pointer press">
              <ImagePlus className="size-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            </label>
          </div>
          {uploading && <p className="text-[12px] text-muted-foreground mt-2">{lang === "ar" ? "جارٍ الرفع…" : "Uploading…"}</p>}
        </div>

        <button
          onClick={submit}
          disabled={createHotel.isPending || !valid}
          className="w-full h-[52px] rounded-2xl bg-[var(--emerald)] text-[var(--ivory)] text-[15px] font-medium press disabled:opacity-50"
        >
          {createHotel.isPending ? "…" : lang === "ar" ? "نشر الغرف" : "Publish rooms"}
        </button>
      </div>
    </AppShell>
  );
}
