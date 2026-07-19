import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useCreateBooking, type Offer } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { haptic, playSuccess } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

/**
 * One-tap reservation for verified agencies.
 * Only shown when the seller is verified — trust-gated.
 */
export function QuickBookButton({ offer, seats = 1, disabled }: { offer: Offer; seats?: number; disabled?: boolean }) {
  const { lang } = useI18n();
  const reserve = useCreateBooking();
  const nav = useNavigate();

  const verified = offer.agencies?.verified;
  if (!verified) return null;

  const onClick = async () => {
    haptic("medium");
    try {
      await reserve.mutateAsync({ offer, seats });
      playSuccess();
      haptic("success");
      nav({ to: "/requests" });
    } catch (e) {
      haptic("error");
      toast.error((e as Error).message);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || reserve.isPending}
      className="relative w-full h-14 rounded-2xl overflow-hidden bg-gradient-to-r from-[var(--emerald,#10b981)] to-[oklch(0.72_0.13_155)] text-white font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
    >
      <span aria-hidden className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_50%,white,transparent_60%)]" />
      <Zap className="size-5 relative" fill="currentColor" />
      <span className="relative">
        {reserve.isPending
          ? (lang === "ar" ? "جاري الحجز..." : "Booking...")
          : (lang === "ar" ? "حجز سريع بنقرة واحدة" : "Quick book · 1 tap")}
      </span>
    </motion.button>
  );
}
