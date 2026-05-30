import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Plane, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Umriq — Onboarding" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { t, lang, toggle } = useI18n();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const slides = [
    { icon: Plane, title: t("ob1Title"), sub: t("ob1Sub"), tint: "from-primary/30 to-transparent" },
    { icon: ShieldCheck, title: t("ob2Title"), sub: t("ob2Sub"), tint: "from-emerald/30 to-transparent" },
    { icon: Zap, title: t("ob3Title"), sub: t("ob3Sub"), tint: "from-primary/30 to-transparent" },
  ];

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem("umriq.onboarded", "1");
    nav({ to: "/login" });
  };

  const next = () => (step < 2 ? setStep(step + 1) : finish());
  const s = slides[step];
  const Icon = s.icon;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8" style={{ background: "var(--gradient-midnight)" }}>
      <div className="flex items-center justify-between">
        <LogoMark size={36} />
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{lang === "ar" ? "EN" : "AR"}</button>
          <button onClick={finish} className="text-sm text-muted-foreground">{t("skip")}</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div className={`relative size-48 rounded-full grid place-items-center mb-10 bg-gradient-to-br ${s.tint}`}>
              <div className="absolute inset-4 rounded-full glass-strong" />
              <div className="absolute inset-0 rounded-full ring-1 ring-primary/20" />
              <Icon className="size-20 text-primary relative" strokeWidth={1.4} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight max-w-sm">{s.title}</h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xs leading-relaxed">{s.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-8">
        {slides.map((_, i) => (
          <motion.span
            key={i}
            animate={{ width: i === step ? 28 : 8, opacity: i === step ? 1 : 0.4 }}
            className="h-1.5 rounded-full bg-primary"
          />
        ))}
      </div>

      <button
        onClick={next}
        className="w-full h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold text-base shadow-gold flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        {step < 2 ? t("continue") : t("getStarted")}
        <ArrowRight className="size-5 rtl:rotate-180" />
      </button>
    </div>
  );
}
