import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PaymentAccountType } from "@/lib/payments";

export type PaymentProofStatus = "submitted" | "accepted" | "rejected";

export interface PaymentProof {
  id: string;
  booking_id: string;
  buyer_agency_id: string;
  seller_agency_id: string;
  uploaded_by: string;
  method: PaymentAccountType | string;
  amount: number;
  reference: string | null;
  receipt_url: string;
  notes: string | null;
  status: PaymentProofStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const RECEIPTS_BUCKET = "payment-receipts";

/** All receipts uploaded for one booking (buyer, seller and admin can read). */
export function useBookingProofs(bookingId?: string | null) {
  return useQuery({
    queryKey: ["payment-proofs", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_proofs")
        .select("*")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PaymentProof[];
    },
  });
}

/** Short-lived signed URL for a private receipt image. */
export async function signedReceiptUrl(path: string) {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

/** Buyer uploads a transfer receipt for a confirmed booking. */
export function useUploadPaymentProof() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      booking_id: string;
      buyer_agency_id: string;
      seller_agency_id: string;
      method: string;
      amount: number;
      reference?: string;
      notes?: string;
      file: File;
    }) => {
      const ext = input.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user!.id}/${input.booking_id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .upload(path, input.file, { upsert: false, contentType: input.file.type || undefined });
      if (upErr) throw upErr;

      const { file: _file, ...rest } = input;
      const { data, error } = await (supabase as any)
        .from("payment_proofs")
        .insert({ ...rest, receipt_url: path, uploaded_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as PaymentProof;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["payment-proofs", p.booking_id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/** Seller (or admin) accepts / rejects a receipt — accepting flips the booking to paid. */
export function useReviewPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: Exclude<PaymentProofStatus, "submitted">; rejection_reason?: string }) => {
      const { data, error } = await (supabase as any)
        .from("payment_proofs")
        .update({ status: input.status, rejection_reason: input.rejection_reason ?? null })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as PaymentProof;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["payment-proofs", p.booking_id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
