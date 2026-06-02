import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Umriq — سوق مقاعد العمرة الأول" },
      { name: "description", content: "منصة Umriq الفاخرة لتبادل وحجز مقاعد رحلات العمرة بين وكالات السفر في الجزائر." },
      { property: "og:title", content: "Umriq" },
      { property: "og:description", content: "Premium B2B Umrah seats marketplace." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const seen = typeof window !== "undefined" && localStorage.getItem("umriq.onboarded");
      nav({ to: seen ? "/login" : "/onboarding" });
    }, 2600);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-6 bg-midnight">
      {/* Aurora layers */}
      <div className="absolute inset-0 pointer-events-none bg-aurora" />
      <div className="glow-orb top-[10%] -right-32 size-[28rem] opacity-60" />
      <div className="glow-orb bottom-[5%] -left-32 size-[24rem] opacity-50" style={{ animationDirection: "reverse" }} />

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const top = (i * 37) % 100;
          const left = (i * 53) % 100;
          const delay = (i % 7) * 0.3;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay }}
              className="absolute size-[2px] rounded-full bg-primary"
              style={{ top: `${top}%`, left: `${left}%` }}
            />
          );
        })}
      </div>

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, filter: "blur(24px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-12 rounded-full"
            style={{ background: "conic-gradient(from 0deg, transparent, oklch(0.81 0.135 82 / 0.5), transparent 50%)", filter: "blur(20px)" }}
          />
          <div className="absolute inset-0 blur-3xl opacity-80 bg-primary/50 rounded-full" />
          <div className="relative size-40 rounded-[2rem] glass-strong card-gold-edge grid place-items-center shadow-luxe">
            <LogoMark size={96} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="font-display mt-8 text-6xl font-extrabold tracking-tight text-shimmer"
        >
          Umriq
        </motion.h1>
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          className="mt-4 text-sm text-muted-foreground max-w-xs font-medium tracking-wide"
        >
          سوق المقاعد الأول · لوكالات العمرة في الجزائر
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-8 h-px w-32 bg-gradient-to-r from-transparent via-primary to-transparent"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-6 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
              className="size-1.5 rounded-full bg-primary shadow-glow"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
