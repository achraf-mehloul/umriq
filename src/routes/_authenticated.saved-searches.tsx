import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useSavedSearches, useSaveSearch, useDeleteSavedSearch, useToggleSearchNotify } from "@/lib/api/saved-searches";
import { Btn } from "@/components/ui/Btn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const Route = createFileRoute("/_authenticated/saved-searches")({
  component: SavedSearchesPage,
});

function SavedSearchesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: searches = [] } = useSavedSearches();
  const save = useSaveSearch();
  const del = useDeleteSavedSearch();
  const toggle = useToggleSearchNotify();
  const [form, setForm] = useState({ name: "", origin: "", destination: "", max_price: "", airline: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    save.mutate({
      name: form.name,
      origin: form.origin || null,
      destination: form.destination || null,
      airline: form.airline || null,
      max_price: form.max_price ? Number(form.max_price) : null,
      notify: true,
    }, {
      onSuccess: () => { toast.success(ar ? "تم الحفظ — سنُنبّهك" : "Saved — we'll alert you"); setForm({ name: "", origin: "", destination: "", max_price: "", airline: "" }); },
      onError: (e) => toast.error((e as Error).message),
    });
  }

  return (
    <div className="container" style={{ padding: "32px 20px 96px", maxWidth: 800 }}>
      <SectionHeader
        eyebrow={ar ? "البحث المحفوظ" : "Saved searches"}
        title={ar ? "احصل على تنبيه عند توفر عرض" : "Get an alert when an offer matches"}
        description={ar ? "احفظ معايير البحث المفضلة وسنُشعِرك فوراً عبر Push والبريد." : "Save your favorite criteria and we'll notify you instantly via Push and email."}
      />

      <form className="card" style={{ padding: 20, display: "grid", gap: 10, marginTop: 24 }} onSubmit={submit}>
        <input placeholder={ar ? "اسم البحث (مثلاً: جدة أقل من 90000)" : "Search name (e.g. Jeddah under 90k)"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder={ar ? "من" : "From"} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} style={inp} />
          <input placeholder={ar ? "إلى" : "To"} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} style={inp} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder={ar ? "شركة الطيران" : "Airline"} value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} style={inp} />
          <input placeholder={ar ? "أقصى سعر (دج)" : "Max price (DZD)"} type="number" value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} style={inp} />
        </div>
        <Btn type="submit">{ar ? "حفظ البحث" : "Save search"}</Btn>
      </form>

      <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
        {searches.map((s) => (
          <div key={s.id} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{s.name}</strong>
              <div style={{ fontSize: 13, color: "var(--color-fg-muted)", marginTop: 2 }}>
                {[s.origin, s.destination].filter(Boolean).join(" → ")}
                {s.airline && ` · ${s.airline}`}
                {s.max_price && ` · ≤ ${s.max_price.toLocaleString()} DZD`}
              </div>
            </div>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={s.notify} onChange={(e) => toggle.mutate({ id: s.id, notify: e.target.checked })} />
              {ar ? "تنبيه" : "Alert"}
            </label>
            <Btn variant="ghost" onClick={() => del.mutate(s.id)}>{ar ? "حذف" : "Delete"}</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)" };
