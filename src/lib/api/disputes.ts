import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";
export type DisputeType = "no_show" | "payment_issue" | "misrepresentation" | "cancellation" | "other";

export interface Dispute {
  id: string;
  booking_id: string;
  opened_by: string;
  buyer_agency_id: string;
  seller_agency_id: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

export function useMyDisputes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["disputes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Dispute[];
    },
  });
}

export function useDispute(id?: string) {
  return useQuery({
    queryKey: ["dispute", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("disputes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as unknown as Dispute;
    },
  });
}

export function useDisputeMessages(disputeId?: string) {
  return useQuery({
    queryKey: ["dispute-messages", disputeId],
    enabled: !!disputeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dispute_messages")
        .select("*")
        .eq("dispute_id", disputeId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as DisputeMessage[];
    },
  });
}

export function useOpenDispute() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { booking_id: string; buyer_agency_id: string; seller_agency_id: string; type: DisputeType; description: string }) => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .insert({ ...input, opened_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Dispute;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}

export function useSendDisputeMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { dispute_id: string; body: string; is_admin?: boolean }) => {
      const { error } = await (supabase as any).from("dispute_messages").insert({
        dispute_id: input.dispute_id,
        sender_id: user!.id,
        body: input.body,
        is_admin: input.is_admin ?? false,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["dispute-messages", v.dispute_id] }),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; status: DisputeStatus; resolution: string }) => {
      const { error } = await (supabase as any)
        .from("disputes")
        .update({
          status: input.status,
          resolution: input.resolution,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }),
  });
}
