import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Receipt, ShieldCheck, Upload, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/errors";
import { PAYMENT_METHODS, paymentMethodOf, type PaymentAccountType } from "@/lib/payments";
import {
  signedReceiptUrl,
  useBookingProofs,
  useReviewPaymentProof,
  useUploadPaymentProof,
  type PaymentProof,
} from "@/lib/api/payment-proofs";

interface Props {
  bookingId: string;
  buyerAgencyId: string;
  sellerAgencyId: string;
  totalPrice: number;
  /** "buyer" uploads the receipt, "seller" confirms it. */
  role: "buyer" | "seller";
}

/**
 * Payment proof flow: the buyer uploads the transfer receipt, the seller
 * confirms receiving the money — accepting flips the booking to "paid".
 */
export function PaymentProofPanel({ bookingId, buyerAgencyId, sellerAgencyId, totalPrice, role }: Props) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: proofs = [], isLoading } = useBookingProofs(bookingId);
  const [open, setOpen] = useState(false);

  const latest = proofs[0];
  const canUpload = role === "buyer" && (!latest || latest.status === "rejected");

  return (
    <div className="mt-3 rounded-xl border border-border bg-[var(--input)] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Receipt className="size-4 text-primary" />
        <strong className="text-xs font-semibold">{ar ? "إثبات الدفع" : "Payment proof"}</strong>
        {latest && <StatusChip status={latest.status} />}
      </div>

      {isLoading && <div className="h-8 rounded-lg bg-card animate-pulse" />}

      {!isLoading && !latest && (
        <p className="text-xs text-muted-foreground">
          {role === "buyer"
            ? ar
              ? "بعد التحويل، ارفع صورة الإيصال ليؤكدها البائع."
              : "After transferring, upload the receipt so the seller can confirm it."
            : ar
              ? "في انتظار رفع المشتري لإيصال الدفع."
              : "Waiting for the buyer to upload a payment receipt."}
        </p>
      )}

      {latest && <ProofRow proof={latest} role={role} />}

      {canUpload && !open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 w-full h-9 rounded-lg bg-gold-gradient text-[oklch(0.15_0.02_260)] text-xs font-bold flex items-center justify-center gap-1"
        >
          <Upload className="size-4" /> {ar ? "رفع إيصال الدفع" : "Upload receipt"}
        </button>
      )}

      {open && (
        <UploadForm
          bookingId={bookingId}
          buyerAgencyId={buyerAgencyId}
          sellerAgencyId={sellerAgencyId}
          totalPrice={totalPrice}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: PaymentProof["status"] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const map = {
    submitted: { cls: "bg-primary/15 text-primary", ar: "قيد المراجعة", en: "Under review" },
    accepted: { cls: "bg-emerald-400/15 text-emerald-400", ar: "مؤكد", en: "Confirmed" },
    rejected: { cls: "bg-[var(--crimson)]/15 text-[var(--crimson)]", ar: "مرفوض", en: "Rejected" },
  }[status];
  return (
    <span className={`ms-auto text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${map.cls}`}>
      {ar ? map.ar : map.en}
    </span>
  );
}

function ProofRow({ proof, role }: { proof: PaymentProof; role: "buyer" | "seller" }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [url, setUrl] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const review = useReviewPaymentProof();
  const m = paymentMethodOf(proof.method as PaymentAccountType);

  useEffect(() => {
    let alive = true;
    signedReceiptUrl(proof.receipt_url)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [proof.receipt_url]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="font-semibold" style={{ color: m.color }}>{ar ? m.label_ar : m.label_en}</span>
        <span className="font-bold text-gold">{Number(proof.amount).toLocaleString()} DZD</span>
        {proof.reference && <span className="text-muted-foreground truncate">#{proof.reference}</span>}
      </div>
      {proof.notes && <p className="text-xs text-muted-foreground italic">"{proof.notes}"</p>}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={ar ? "إيصال الدفع" : "Payment receipt"}
            loading="lazy"
            className="max-h-44 w-full object-contain rounded-lg border border-border bg-card"
          />
        </a>
      )}
      {proof.status === "rejected" && proof.rejection_reason && (
        <p className="text-xs text-[var(--crimson)]">{proof.rejection_reason}</p>
      )}

      {role === "seller" && proof.status === "submitted" && !rejecting && (
        <div className="flex gap-2">
          <button
            onClick={() => setRejecting(true)}
            className="flex-1 h-9 rounded-lg glass text-[var(--crimson)] text-xs font-semibold flex items-center justify-center gap-1"
          >
            <X className="size-4" /> {ar ? "رفض الإيصال" : "Reject"}
          </button>
          <button
            disabled={review.isPending}
            onClick={async () => {
              try {
                await review.mutateAsync({ id: proof.id, status: "accepted" });
                toast.success(ar ? "تم تأكيد استلام المبلغ" : "Payment confirmed");
              } catch (e) {
                toast.error(friendlyError(e, lang));
              }
            }}
            className="flex-1 h-9 rounded-lg bg-gold-gradient text-[oklch(0.15_0.02_260)] text-xs font-bold flex items-center justify-center gap-1"
          >
            <ShieldCheck className="size-4" /> {ar ? "تأكيد استلام المبلغ" : "Confirm received"}
          </button>
        </div>
      )}

      {rejecting && (
        <div className="space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={ar ? "سبب الرفض" : "Rejection reason"}
            className="w-full h-9 rounded-lg bg-card border border-border px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <button onClick={() => setRejecting(false)} className="flex-1 h-9 rounded-lg glass text-xs">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              disabled={!reason.trim() || review.isPending}
              onClick={async () => {
                try {
                  await review.mutateAsync({ id: proof.id, status: "rejected", rejection_reason: reason.trim() });
                  toast.success(ar ? "تم رفض الإيصال" : "Receipt rejected");
                  setRejecting(false);
                } catch (e) {
                  toast.error(friendlyError(e, lang));
                }
              }}
              className="flex-1 h-9 rounded-lg bg-[var(--crimson)] text-white text-xs font-bold disabled:opacity-50"
            >
              {ar ? "تأكيد الرفض" : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadForm({
  bookingId,
  buyerAgencyId,
  sellerAgencyId,
  totalPrice,
  onDone,
}: {
  bookingId: string;
  buyerAgencyId: string;
  sellerAgencyId: string;
  totalPrice: number;
  onDone: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [method, setMethod] = useState<string>("baridimob");
  const [amount, setAmount] = useState<number>(totalPrice);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadPaymentProof();

  return (
    <div className="mt-2 space-y-2">
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full h-9 rounded-lg bg-card border border-border px-2 text-xs"
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.id} value={m.id}>{ar ? m.label_ar : m.label_en}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder={ar ? "المبلغ المحوَّل" : "Amount transferred"}
          className="flex-1 h-9 rounded-lg bg-card border border-border px-2 text-xs"
        />
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={ar ? "رقم العملية" : "Reference"}
          className="flex-1 h-9 rounded-lg bg-card border border-border px-2 text-xs"
        />
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={ar ? "ملاحظة (اختياري)" : "Note (optional)"}
        className="w-full h-9 rounded-lg bg-card border border-border px-2 text-xs"
      />
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-xs file:me-2 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-primary"
      />
      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 h-9 rounded-lg glass text-xs">{ar ? "إلغاء" : "Cancel"}</button>
        <button
          disabled={!file || upload.isPending}
          onClick={async () => {
            try {
              await upload.mutateAsync({
                booking_id: bookingId,
                buyer_agency_id: buyerAgencyId,
                seller_agency_id: sellerAgencyId,
                method,
                amount,
                reference: reference.trim() || undefined,
                notes: notes.trim() || undefined,
                file: file!,
              });
              toast.success(ar ? "تم إرسال الإيصال للبائع" : "Receipt sent to the seller");
              onDone();
            } catch (e) {
              toast.error(friendlyError(e, lang));
            }
          }}
          className="flex-1 h-9 rounded-lg bg-gold-gradient text-[oklch(0.15_0.02_260)] text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Check className="size-4" /> {upload.isPending ? (ar ? "جارٍ الرفع..." : "Uploading...") : ar ? "إرسال" : "Send"}
        </button>
      </div>
    </div>
  );
}
