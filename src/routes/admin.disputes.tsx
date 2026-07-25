import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useResolveDispute, type Dispute, type DisputeStatus } from "@/lib/api/disputes";
import { Btn } from "@/components/ui/Btn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const Route = createFileRoute("/admin/disputes")({
  component: AdminDisputesPage,
});

function useAllDisputes(status?: DisputeStatus) {
  return useQuery({
    queryKey: ["admin-disputes", status ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from("disputes").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as Dispute[];
    },
  });
}

function AdminDisputesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [status, setStatus] = useState<DisputeStatus | undefined>("open");
  const { data: disputes = [] } = useAllDisputes(status);
  const resolve = useResolveDispute();
  const [resolving, setResolving] = useState<{ id: string; resolution: string; status: DisputeStatus } | null>(null);

  return (
    <div className="container" style={{ padding: "32px 20px 96px", maxWidth: 1000 }}>
      <SectionHeader eyebrow={ar ? "إدارة" : "Admin"} title={ar ? "لوحة النزاعات" : "Disputes queue"} description={ar ? "راجع الشكاوى وأصدر قرارات ملزمة." : "Review complaints and issue binding decisions."} />

      <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" }}>
        {(["open", "investigating", "resolved", "rejected", undefined] as const).map((s) => (
          <Btn key={s ?? "all"} variant={status === s ? "primary" : "ghost"} onClick={() => setStatus(s)}>
            {s ?? (ar ? "الكل" : "All")}
          </Btn>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {disputes.map((d) => (
          <div key={d.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginBottom: 6 }}>
                  #{d.id.slice(0, 8)} · {d.type} · {new Date(d.created_at).toLocaleString(lang)}
                </div>
                <p style={{ margin: 0 }}>{d.description}</p>
              </div>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>{d.status}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Link to="/disputes/$id" params={{ id: d.id }}><Btn variant="ghost">{ar ? "فتح" : "Open"}</Btn></Link>
              {d.status !== "resolved" && d.status !== "rejected" && (
                <>
                  <Btn onClick={() => setResolving({ id: d.id, resolution: "", status: "resolved" })}>{ar ? "حل" : "Resolve"}</Btn>
                  <Btn variant="ghost" onClick={() => setResolving({ id: d.id, resolution: "", status: "rejected" })}>{ar ? "رفض" : "Reject"}</Btn>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {resolving && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
          <div className="card" style={{ padding: 24, maxWidth: 480, width: "100%" }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>{ar ? "قرار الإدارة" : "Admin decision"}</h3>
            <textarea value={resolving.resolution} onChange={(e) => setResolving({ ...resolving, resolution: e.target.value })} rows={5} placeholder={ar ? "اشرح القرار..." : "Explain the decision..."} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <Btn variant="ghost" onClick={() => setResolving(null)}>{ar ? "إلغاء" : "Cancel"}</Btn>
              <Btn onClick={() => resolve.mutate({ id: resolving.id, status: resolving.status, resolution: resolving.resolution }, {
                onSuccess: () => { toast.success(ar ? "تم" : "Done"); setResolving(null); },
                onError: (e) => toast.error((e as Error).message),
              })}>{ar ? "تأكيد" : "Confirm"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
