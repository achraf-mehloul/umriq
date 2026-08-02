import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { usePlatformPaymentAccounts } from "@/lib/api/platform-payments";
import { paymentMethodOf, formatRIP, type PaymentAccountType } from "@/lib/payments";
import { Btn } from "@/components/ui/Btn";

/** Official Umriq receiving accounts — BaridiMob, PayPal, Visa. */
export function PlatformPayInfo() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: accounts = [], isLoading } = usePlatformPaymentAccounts();
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading || accounts.length === 0) return null;

  return (
    <section className="card" style={{ padding: 24, marginTop: 32 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        {ar ? "حسابات Umriq الرسمية" : "Official Umriq accounts"}
      </h3>
      <p style={{ color: "var(--color-fg-muted)", fontSize: 14, marginBottom: 16 }}>
        {ar
          ? "تُستعمل هذه الحسابات لرسوم المنصة والدفع المضمون. لا تحوّل لأي حساب آخر يُرسل إليك في المحادثات."
          : "Use these accounts for platform fees and secured payments. Never transfer to any other account sent to you in chat."}
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {accounts.map((a) => {
          const m = paymentMethodOf(a.method as PaymentAccountType);
          const value = a.method === "baridimob" ? formatRIP(a.account_number) : a.account_number;
          return (
            <div key={a.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 16, borderRadius: 16, border: "1px solid var(--color-border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}20`, color: m.color, display: "grid", placeItems: "center", fontWeight: 700 }}>
                {(ar ? a.label_ar : a.label_en).trim()[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{ar ? a.label_ar : a.label_en}</strong>
                <div style={{ color: "var(--color-fg-muted)", fontSize: 13 }}>{a.holder_name}</div>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, marginTop: 4, wordBreak: "break-all" }}>{value}</div>
                <p style={{ fontSize: 12, color: "var(--color-fg-muted)", marginTop: 6 }}>
                  {ar ? a.instructions_ar : a.instructions_en}
                </p>
              </div>
              <Btn
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(a.account_number);
                  setCopied(a.id);
                  toast.success(ar ? "تم نسخ الرقم" : "Copied");
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                {copied === a.id ? (ar ? "تم" : "Copied") : ar ? "نسخ" : "Copy"}
              </Btn>
            </div>
          );
        })}
      </div>
    </section>
  );
}
