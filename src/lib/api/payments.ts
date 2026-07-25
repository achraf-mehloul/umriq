import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PaymentAccountType } from "@/lib/payments";

export interface PaymentAccount {
  id: string;
  agency_id: string;
  owner_id: string;
  type: PaymentAccountType;
  holder_name: string;
  account_number: string;
  rip: string | null;
  bic: string | null;
  bank_name: string | null;
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyPaymentAccounts(agencyId?: string | null) {
  return useQuery({
    queryKey: ["payment-accounts", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_accounts" as never)
        .select("*")
        .eq("agency_id", agencyId!)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PaymentAccount[];
    },
  });
}

export function useSellerPaymentAccounts(sellerAgencyId?: string | null) {
  return useQuery({
    queryKey: ["seller-payment-accounts", sellerAgencyId],
    enabled: !!sellerAgencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_accounts" as never)
        .select("*")
        .eq("agency_id", sellerAgencyId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PaymentAccount[];
    },
  });
}

export function useSavePaymentAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<PaymentAccount> & { agency_id: string; type: PaymentAccountType; holder_name: string; account_number: string }) => {
      const payload = { ...input, owner_id: user!.id };
      const { data, error } = input.id
        ? await supabase.from("payment_accounts" as never).update(payload).eq("id", input.id).select().single()
        : await supabase.from("payment_accounts" as never).insert(payload).select().single();
      if (error) throw error;
      if (input.is_default) {
        await supabase.from("payment_accounts" as never)
          .update({ is_default: false })
          .eq("agency_id", input.agency_id)
          .neq("id", (data as { id: string }).id);
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  });
}

export function useDeletePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_accounts" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  });
}
