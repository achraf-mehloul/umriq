import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Plane, Users, Calendar, DollarSign, Flame, FileText, Check } from "lucide-react";

export const Route = createFileRoute("/publish")({
  head: () => ({ meta: [{ title: "Umriq — Publish offer" }] }),
  component: Publish,
});

function Publish() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [urgent, setUrgent] = useState(false);

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
            <motion.div
              initial={false}
              animate={{ width: i <= step ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
              className="h-full bg-gold-gradient"
            />
          </div>
        ))}
      </div>
      <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">{lang === "ar" ? `الخطوة ${step + 1} من 3` : `Step ${step + 1} of 3`}</p>
      <h2 className="text-2xl font-extrabold tracking-tight mb-6">{steps[step].title}</h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <FloatField icon={Plane} label={t("airline")} placeholder="Saudia" />
              <FloatField icon={Plane} label={t("city")} placeholder={lang === "ar" ? "الجزائر" : "Algiers"} />
              <FloatField icon={Calendar} label={t("departureDate")} type="date" />
            </>
          )}
          {step === 1 && (
            <>
              <FloatField icon={Users} label={t("seatsCount")} type="number" placeholder="10" />
              <FloatField icon={DollarSign} label={t("originalPrice") + " (DZD)"} type="number" placeholder="285000" />
              <FloatField icon={DollarSign} label={t("minimumPrice") + " (DZD)"} type="number" placeholder="219000" />
              <button
                type="button"
                onClick={() => setUrgent(!urgent)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${urgent ? "border-[var(--crimson)]/50 bg-[var(--crimson)]/10" : "border-border bg-[var(--input)]"}`}
              >
                <div className="flex items-center gap-3">
                  <Flame className={`size-5 ${urgent ? "text-[var(--crimson)]" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold">{t("markUrgent")}</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition ${urgent ? "bg-[var(--crimson)]" : "bg-muted"}`}>
                  <motion.div animate={{ x: urgent ? (lang === "ar" ? -20 : 20) : 0 }} className="size-5 rounded-full bg-white shadow" />
                </div>
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <FloatField icon={FileText} label={t("notes")} placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."} />
              <div className="card-luxe p-5">
                <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-3">{lang === "ar" ? "ملخص" : "Summary"}</p>
                <div className="space-y-2 text-sm">
                  <Row k={t("airline")} v="Saudia" />
                  <Row k={t("city")} v={lang === "ar" ? "الجزائر → مكة" : "Algiers → Makkah"} />
                  <Row k={t("seatsCount")} v="10" />
                  <Row k={t("discountedPrice")} v="219,000 DZD" highlight />
                  {urgent && <Row k={t("urgent")} v="✓" />}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 h-14 rounded-2xl glass font-semibold">
            {t("back")}
          </button>
        )}
        <button
          onClick={() => step < 2 ? setStep(step + 1) : nav({ to: "/dashboard" })}
          className="flex-1 h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          {step < 2 ? t("next") : t("publishNow")}
          {step < 2 ? <ArrowRight className="size-5 rtl:rotate-180" /> : <Check className="size-5" />}
        </button>
      </div>
    </AppShell>
  );
}

function FloatField({ icon: Icon, label, ...rest }: { icon: typeof Plane; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <label className="absolute top-2.5 start-12 text-[10px] uppercase tracking-widest font-bold text-muted-foreground pointer-events-none">{label}</label>
      <Icon className="absolute top-1/2 -translate-y-1/2 start-4 size-5 text-primary" />
      <input {...rest} className="w-full h-16 rounded-2xl bg-[var(--input)] border border-border ps-12 pe-4 pt-5 text-[15px] font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
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
