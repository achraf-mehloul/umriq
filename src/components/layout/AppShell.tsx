import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "@tanstack/react-router";

export function AppShell({ title, children, hideTop = false }: { title?: string; children: ReactNode; hideTop?: boolean }) {
  const loc = useLocation();
  return (
    <div className="relative min-h-screen pb-36">
      <div className="canvas-bg" aria-hidden />
      {!hideTop && <TopBar title={title} />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
