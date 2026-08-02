import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useMyAgency } from "@/lib/api";
import { Btn } from "@/components/ui/Btn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const Route = createFileRoute("/_authenticated/export")({
  component: ExportPage,
  head: () => ({
    meta: [
      { title: "Data export — Umriq" },
      { name: "description", content: "Download a full backup of your agency data on Umriq: offers, bookings, reviews and payment accounts." },
      { property: "og:title", content: "Data export — Umriq" },
      { property: "og:description", content: "Download a full backup of your agency data on Umriq." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ExportPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: agency } = useMyAgency();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!agency) return;
    setBusy(true);
    try {
      const client = supabase as never as {
        from: (t: string) => { select: (s: string) => { or: (f: string) => Promise<{ data: unknown }>; eq: (c: string, v: string) => Promise<{ data: unknown }> } };
      };
      const [offers, bookings, reviews, accounts] = await Promise.all([
        client.from("offers").select("*").eq("agency_id", agency.id),
        client.from("bookings").select("*").or(`buyer_agency_id.eq.${agency.id},seller_agency_id.eq.${agency.id}`),
        client.from("reviews").select("*").eq("reviewed_agency_id", agency.id),
        client.from("payment_accounts").select("*").eq("agency_id", agency.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        agency,
        offers: offers.data ?? [],
        bookings: bookings.data ?? [],
        reviews: reviews.data ?? [],
        payment_accounts: accounts.data ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `umriq-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(ar ? "تم تنزيل النسخة الاحتياطية" : "Backup downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: "32px 20px 96px", maxWidth: 760 }}>
      <SectionHeader
        eyebrow={ar ? "البيانات" : "Data"}
        title={ar ? "تصدير ونسخ احتياطي" : "Export & backup"}
        description={ar
          ? "نزّل نسخة كاملة من بيانات وكالتك: العروض، الحجوزات، التقييمات وحسابات الدفع، بصيغة JSON."
          : "Download a complete copy of your agency data — offers, bookings, reviews and payment accounts — as JSON."}
      />
      <div className="card" style={{ padding: 24, marginTop: 24, display: "grid", gap: 16 }}>
        <p style={{ color: "var(--color-fg-muted)" }}>
          {ar
            ? "الملف يحتوي بيانات وكالتك فقط. احتفظ به في مكان آمن — يحتوي معلومات حساسة."
            : "The file contains your agency data only. Store it securely — it holds sensitive information."}
        </p>
        <Btn onClick={run} disabled={!agency || busy}>
          {busy ? (ar ? "جارٍ التحضير..." : "Preparing...") : ar ? "تنزيل نسخة احتياطية" : "Download backup"}
        </Btn>
      </div>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link to="/profile" style={{ color: "var(--color-fg-muted)" }}>{ar ? "← العودة" : "← Back"}</Link>
      </div>
    </div>
  );
}
