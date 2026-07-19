import { BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Animated verified badge — subtle emerald pulse ring that draws the eye
 * without shouting. Sits inline next to an agency name.
 */
export function VerifiedBadge({ size = 16, label }: { size?: number; label?: string }) {
  return (
    <span className="relative inline-flex items-center gap-1 shrink-0" aria-label={label ?? "Verified"}>
      <span className="relative inline-grid place-items-center" style={{ width: size + 6, height: size + 6 }}>
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[var(--emerald,#10b981)]/25"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: [0.6, 1.35, 0.6], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <BadgeCheck
          className="relative text-[var(--emerald,#10b981)] drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]"
          style={{ width: size, height: size }}
        />
      </span>
      {label && (
        <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--emerald,#10b981)]">{label}</span>
      )}
    </span>
  );
}
