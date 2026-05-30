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
    }, 2200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-6 bg-[var(--gradient-midnight)]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-halo)" }} />
      <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, filter: "blur(20px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 blur-2xl opacity-60 bg-primary/40 rounded-full" />
          <LogoMark size={140} />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-6 text-5xl font-extrabold tracking-tight text-gold"
        >
          Umriq
        </motion.h1>
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-3 text-sm text-muted-foreground max-w-xs"
        >
          سوق المقاعد الأول لوكالات العمرة
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-12 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="size-1.5 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
