import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-5 pb-4">
      <div className="absolute inset-0 -z-10 backdrop-blur-2xl bg-[oklch(0.105_0.016_265/0.6)] border-b border-white/[0.05]" />
      <div className="flex items-center justify-between max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3"
        >
          {title ? (
            <h1 className="font-display text-[1.35rem] font-bold tracking-tight">{title}</h1>
          ) : (
            <Logo size={26} />
          )}
        </motion.div>
        <div className="size-2 rounded-full bg-emerald-400/80 shadow-[0_0_12px_oklch(0.74_0.16_162/0.6)]" aria-hidden />
      </div>
    </header>
  );
}
