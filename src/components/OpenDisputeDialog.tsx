import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useOpenDispute, type DisputeType } from "@/lib/api/disputes";
import { friendlyError } from "@/lib/errors";
import { Btn } from "@/components/ui/Btn";

const TYPES: { id: DisputeType; ar: string; en: string }[] = [
  { id: "no_show", ar: "لم يحضر الطرف الآخر", en: "Other party no-show" },
  { id: "payment_issue", ar: "مشكلة في الدفع", en: "Payment issue" },
  { id: "misrepresentation", ar: "العرض مخالف للوصف", en: "Offer not as described" },
  { id: "cancellation", ar: "إلغاء غير مبرر", en: "Unjustified cancellation" },
  { id: "other", ar: "أخرى", en: "Other" },
];

/** Lets a buyer or seller open a formal dispute on a booking. */
export function OpenDisputeDialog({
  bookingId,
  buyerAgencyId,
  sellerAgencyId,
  onDone,
}: {
  bookingId: string;
  buyerAgencyId: string;
  sellerAgencyId: string;
  onDone: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const open = useOpenDispute();
  const [type, setType] = useState<DisputeType>("payment_issue");
  const [description, setDescription] = useState("");

  return (
    <form
      className="card"
      style={{ padding: 20, display: "grid", gap: 12, marginTop: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        open.mutate(
          { booking_id: bookingId, buyer_agency_id: buyerAgencyId, seller_agency_id: sellerAgencyId, type, description },
          {
            onSuccess: () => {
              toast.success(ar ? "تم فتح النزاع. سيراجعه فريق Umriq خلال 48 ساعة." : "Dispute opened. Umriq reviews it within 48 hours.");
              onDone();
            },
            onError: (e2) => toast.error(friendlyError(e2, lang as "ar" | "en")),
          },
        );
      }}
    >
      <strong>{ar ? "فتح نزاع" : "Open a dispute"}</strong>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as DisputeType)}
        style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)" }}
      >
        {TYPES.map((t) => (
          <option key={t.id} value={t.id}>{ar ? t.ar : t.en}</option>
        ))}
      </select>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        rows={4}
        placeholder={ar ? "اشرح ما حدث بالتفصيل مع التواريخ والمبالغ..." : "Describe what happened, with dates and amounts..."}
        style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-fg)", resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="ghost" type="button" onClick={onDone}>{ar ? "إلغاء" : "Cancel"}</Btn>
        <Btn type="submit" disabled={open.isPending}>{ar ? "إرسال النزاع" : "Submit dispute"}</Btn>
      </div>
    </form>
  );
}
