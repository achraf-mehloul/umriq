import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyTrust {
  agency_id: string;
  rating: number;
  total_deals: number;
  verified: boolean;
  review_count: number;
  open_disputes: number;
  trust_score: number;
}

export function useAgencyTrust(agencyId?: string | null) {
  return useQuery({
    queryKey: ["agency-trust", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agency_trust")
        .select("*")
        .eq("agency_id", agencyId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as AgencyTrust | null;
    },
  });
}

export function trustTier(score: number): { label_ar: string; label_en: string; color: string } {
  if (score >= 80) return { label_ar: "ممتاز", label_en: "Excellent", color: "#0aa15a" };
  if (score >= 60) return { label_ar: "موثوق", label_en: "Trusted", color: "#3b82f6" };
  if (score >= 40) return { label_ar: "متوسط", label_en: "Moderate", color: "#c99a2e" };
  if (score >= 20) return { label_ar: "منخفض", label_en: "Low", color: "#ef4444" };
  return { label_ar: "جديد", label_en: "New", color: "#71717a" };
}
