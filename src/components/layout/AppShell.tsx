import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen pb-32">
      <div className="aurora-bg" aria-hidden />
      <TopBar title={title} />
      <motion.main
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-xl mx-auto px-4 py-5"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}
