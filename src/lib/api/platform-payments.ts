import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformPaymentAccount {
  id: string;
  method: string;
  label_ar: string;
  label_en: string;
  holder_name: string;
  account_number: string;
  instructions_ar: string | null;
  instructions_en: string | null;
  is_active: boolean;
  sort_order: number;
}

/** Official Umriq accounts (BaridiMob / PayPal / Visa) used for platform fees & escrow. */
export function usePlatformPaymentAccounts() {
  return useQuery({
    queryKey: ["platform-payment-accounts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_payment_accounts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as PlatformPaymentAccount[];
    },
  });
}
