import logo from "@/assets/umriq-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true, size = 32 }: { className?: string; showText?: boolean; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src={logo} alt="Umriq" style={{ height: size }} className="object-contain drop-shadow-[0_4px_16px_oklch(0.78_0.13_78/0.35)]" />
      {showText && (
        <span className="font-semibold tracking-tight text-lg text-gold">Umriq</span>
      )}
    </div>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <img src={logo} alt="Umriq" style={{ height: size, width: "auto" }} className="object-contain" />
  );
}
