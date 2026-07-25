import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Btn } from "@/components/ui/Btn";

const STORAGE_KEY = "umriq.tour.completed.v1";

interface Step { title_ar: string; title_en: string; body_ar: string; body_en: string; emoji: string }
const STEPS: Step[] = [
  { emoji: "✈️", title_ar: "مرحباً بك في Umriq", title_en: "Welcome to Umriq", body_ar: "سوق المقاعد الأول لوكالات العمرة في الجزائر.", body_en: "The premier Umrah seat marketplace in Algeria." },
  { emoji: "📢", title_ar: "انشر مقاعدك", title_en: "Publish your seats", body_ar: "أضف عرضك في 3 خطوات مع صور وسعر ومقاعد متاحة.", body_en: "Add an offer in 3 steps with images, price, and available seats." },
  { emoji: "🔎", title_ar: "ابحث واحفظ", title_en: "Search and save", body_ar: "احفظ معايير البحث لتتلقى تنبيهاً عند توفر عرض مناسب.", body_en: "Save your criteria and get notified when a matching offer appears." },
  { emoji: "🛡️", title_ar: "تعامل بأمان", title_en: "Deal safely", body_ar: "الدفع بعد التأكيد، ودعم النزاعات من فريق Umriq.", body_en: "Payment on confirmation, with dispute support from the Umriq team." },
];

export function OnboardingTour() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => { if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) setOpen(true); }, []);

  if (!open) return null;
  const s = STEPS[i];
  const done = () => { localStorage.setItem(STORAGE_KEY, "1"); setOpen(false); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="card card-elevated" style={{ maxWidth: 420, width: "100%", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{s.emoji}</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{lang === "ar" ? s.title_ar : s.title_en}</h3>
        <p style={{ color: "var(--color-fg-muted)", lineHeight: 1.6, marginBottom: 24 }}>{lang === "ar" ? s.body_ar : s.body_en}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {STEPS.map((_, k) => (
            <span key={k} style={{ width: 8, height: 8, borderRadius: "50%", background: k === i ? "var(--color-brand)" : "var(--color-border)" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={done}>{lang === "ar" ? "تخطي" : "Skip"}</Btn>
          {i < STEPS.length - 1
            ? <Btn onClick={() => setI(i + 1)}>{lang === "ar" ? "التالي" : "Next"}</Btn>
            : <Btn onClick={done}>{lang === "ar" ? "لنبدأ" : "Let's go"}</Btn>}
        </div>
      </div>
    </div>
  );
}
