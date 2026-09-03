import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "trialing" | "active" | "expired" | "cancelled";

export interface Subscription {
  id: string;
  agency_id: string;
  plan: string;
  status: SubscriptionStatus;
  trial_started_at: string;
  trial_ends_at: string;
  current_period_end: string | null;
}

/** Every agency gets one free month automatically when it is created. */
export function useMySubscription(agencyId?: string | null) {
  return useQuery({
    queryKey: ["subscription", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subscriptions")
        .select("*")
        .eq("agency_id", agencyId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Subscription | null;
    },
  });
}

export function trialDaysLeft(sub?: Subscription | null) {
  if (!sub) return null;
  const end = sub.status === "active" && sub.current_period_end ? sub.current_period_end : sub.trial_ends_at;
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
}

export function subscriptionActive(sub?: Subscription | null) {
  const days = trialDaysLeft(sub);
  if (!sub || days === null) return false;
  if (sub.status === "trialing") return days > 0;
  if (sub.status === "active") return !sub.current_period_end || days > 0;
  return false;
}
