import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Umriq — Premium Umrah Journey" },
      { name: "description", content: "Umriq — the premium platform for Umrah travel and seat booking. Calm, trustworthy, beautifully crafted." },
      { property: "og:title", content: "Umriq" },
      { property: "og:description", content: "Premium Umrah travel marketplace." },
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
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-8">
      <div className="canvas-bg" aria-hidden />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.86, opacity: 0, filter: "blur(12px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
          className="relative"
        >
          <div className="size-28 rounded-[2rem] glass-strong grid place-items-center">
            <LogoMark size={64} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="font-display mt-10 text-[3.5rem] font-medium tracking-[-0.04em] text-foreground leading-none"
        >
          Umriq
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="mt-4 text-[15px] text-muted-foreground max-w-xs font-normal"
        >
          A premium Umrah journey, beautifully arranged.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
              className="size-1.5 rounded-full bg-[var(--emerald)]"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
