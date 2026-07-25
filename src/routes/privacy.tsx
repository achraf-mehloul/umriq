import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Umriq — Privacy Policy" },
      { name: "description", content: "How Umriq collects, stores, and protects agency data, KYC documents, and messages." },
      { property: "og:title", content: "Umriq — Privacy Policy" },
      { property: "og:description", content: "Privacy policy for the Umriq Umrah seat marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrivacyPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <article className="container" style={{ padding: "64px 20px", maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}>
        {ar ? "سياسة الخصوصية" : "Privacy Policy"}
      </h1>
      <p style={{ color: "var(--color-fg-muted)", marginBottom: 32 }}>
        {ar ? "آخر تحديث: نوفمبر 2026" : "Last updated: November 2026"}
      </p>

      <S title={ar ? "البيانات التي نجمعها" : "Data we collect"}>
        {ar
          ? "بيانات الحساب (اسم الوكالة، البريد، الهاتف)، وثائق KYC (السجل التجاري، الرخصة)، سجلات النشاط، الرسائل داخل المنصة، وبيانات الجهاز اللازمة للإشعارات."
          : "Account data (agency name, email, phone), KYC documents (commercial register, license), activity logs, in-platform messages, and device data needed for push notifications."}
      </S>
      <S title={ar ? "أين تُخزن" : "Where it is stored"}>
        {ar
          ? "على خوادم مشفرة داخل بنية Lovable Cloud (Supabase)، مع تشفير كامل أثناء النقل (TLS) وعزل صارم لكل وكالة عبر Row Level Security."
          : "On encrypted servers within the Lovable Cloud (Supabase) infrastructure, with full TLS in transit and strict per-agency isolation through Row Level Security."}
      </S>
      <S title={ar ? "من يستطيع الوصول" : "Who can access"}>
        {ar
          ? "فقط مالك الوكالة يرى بياناتها الحساسة. فريق Umriq يصل إلى بيانات KYC والنزاعات لغرض التحقق فقط. لا نبيع أو نؤجر أي بيانات لأي طرف ثالث."
          : "Only the agency owner sees their own sensitive data. The Umriq team accesses KYC and dispute data solely for verification. We never sell or rent data to third parties."}
      </S>
      <S title={ar ? "الرسائل والاتصال" : "Messages & contact"}>
        {ar
          ? "الرسائل داخل المنصة تُفحص تلقائياً وتُخفى أرقام الهواتف والبريد والروابط الخارجية لحماية الطرفين ومنع الاحتيال."
          : "In-platform messages are automatically scanned; phone numbers, emails, and external links are masked to protect both parties and prevent fraud."}
      </S>
      <S title={ar ? "الاحتفاظ والحذف" : "Retention & deletion"}>
        {ar
          ? "يمكن لأي وكالة طلب حذف حسابها في أي وقت. تُحذف البيانات الحساسة فوراً، بينما تُحفظ سجلات المعاملات لمدة 5 سنوات للامتثال المحاسبي."
          : "Any agency may request account deletion at any time. Sensitive data is deleted immediately; transaction records are kept for 5 years for accounting compliance."}
      </S>
      <S title={ar ? "الإشعارات" : "Notifications"}>
        {ar
          ? "نستخدم Web Push (VAPID) والبريد الإلكتروني لإشعارك بالحجوزات والرسائل ونتائج KYC. يمكنك إيقافها من صفحة الحساب."
          : "We use Web Push (VAPID) and email to notify you of bookings, messages, and KYC results. You can disable them from your profile page."}
      </S>
      <S title={ar ? "التواصل" : "Contact"}>
        {ar
          ? "لأي طلب متعلق بالبيانات: privacy@umriq.dz"
          : "For any data request: privacy@umriq.dz"}
      </S>
    </article>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "var(--color-fg-muted)", lineHeight: 1.7 }}>{children}</p>
    </section>
  );
}
