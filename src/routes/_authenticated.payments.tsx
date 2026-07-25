import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useMyAgency } from "@/lib/api";
import { useMyPaymentAccounts, useSavePaymentAccount, useDeletePaymentAccount, type PaymentAccount } from "@/lib/api/payments";
import { PAYMENT_METHODS, paymentMethodOf, formatRIP, type PaymentAccountType } from "@/lib/payments";
import { Btn } from "@/components/ui/Btn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: agency } = useMyAgency();
  const { data: accounts = [] } = useMyPaymentAccounts(agency?.id);
  const save = useSavePaymentAccount();
  const del = useDeletePaymentAccount();
  const [editing, setEditing] = useState<Partial<PaymentAccount> | null>(null);

  return (
    <div className="container" style={{ padding: "32px 20px 96px", maxWidth: 900 }}>
      <SectionHeader
        eyebrow={ar ? "المدفوعات" : "Payments"}
        title={ar ? "حسابات استلام المدفوعات" : "Payment receiving accounts"}
        description={ar
          ? "أضف بريدي موب، CCP، بطاقة الذهبية، CIB أو تحويل بنكي. تُكشف للمشتري فقط عند تأكيد الحجز."
          : "Add BaridiMob, CCP, Edahabia, CIB or bank transfer. Revealed to the buyer only after a confirmed booking."}
      />

      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        {accounts.length === 0 && !editing && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-fg-muted)" }}>
            {ar ? "لا توجد حسابات بعد. أضف أول حساب لاستلام المدفوعات." : "No accounts yet. Add your first receiving account."}
          </div>
        )}

        {accounts.map((a) => {
          const m = paymentMethodOf(a.type);
          return (
            <div key={a.id} className="card" style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}20`, color: m.color, display: "grid", placeItems: "center", fontWeight: 700 }}>{m.label_en[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong>{ar ? m.label_ar : m.label_en}</strong>
                  {a.is_default && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "var(--color-brand)", color: "var(--color-brand-fg)" }}>{ar ? "افتراضي" : "Default"}</span>}
                </div>
                <div style={{ color: "var(--color-fg-muted)", fontSize: 14, marginTop: 4 }}>{a.holder_name}</div>
                <div style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 14, marginTop: 2 }}>{a.rip ? formatRIP(a.rip) : a.account_number}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="ghost" onClick={() => setEditing(a)}>{ar ? "تعديل" : "Edit"}</Btn>
                <Btn variant="ghost" onClick={() => { if (confirm(ar ? "حذف الحساب؟" : "Delete account?")) del.mutate(a.id, { onSuccess: () => toast.success(ar ? "تم الحذف" : "Deleted") }); }}>
                  {ar ? "حذف" : "Delete"}
                </Btn>
              </div>
            </div>
          );
        })}

        {editing ? (
          <AccountForm
            initial={editing}
            agencyId={agency!.id}
            onCancel={() => setEditing(null)}
            onSave={(v) => save.mutate({ ...editing, ...v, agency_id: agency!.id }, {
              onSuccess: () => { toast.success(ar ? "تم الحفظ" : "Saved"); setEditing(null); },
              onError: (e) => toast.error((e as Error).message),
            })}
          />
        ) : (
          <Btn onClick={() => setEditing({ type: "baridimob", is_default: accounts.length === 0 })}>
            {ar ? "+ إضافة حساب دفع" : "+ Add payment account"}
          </Btn>
        )}
      </div>

      <div className="card" style={{ marginTop: 32, padding: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
          {ar ? "كيف تُغيّر رقم الحساب؟" : "How to change your account number"}
        </h3>
        <ol style={{ paddingInlineStart: 20, lineHeight: 1.8, color: "var(--color-fg-muted)" }}>
          <li>{ar ? "اضغط تعديل على الحساب المطلوب." : "Tap Edit on the account you want to change."}</li>
          <li>{ar ? "أدخل الرقم الجديد (بريدي موب/CCP: 20 رقماً، الذهبية: 19 رقماً، CIB: RIB البنكي الكامل)." : "Enter the new number (BaridiMob/CCP: 20 digits, Edahabia: 19 digits, CIB: full bank RIB)."}</li>
          <li>{ar ? "احفظ. سيبدأ استعمال الحساب الجديد للحجوزات القادمة فقط." : "Save. The new account applies to future bookings only."}</li>
          <li>{ar ? "الحجوزات المؤكدة سابقاً تبقى تعرض الرقم القديم للمشتري." : "Previously confirmed bookings continue to show the old number to the buyer."}</li>
        </ol>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link to="/dashboard" style={{ color: "var(--color-fg-muted)" }}>{ar ? "← العودة" : "← Back"}</Link>
      </div>
    </div>
  );
}

function AccountForm({ initial, onSave, onCancel }: { initial: Partial<PaymentAccount>; agencyId: string; onSave: (v: Partial<PaymentAccount>) => void; onCancel: () => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [type, setType] = useState<PaymentAccountType>(initial.type ?? "baridimob");
  const [holder, setHolder] = useState(initial.holder_name ?? "");
  const [num, setNum] = useState(initial.account_number ?? "");
  const [rip, setRip] = useState(initial.rip ?? "");
  const [bic, setBic] = useState(initial.bic ?? "");
  const [bank, setBank] = useState(initial.bank_name ?? "");
  const [isDefault, setIsDefault] = useState(initial.is_default ?? false);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const m = paymentMethodOf(type);

  return (
    <form className="card" style={{ padding: 24, display: "grid", gap: 12 }} onSubmit={(e) => { e.preventDefault(); onSave({ type, holder_name: holder, account_number: num, rip: rip || null, bic: bic || null, bank_name: bank || null, is_default: isDefault, notes: notes || null }); }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--color-fg-muted)" }}>{ar ? "نوع الحساب" : "Account type"}</span>
        <select value={type} onChange={(e) => setType(e.target.value as PaymentAccountType)} className="input" style={inputStyle}>
          {PAYMENT_METHODS.map((p) => <option key={p.id} value={p.id}>{ar ? p.label_ar : p.label_en}</option>)}
        </select>
      </label>
      <p style={{ fontSize: 13, color: "var(--color-fg-muted)" }}>{ar ? m.hint_ar : m.hint_en}</p>

      <Field label={ar ? "اسم صاحب الحساب" : "Account holder"} value={holder} onChange={setHolder} required />
      <Field label={ar ? m.numberLabel_ar : m.numberLabel_en} value={num} onChange={setNum} required />
      {m.needs_rip && <Field label={ar ? "RIP / RIB (20 رقماً)" : "RIP / RIB (20 digits)"} value={rip} onChange={(v) => setRip(formatRIP(v))} />}
      {m.needs_bic && <Field label="BIC / SWIFT" value={bic} onChange={setBic} />}
      {m.needs_bic && <Field label={ar ? "اسم البنك" : "Bank name"} value={bank} onChange={setBank} />}
      <Field label={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} value={notes} onChange={setNotes} />

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        <span>{ar ? "حساب افتراضي" : "Default account"}</span>
      </label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="ghost" type="button" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Btn>
        <Btn type="submit">{ar ? "حفظ" : "Save"}</Btn>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)" };

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--color-fg-muted)" }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} style={inputStyle} />
    </label>
  );
}
