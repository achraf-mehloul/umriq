import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, ArrowRight, Plane, ShieldCheck, Sparkles, Star } from "lucide-react";
import hero from "@/assets/hero-mecca.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Umriq — رحلة العمرة بشكل راقي" },
      { name: "description", content: "Umriq — منصة فاخرة لحجز مقاعد العمرة من وكالات موثقة. ابحث، احجز، وسافر بسلام." },
      { property: "og:title", content: "Umriq — Premium Umrah Travel" },
      { property: "og:description", content: "Discover and reserve Umrah seats from trusted agencies." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const nav = useNavigate();
  const { lang, t } = useI18n();
  const [q, setQ] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q) localStorage.setItem("umriq.lastSearch", q);
    nav({ to: "/market" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero image */}
      <div className="absolute inset-x-0 top-0 h-[78vh] -z-10">
        <motion.img
          src={hero}
          alt=""
          fetchPriority="high"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.32, 0.72, 0, 1] }}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-transparent" />
      </div>

      {/* Top brand bar */}
      <header className="relative z-10 px-6 pt-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-[1.5rem] font-medium tracking-tight text-white drop-shadow-lg"
        >
          Umriq
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1.5 chip bg-white/15 border-white/20 text-white backdrop-blur-md"
        >
          <Sparkles className="size-3" /> {lang === "ar" ? "موسم 1447" : "Season 1447"}
        </motion.div>
      </header>

      {/* Hero copy */}
      <section className="relative z-10 px-6 pt-[28vh] pb-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-[11px] uppercase tracking-[0.32em] text-white/80 font-medium"
        >
          {lang === "ar" ? "رحلة الروح" : "A Journey of the Soul"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.95, ease: [0.32, 0.72, 0, 1] }}
          className="font-display mt-4 text-white text-[2.75rem] leading-[1.02] font-medium tracking-[-0.035em] drop-shadow-md max-w-md mx-auto"
        >
          {lang === "ar" ? "العمرة بأرقى تجربة سفر" : "Umrah, perfectly arranged"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-4 text-[14px] text-white/85 max-w-sm mx-auto leading-relaxed"
        >
          {lang === "ar"
            ? "اكتشف مقاعد من وكالات موثقة. احجز بثقة وسافر بسلام."
            : "Discover seats from verified agencies. Book with trust, travel in peace."}
        </motion.p>
      </section>

      {/* Glass search */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 px-5 -mt-2"
      >
        <form onSubmit={onSearch} className="glass-strong rounded-[28px] p-3 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-[17px] text-muted-foreground" strokeWidth={1.8} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "ar" ? "ابحث: مدينة، شركة طيران، تاريخ..." : "Search: city, airline, date..."}
                className="w-full h-12 rounded-2xl bg-transparent ps-12 pe-3 text-[14px] placeholder:text-muted-foreground/70 focus:outline-none text-foreground"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-5 rounded-2xl bg-[var(--emerald)] text-[var(--primary-foreground)] text-[13px] font-medium flex items-center gap-1.5 press shadow-card"
            >
              <span>{lang === "ar" ? "ابحث" : "Search"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" strokeWidth={2} />
            </button>
          </div>
        </form>

        {/* trust strip */}
        <div className="max-w-md mx-auto mt-5 grid grid-cols-3 gap-2">
          {[
            { i: ShieldCheck, l: lang === "ar" ? "وكالات موثقة" : "Verified agencies" },
            { i: Plane, l: lang === "ar" ? "رحلات مباشرة" : "Direct flights" },
            { i: Star, l: lang === "ar" ? "تقييمات حقيقية" : "Real reviews" },
          ].map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15 + i * 0.08, duration: 0.6 }}
              className="glass rounded-2xl py-3 px-2 text-center"
            >
              <it.i className="size-4 mx-auto text-[var(--emerald)]" strokeWidth={1.8} />
              <p className="text-[10.5px] mt-1.5 text-foreground/70 font-medium leading-tight">{it.l}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick CTAs */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.9 }}
        className="relative z-10 px-5 mt-12 pb-16 max-w-md mx-auto"
      >
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="h-14 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-[14px] font-medium flex items-center justify-center gap-2 press"
          >
            {t("login")}
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} />
          </Link>
          <Link
            to="/register"
            className="h-14 rounded-2xl glass text-foreground text-[14px] font-medium flex items-center justify-center press"
          >
            {lang === "ar" ? "إنشاء حساب وكالة" : "Create agency account"}
          </Link>
          <Link
            to="/onboarding"
            className="text-[12.5px] text-muted-foreground text-center mt-1 underline-offset-4 hover:underline"
          >
            {lang === "ar" ? "تعرّف على Umriq" : "Discover Umriq"}
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
