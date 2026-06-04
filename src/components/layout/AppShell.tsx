import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AppShell({ title, children, hideTop = false }: { title?: string; children: ReactNode; hideTop?: boolean }) {
  return (
    <div className="relative min-h-screen pb-36">
      <div className="canvas-bg" aria-hidden />
      {!hideTop && <TopBar title={title} />}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
        className="relative max-w-xl mx-auto px-5 pt-2 pb-6"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}
