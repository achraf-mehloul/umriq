import { useI18n } from "@/lib/i18n";
import { trustTier, useAgencyTrust } from "@/lib/api/trust";

export function TrustScoreBadge({ agencyId, compact }: { agencyId?: string | null; compact?: boolean }) {
  const { lang } = useI18n();
  const { data } = useAgencyTrust(agencyId);
  if (!data) return null;
  const t = trustTier(data.trust_score);
  return (
    <div
      title={lang === "ar" ? `${data.review_count} تقييم · ${data.open_disputes} نزاع مفتوح` : `${data.review_count} reviews · ${data.open_disputes} open disputes`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: compact ? "4px 8px" : "6px 12px",
        borderRadius: 999, background: `${t.color}18`, color: t.color,
        fontWeight: 600, fontSize: compact ? 12 : 13,
        border: `1px solid ${t.color}30`,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
      {lang === "ar" ? t.label_ar : t.label_en} · {data.trust_score}
    </div>
  );
}
