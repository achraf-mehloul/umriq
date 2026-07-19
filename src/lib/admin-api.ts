/**
 * Admin data layer — reads/writes gated by RLS (is_admin() function).
 * Every mutation still targets Supabase directly; only users whose
 * user_roles row has role='admin' can execute these successfully.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Agency, Offer } from "./api";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) return false;
      return data === true;
    },
  });
}

export interface KycAgency extends Agency {
  kyc_status: "pending" | "approved" | "rejected";
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_rejection_reason: string | null;
}

export function useAdminAgencies(status?: "pending" | "approved" | "rejected") {
  return useQuery({
    queryKey: ["admin-agencies", status],
    queryFn: async () => {
      let q = supabase.from("agencies").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("kyc_status", status);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as KycAgency[];
    },
  });
}

export function useApproveAgency() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agencies")
        .update({
          verified: true,
          kyc_status: "approved",
          kyc_reviewed_at: new Date().toISOString(),
          kyc_reviewed_by: user!.id,
          kyc_rejection_reason: null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast.success("Agency approved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectAgency() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("agencies")
        .update({
          verified: false,
          kyc_status: "rejected",
          kyc_reviewed_at: new Date().toISOString(),
          kyc_reviewed_by: user!.id,
          kyc_rejection_reason: reason,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast.success("Agency rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "offer" | "agency" | "message" | "user";
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
}

export function useAdminReports(status?: Report["status"]) {
  return useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as Report[];
    },
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "dismissed" | "reviewing" }) => {
      const patch: Record<string, unknown> = {
        status,
        resolved_by: status === "reviewing" ? null : user!.id,
        resolved_at: status === "reviewing" ? null : new Date().toISOString(),
      };
      const { error } = await supabase.from("reports").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface Suspension {
  id: string;
  user_id: string;
  reason: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useSuspensions() {
  return useQuery({
    queryKey: ["admin-suspensions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suspensions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Suspension[];
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from("suspensions")
        .insert({ user_id: userId, reason, suspended_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-suspensions"] });
      toast.success("User suspended");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useLiftSuspension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suspensions").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-suspensions"] });
      toast.success("Suspension lifted");
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [agencies, pending, offers, bookings, reports] = await Promise.all([
        supabase.from("agencies").select("id", { count: "exact", head: true }),
        supabase.from("agencies").select("id", { count: "exact", head: true }).eq("kyc_status", "pending"),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        agencies: agencies.count ?? 0,
        pendingKyc: pending.count ?? 0,
        activeOffers: offers.count ?? 0,
        bookings: bookings.count ?? 0,
        openReports: reports.count ?? 0,
      };
    },
  });
}

export function useAllOffersAdmin() {
  return useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, agencies(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
  });
}

export function useAdminUpdateOfferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "expired" }) => {
      const { error } = await supabase.from("offers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer updated");
    },
  });
}
