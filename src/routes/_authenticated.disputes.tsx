import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useMyDisputes, type DisputeStatus } from "@/lib/api/disputes";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const Route = createFileRoute("/_authenticated/disputes")({
  component: DisputesPage,
});

const STATUS_LABELS: Record<DisputeStatus, { ar: string; en: string; color: string }> = {
  open: { ar: "مفتوح", en: "Open", color: "#f59e0b" },
  investigating: { ar: "قيد المراجعة", en: "Investigating", color: "#3b82f6" },
  resolved: { ar: "مُحلّ", en: "Resolved", color: "#10b981" },
  rejected: { ar: "مرفوض", en: "Rejected", color: "#ef4444" },
};

function DisputesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: disputes = [], isLoading } = useMyDisputes();

  return (
    <div className="container" style={{ padding: "32px 20px 96px", maxWidth: 860 }}>
      <SectionHeader
        eyebrow={ar ? "النزاعات" : "Disputes"}
        title={ar ? "شكاوى ونزاعات الحجوزات" : "Booking disputes"}
        description={ar ? "افتح نزاعاً خلال 14 يوماً من الحجز. فريق Umriq يراجع كل نزاع خلال 48 ساعة." : "Open a dispute within 14 days of the booking. Umriq reviews each dispute within 48 hours."}
      />

      {isLoading && <p style={{ color: "var(--color-fg-muted)", marginTop: 24 }}>{ar ? "جارٍ التحميل..." : "Loading..."}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {disputes.length === 0 && !isLoading && (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-fg-muted)" }}>
            {ar ? "لا توجد نزاعات — كل الحجوزات تمر بسلاسة 🎉" : "No disputes — all bookings are running smoothly 🎉"}
          </div>
        )}
        {disputes.map((d) => {
          const s = STATUS_LABELS[d.status];
          return (
            <Link
              key={d.id}
              to="/disputes/$id"
              params={{ id: d.id }}
              className="card"
              style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textDecoration: "none", color: "inherit" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: `${s.color}20`, color: s.color, fontWeight: 600 }}>
                    {ar ? s.ar : s.en}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-fg-muted)" }}>{new Date(d.created_at).toLocaleDateString(lang)}</span>
                </div>
                <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.description}</p>
              </div>
              <span style={{ color: "var(--color-fg-muted)" }}>→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
