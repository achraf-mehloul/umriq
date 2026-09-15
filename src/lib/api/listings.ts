import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyAgency, type Agency } from "@/lib/api";
import type { Database } from "@/integrations/supabase/types";

export type ProductType = Database["public"]["Enums"]["product_type"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type InventoryUnit = Database["public"]["Tables"]["inventory_units"]["Row"];

export type Listing = ListingRow & {
  agencies?: Agency | null;
  listing_flight_details?: Database["public"]["Tables"]["listing_flight_details"]["Row"] | null;
  listing_hotel_details?: Database["public"]["Tables"]["listing_hotel_details"]["Row"] | null;
  listing_visa_details?: Database["public"]["Tables"]["listing_visa_details"]["Row"] | null;
  listing_package_details?: Database["public"]["Tables"]["listing_package_details"]["Row"] | null;
  inventory_units?: InventoryUnit[];
};

export type ListingFilters = {
  productType?: ProductType;
  search?: string;
  urgent?: boolean;
  verified?: boolean;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
};

const SELECT =
  "*, agencies(*), listing_flight_details(*), listing_hotel_details(*), listing_visa_details(*), listing_package_details(*), inventory_units(*)";

/** Public marketplace listings (any product type). Flight offers keep their own hooks in lib/api.ts. */
export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async (): Promise<Listing[]> => {
      let q = supabase.from("listings").select(SELECT).eq("status", "active");
      if (filters.productType) q = q.eq("product_type", filters.productType);
      if (filters.urgent) q = q.eq("urgent", true);
      if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);
      if (filters.search) {
        const s = `%${filters.search}%`;
        q = q.or(`title_ar.ilike.${s},title_en.ilike.${s},city_ar.ilike.${s},city_en.ilike.${s}`);
      }
      if (filters.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (filters.sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as unknown as Listing[];
      if (filters.verified) rows = rows.filter((r) => r.agencies?.verified);
      return rows;
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["listing", id],
    queryFn: async (): Promise<Listing | null> => {
      const { data, error } = await supabase.from("listings").select(SELECT).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as unknown as Listing) ?? null;
    },
  });
}

export function useMyListings() {
  const { data: agency } = useMyAgency();
  return useQuery({
    enabled: !!agency?.id,
    queryKey: ["my-listings", agency?.id],
    queryFn: async (): Promise<Listing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select(SELECT)
        .eq("agency_id", agency!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });
}

/** Remaining quantity across a listing's active inventory units (sold is authoritative in the DB). */
export function listingRemaining(listing: Listing): number {
  return (listing.inventory_units ?? [])
    .filter((u) => u.active)
    .reduce((sum, u) => sum + Math.max(0, u.quantity_total - u.quantity_sold), 0);
}

export function useCreateListing() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (input: Omit<Database["public"]["Tables"]["listings"]["Insert"], "agency_id">) => {
      if (!agency) throw new Error("No agency");
      const { data, error } = await supabase
        .from("listings")
        .insert({ ...input, agency_id: agency.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Database["public"]["Tables"]["listings"]["Update"]) => {
      const { error } = await supabase.from("listings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

/** Inventory is never written directly from the client — these go through SECURITY DEFINER RPCs. */
export function useUpsertInventoryUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      listingId: string;
      quantityTotal: number;
      unitId?: string;
      label?: string;
      unitDate?: string;
      unitPrice?: number;
      active?: boolean;
    }) => {
      const { data, error } = await supabase.rpc("upsert_inventory_unit", {
        _listing_id: input.listingId,
        _quantity_total: input.quantityTotal,
        _unit_id: input.unitId ?? undefined,
        _label: input.label ?? undefined,
        _unit_date: input.unitDate ?? undefined,
        _unit_price: input.unitPrice ?? undefined,
        _active: input.active ?? true,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useReserveInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { unitId: string; quantity: number; bookingId?: string; holdMinutes?: number }) => {
      const { data, error } = await supabase.rpc("reserve_inventory", {
        _unit_id: input.unitId,
        _quantity: input.quantity,
        _booking_id: input.bookingId ?? undefined,
        _hold_minutes: input.holdMinutes ?? 30,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useConfirmInventoryHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (holdId: string) => {
      const { error } = await supabase.rpc("confirm_inventory_hold", { _hold_id: holdId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

export function useReleaseInventoryHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (holdId: string) => {
      const { error } = await supabase.rpc("release_inventory_hold", { _hold_id: holdId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}
