import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Plane, Users, Calendar, DollarSign, Flame, FileText, Check, MapPin, ImagePlus, X } from "lucide-react";
import { useCreateOffer, useMyAgency, uploadImage } from "@/lib/api";
import { useAutosave } from "@/lib/autosave";
import { haptic, playSuccess } from "@/lib/haptics";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/publish")({
  head: () => ({ meta: [{ title: "Umriq — Publish offer" }] }),
  component: Publish,
});

interface Form {
  airline: string;
  city_from_ar: string;
  city_from_en: string;
  city_to_ar: string;
  city_to_en: string;
  departure_date: string;
  return_date: string;
  total_seats: number;
  original_price: number;
  price: number;
  notes_ar: string;
  urgent: boolean;
  hotel_name: string;
  images: string[];
}

function Publish() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: agency } = useMyAgency();
  const createOffer = useCreateOffer();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [f, setF, clearDraft] = useAutosave<Form>("publish", {
    airline: "", city_from_ar: "", city_from_en: "",
    city_to_ar: "مكة المكرمة", city_to_en: "Makkah",
    departure_date: "", return_date: "", total_seats: 10,
    original_price: 0, price: 0, notes_ar: "", urgent: false,
    hotel_name: "", images: [],
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).slice(0, 5).map((file) => uploadImage("offer-images", file, user.id)),
      );
      set("images", [...f.images, ...urls]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return f.airline && f.city_from_ar && f.departure_date;
    if (step === 1) return f.total_seats > 0 && f.price > 0;
    return true;
  };

  const submit = async () => {
    if (!agency) {
      toast.error(lang === "ar" ? "أنشئ ملف الوكالة أولاً" : "Create your agency first");
      nav({ to: "/profile" });
      return;
    }
    try {
      await createOffer.mutateAsync({
      airline: f.airline,
      city_from_ar: f.city_from_ar,
      city_from_en: f.city_from_en || f.city_from_ar,
      city_to_ar: f.city_to_ar,
      city_to_en: f.city_to_en,
      departure_date: f.departure_date,
      return_date: f.return_date || null,
      total_seats: f.total_seats,
      remaining_seats: f.total_seats,
      original_price: f.original_price || f.price,
      price: f.price,
      currency: "DZD",
      urgent: f.urgent,
      notes_ar: f.notes_ar || null,
      notes_en: null,
      images: f.images,
      hotel_name: f.hotel_name || null,
      hotel_stars: null,
      package_type: null,
      expires_at: f.urgent ? new Date(Date.now() + 24 * 3600000).toISOString() : null,
    });
    playSuccess();
    haptic("success");
    clearDraft();
    nav({ to: "/dashboard" });
  };

  const steps = [
    { title: lang === "ar" ? "تفاصيل الرحلة" : "Flight details" },
    { title: lang === "ar" ? "السعر والمقاعد" : "Price & seats" },
    { title: lang === "ar" ? "مراجعة ونشر" : "Review & publish" },
  ];

  return (
    <AppShell title={t("publishTitle")}>
      <div className="flex items-center gap-2 mb-6">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--input)]">
            <motion.div initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} className="h-full bg-gold-gradient" />
          </div>
        ))}
      </div>
      <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">{lang === "ar" ? `الخطوة ${step + 1} من 3` : `Step ${step + 1} of 3`}</p>
      <h2 className="text-2xl font-extrabold tracking-tight mb-6">{steps[step].title}</h2>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
          {step === 0 && (
            <>
              <Field icon={Plane} label={t("airline")} value={f.airline} onChange={(v) => set("airline", v)} placeholder="Saudia" />
              <Field icon={MapPin} label={lang === "ar" ? "مدينة المغادرة (عربي)" : "Departure city (AR)"} value={f.city_from_ar} onChange={(v) => set("city_from_ar", v)} placeholder="الجزائر" />
              <Field icon={MapPin} label={lang === "ar" ? "Departure (EN)" : "Departure (EN)"} value={f.city_from_en} onChange={(v) => set("city_from_en", v)} placeholder="Algiers" />
              <Field icon={Calendar} label={t("departureDate")} type="date" value={f.departure_date} onChange={(v) => set("departure_date", v)} />
              <Field icon={Calendar} label={lang === "ar" ? "تاريخ العودة (اختياري)" : "Return date (optional)"} type="date" value={f.return_date} onChange={(v) => set("return_date", v)} />
              <Field icon={FileText} label={lang === "ar" ? "اسم الفندق (اختياري)" : "Hotel (optional)"} value={f.hotel_name} onChange={(v) => set("hotel_name", v)} />

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">{lang === "ar" ? "صور (حتى 5)" : "Images (up to 5)"}</label>
                <div className="flex gap-2 flex-wrap">
                  {f.images.map((u, i) => (
                    <div key={i} className="relative size-20 rounded-xl overflow-hidden ring-1 ring-border">
                      <img src={u} alt="" className="size-full object-cover" />
                      <button onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="absolute top-1 end-1 size-5 rounded-full bg-black/60 grid place-items-center">
                        <X className="size-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {f.images.length < 5 && (
                    <label className="size-20 rounded-xl border-2 border-dashed border-border grid place-items-center cursor-pointer hover:border-primary/50 transition">
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
                      {uploading ? <span className="text-xs">...</span> : <ImagePlus className="size-5 text-muted-foreground" />}
                    </label>
                  )}
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <Field icon={Users} label={t("seatsCount")} type="number" value={String(f.total_seats)} onChange={(v) => set("total_seats", parseInt(v) || 0)} />
              <Field icon={DollarSign} label={t("originalPrice") + " (DZD)"} type="number" value={String(f.original_price || "")} onChange={(v) => set("original_price", parseFloat(v) || 0)} placeholder="285000" />
              <Field icon={DollarSign} label={t("discountedPrice") + " (DZD)"} type="number" value={String(f.price || "")} onChange={(v) => set("price", parseFloat(v) || 0)} placeholder="219000" />
              <button type="button" onClick={() => set("urgent", !f.urgent)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${f.urgent ? "border-[var(--crimson)]/50 bg-[var(--crimson)]/10" : "border-border bg-[var(--input)]"}`}>
                <div className="flex items-center gap-3">
                  <Flame className={`size-5 ${f.urgent ? "text-[var(--crimson)]" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold">{t("markUrgent")}</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition ${f.urgent ? "bg-[var(--crimson)]" : "bg-muted"}`}>
                  <motion.div animate={{ x: f.urgent ? (lang === "ar" ? -20 : 20) : 0 }} className="size-5 rounded-full bg-white shadow" />
                </div>
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <textarea value={f.notes_ar} onChange={(e) => set("notes_ar", e.target.value)} placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."} className="w-full min-h-[100px] rounded-2xl bg-[var(--input)] border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div className="card-luxe p-5">
                <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">{lang === "ar" ? "ملخص" : "Summary"}</p>
                <div className="space-y-2 text-sm">
                  <Row k={t("airline")} v={f.airline} />
                  <Row k={t("city")} v={`${f.city_from_ar} → ${f.city_to_ar}`} />
                  <Row k={t("departureDate")} v={f.departure_date} />
                  <Row k={t("seatsCount")} v={String(f.total_seats)} />
                  <Row k={t("discountedPrice")} v={`${f.price.toLocaleString()} DZD`} highlight />
                  {f.urgent && <Row k={t("urgent")} v="✓" />}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="flex-1 h-14 rounded-2xl glass font-semibold">{t("back")}</button>}
        <button
          onClick={() => step < 2 ? (canNext() && setStep(step + 1)) : submit()}
          disabled={!canNext() || createOffer.isPending}
          className="flex-1 h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
        >
          {createOffer.isPending ? "..." : (step < 2 ? t("next") : t("publishNow"))}
          {step < 2 ? <ArrowRight className="size-5 rtl:rotate-180" /> : <Check className="size-5" />}
        </button>
      </div>
    </AppShell>
  );
}

function Field({ icon: Icon, label, value, onChange, ...rest }: { icon: typeof Plane; label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="relative">
      <label className="absolute top-2.5 start-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground pointer-events-none">{label}</label>
      <Icon className="absolute top-1/2 -translate-y-1/2 start-4 size-5 text-primary" />
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-16 rounded-2xl bg-[var(--input)] border border-border ps-12 pe-4 pt-5 text-[15px] font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-semibold ${highlight ? "text-gold text-base" : ""}`}>{v}</span>
    </div>
  );
}
