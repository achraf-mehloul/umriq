import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useDispute, useDisputeMessages, useSendDisputeMessage } from "@/lib/api/disputes";
import { Btn } from "@/components/ui/Btn";

export const Route = createFileRoute("/_authenticated/disputes/$id")({
  component: DisputeDetailPage,
});

function DisputeDetailPage() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useAuth();
  const { data: dispute } = useDispute(id);
  const { data: messages = [] } = useDisputeMessages(id);
  const send = useSendDisputeMessage();
  const [body, setBody] = useState("");

  if (!dispute) return <div className="container" style={{ padding: 32 }}>{ar ? "جارٍ التحميل..." : "Loading..."}</div>;

  return (
    <div className="container" style={{ padding: "32px 20px 120px", maxWidth: 760 }}>
      <Link to="/disputes" style={{ color: "var(--color-fg-muted)", fontSize: 14 }}>{ar ? "← جميع النزاعات" : "← All disputes"}</Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
        {ar ? "نزاع" : "Dispute"} #{dispute.id.slice(0, 8)}
      </h1>
      <p style={{ color: "var(--color-fg-muted)", marginBottom: 20 }}>{ar ? "الحالة:" : "Status:"} {dispute.status}</p>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{ar ? "الوصف الأصلي" : "Original description"}</h3>
        <p style={{ color: "var(--color-fg-muted)", lineHeight: 1.6 }}>{dispute.description}</p>
      </div>

      {dispute.resolution && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderColor: "var(--color-brand)" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{ar ? "قرار الإدارة" : "Admin decision"}</h3>
          <p style={{ lineHeight: 1.6 }}>{dispute.resolution}</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 24 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: 12,
              borderRadius: 12,
              background: m.is_admin ? "var(--color-brand-fg-subtle, rgba(0,0,0,.04))" : m.sender_id === user?.id ? "var(--color-brand)" : "var(--color-surface)",
              color: m.sender_id === user?.id && !m.is_admin ? "var(--color-brand-fg)" : "inherit",
              alignSelf: m.sender_id === user?.id ? "flex-end" : "flex-start",
              maxWidth: "80%",
              marginInlineStart: m.sender_id === user?.id ? "auto" : 0,
              border: m.is_admin ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
            }}
          >
            {m.is_admin && <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: "var(--color-brand)" }}>Umriq {ar ? "الإدارة" : "Admin"}</div>}
            <div>{m.body}</div>
          </div>
        ))}
      </div>

      {dispute.status !== "resolved" && dispute.status !== "rejected" && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!body.trim()) return; send.mutate({ dispute_id: id, body }, { onSuccess: () => { setBody(""); toast.success(ar ? "تم الإرسال" : "Sent"); } }); }}
          style={{ display: "flex", gap: 8, marginTop: 16 }}
        >
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder={ar ? "اكتب ردك..." : "Write your reply..."} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)" }} />
          <Btn type="submit">{ar ? "إرسال" : "Send"}</Btn>
        </form>
      )}
    </div>
  );
}
