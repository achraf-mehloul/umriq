import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      <TopBar title={title} />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl mx-auto px-4 py-5"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}
