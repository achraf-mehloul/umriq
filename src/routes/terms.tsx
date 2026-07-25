import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Umriq — Terms of Service" },
      { name: "description", content: "Umriq platform terms of service, user obligations, and dispute policy for Umrah seat exchange between Algerian agencies." },
      { property: "og:title", content: "Umriq — Terms of Service" },
      { property: "og:description", content: "Terms of service for the Umriq Umrah seat marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TermsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <article className="container" style={{ padding: "64px 20px", maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}>
        {ar ? "الشروط والأحكام" : "Terms of Service"}
      </h1>
      <p style={{ color: "var(--color-fg-muted)", marginBottom: 32 }}>
        {ar ? "آخر تحديث: نوفمبر 2026" : "Last updated: November 2026"}
      </p>

      <Section title={ar ? "1. طبيعة الخدمة" : "1. Nature of service"}>
        {ar
          ? "Umriq منصة وسيطة تربط بين وكالات العمرة والرباطورين لتبادل مقاعد الرحلات. المنصة لا تبيع مقاعد بشكل مباشر ولا تعتبر ناقلاً جوياً."
          : "Umriq is an intermediary platform connecting Umrah agencies and rabateurs for seat exchange. Umriq does not sell seats directly and is not an air carrier."}
      </Section>
      <Section title={ar ? "2. أهلية الاستخدام" : "2. Eligibility"}>
        {ar
          ? "يجب أن يكون المستخدم وكالة سياحة مرخصة أو رباطور معتمد ذو سجل تجاري ساري في الجزائر. يخضع كل حساب لتحقق KYC قبل التفعيل الكامل."
          : "Users must be licensed travel agencies or accredited rabateurs with a valid Algerian commercial register. Every account undergoes KYC verification before full activation."}
      </Section>
      <Section title={ar ? "3. الدفع" : "3. Payment"}>
        {ar
          ? "التعاملات المالية تتم مباشرة بين المشتري والبائع عبر وسائل جزائرية (بريدي موب، CCP، الذهبية، CIB، تحويل بنكي). Umriq لا تحتفظ بأموال ولا تعالج بطاقات، لكنها توفر إطار الضمان ومسار حل النزاعات."
          : "All payments happen directly between buyer and seller through Algerian methods (BaridiMob, CCP, Edahabia, CIB, bank transfer). Umriq holds no funds and processes no cards, but provides the guarantee framework and dispute path."}
      </Section>
      <Section title={ar ? "4. النزاعات" : "4. Disputes"}>
        {ar
          ? "أي طرف يمكنه فتح نزاع خلال 14 يوماً من الحجز. فريق Umriq يراجع الأدلة ويصدر قراراً ملزماً على المنصة قد يشمل تعليق الحساب أو رد المبلغ."
          : "Either party may open a dispute within 14 days of the booking. Umriq reviews evidence and issues a binding platform-level decision that may include account suspension or refund."}
      </Section>
      <Section title={ar ? "5. الحسابات الموقوفة" : "5. Suspended accounts"}>
        {ar
          ? "يحق لـ Umriq تعليق أو حذف أي حساب يخالف السياسات، ينشر معلومات مضللة، أو يتحايل على المنصة (تبادل أرقام هواتف/روابط لتجاوز الرسوم)."
          : "Umriq may suspend or terminate any account that violates policy, publishes misleading data, or bypasses the platform (sharing phone numbers or off-platform links)."}
      </Section>
      <Section title={ar ? "6. المسؤولية" : "6. Liability"}>
        {ar
          ? "Umriq توفر أدوات الثقة والوساطة، لكن لا تضمن جودة الرحلة النهائية، إذ تظل مسؤولية الوكالة الناقلة. الحد الأقصى لمسؤولية Umriq هو قيمة الحجز المعني."
          : "Umriq provides trust and mediation tools, but does not guarantee the final flight quality, which remains the carrier agency's responsibility. Umriq's maximum liability is capped at the value of the disputed booking."}
      </Section>
      <Section title={ar ? "7. القانون المطبق" : "7. Governing law"}>
        {ar
          ? "تخضع هذه الشروط للقانون الجزائري، وأي نزاع لا يُحل داخل المنصة يُحال إلى محاكم الجزائر العاصمة."
          : "These terms are governed by Algerian law. Any dispute not resolved on-platform falls under the jurisdiction of Algiers courts."}
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "var(--color-fg-muted)", lineHeight: 1.7 }}>{children}</p>
    </section>
  );
}
