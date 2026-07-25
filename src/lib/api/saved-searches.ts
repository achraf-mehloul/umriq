import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  origin: string | null;
  destination: string | null;
  max_price: number | null;
  min_seats: number | null;
  date_from: string | null;
  date_to: string | null;
  airline: string | null;
  notify: boolean;
  last_notified_at: string | null;
  created_at: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-searches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_searches" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedSearch[];
    },
  });
}

export function useSaveSearch() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SavedSearch> & { name: string }) => {
      const { error } = await supabase.from("saved_searches" as never).insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_searches" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}

export function useToggleSearchNotify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; notify: boolean }) => {
      const { error } = await supabase.from("saved_searches" as never).update({ notify: input.notify }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}
