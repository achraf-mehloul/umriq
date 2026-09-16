/**
 * Hotels domain data layer.
 * Built on the shared marketplace foundation (listings + inventory_units + inventory_holds).
 * All inventory and booking state changes go through SECURITY DEFINER RPCs — never direct writes.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyAgency, type Agency } from "@/lib/api";
import type { Database } from "@/integrations/supabase/types";
import type { Listing, InventoryUnit } from "@/lib/api/listings";

export type HotelDetails = Database["public"]["Tables"]["listing_hotel_details"]["Row"];
export type HotelBooking = Database["public"]["Tables"]["hotel_bookings"]["Row"] & {
  listings?: (Listing & { agencies?: Agency | null }) | null;
};
export type CityZone = "makkah" | "madinah" | "other";

export type HotelListing = Listing & {
  listing_hotel_details?: HotelDetails | null;
};

const SELECT = "*, agencies(*), listing_hotel_details(*), inventory_units(*)";

export type HotelFilters = {
  search?: string;
  cityZone?: CityZone;
  minStars?: number;
  maxPrice?: number;
  board?: string;
  verified?: boolean;
  checkInFrom?: string;
  sort?: "newest" | "price_asc" | "price_desc";
};

export function useHotelListings(filters: HotelFilters = {}) {
  return useQuery({
    queryKey: ["hotel-listings", filters],
    queryFn: async (): Promise<HotelListing[]> => {
      let q = supabase
        .from("listings")
        .select(SELECT)
        .eq("product_type", "hotel_room")
        .eq("status", "active");
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
      let rows = (data ?? []) as unknown as HotelListing[];
      rows = rows.filter((r) => !!r.listing_hotel_details);
      if (filters.cityZone) rows = rows.filter((r) => r.listing_hotel_details?.city_zone === filters.cityZone);
      if (filters.minStars) rows = rows.filter((r) => (r.listing_hotel_details?.hotel_stars ?? 0) >= filters.minStars!);
      if (filters.board) rows = rows.filter((r) => r.listing_hotel_details?.board_type === filters.board);
      if (filters.verified) rows = rows.filter((r) => r.agencies?.verified);
      if (filters.checkInFrom) {
        rows = rows.filter((r) => {
          const ci = r.listing_hotel_details?.check_in;
          return !ci || ci >= filters.checkInFrom!;
        });
      }
      return rows;
    },
  });
}

export function useHotelListing(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["hotel-listing", id],
    queryFn: async (): Promise<HotelListing | null> => {
      const { data, error } = await supabase.from("listings").select(SELECT).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as unknown as HotelListing) ?? null;
    },
  });
}

export function useMyHotelListings() {
  const { data: agency } = useMyAgency();
  return useQuery({
    enabled: !!agency?.id,
    queryKey: ["my-hotel-listings", agency?.id],
    queryFn: async (): Promise<HotelListing[]> => {
      const { data, error } = await supabase
        .from("listings")
        .select(SELECT)
        .eq("agency_id", agency!.id)
        .eq("product_type", "hotel_room")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HotelListing[];
    },
  });
}

/** Rooms still bookable for a unit (total − sold); active holds are handled server-side on reserve. */
export function unitRoomsLeft(u: InventoryUnit): number {
  return Math.max(0, u.quantity_total - u.quantity_sold);
}

export function hotelRoomsAvailable(listing: HotelListing): number {
  return (listing.inventory_units ?? []).filter((u) => u.active).reduce((s, u) => s + unitRoomsLeft(u), 0);
}

export type CreateHotelInput = {
  title_ar: string;
  title_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  price: number;
  original_price?: number | null;
  currency?: string;
  images?: string[];
  urgent?: boolean;
  hotel: {
    hotel_name: string;
    hotel_name_ar?: string | null;
    hotel_stars?: number | null;
    city_zone: CityZone;
    address?: string | null;
    landmark_note_ar?: string | null;
    landmark_note_en?: string | null;
    distance_to_haram_m?: number | null;
    room_type?: string | null;
    board_type?: string | null;
    max_occupancy: number;
    check_in: string;
    check_out: string;
    cancellation_policy_ar?: string | null;
    cancellation_policy_en?: string | null;
    free_cancellation_days?: number | null;
  };
  rooms: number;
};

const CITY_LABEL: Record<CityZone, { ar: string; en: string }> = {
  makkah: { ar: "مكة المكرمة", en: "Makkah" },
  madinah: { ar: "المدينة المنورة", en: "Madinah" },
  other: { ar: "أخرى", en: "Other" },
};

export function cityZoneLabel(z: string, lang: "ar" | "en") {
  return (CITY_LABEL[z as CityZone] ?? CITY_LABEL.other)[lang];
}

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function useCreateHotelListing() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (input: CreateHotelInput) => {
      if (!agency) throw new Error("No agency");
      const nights = nightsBetween(input.hotel.check_in, input.hotel.check_out);
      const { data: listing, error } = await supabase
        .from("listings")
        .insert({
          agency_id: agency.id,
          product_type: "hotel_room",
          title_ar: input.title_ar,
          title_en: input.title_en || input.title_ar,
          description_ar: input.description_ar ?? null,
          description_en: input.description_en ?? null,
          city_ar: CITY_LABEL[input.hotel.city_zone].ar,
          city_en: CITY_LABEL[input.hotel.city_zone].en,
          price: input.price,
          original_price: input.original_price ?? null,
          currency: input.currency ?? "DZD",
          urgent: input.urgent ?? false,
          images: input.images ?? [],
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;

      const { error: dErr } = await supabase.from("listing_hotel_details").insert({
        listing_id: listing.id,
        ...input.hotel,
        nights,
      });
      if (dErr) throw dErr;

      const { error: uErr } = await supabase.rpc("upsert_inventory_unit", {
        _listing_id: listing.id,
        _quantity_total: input.rooms,
        _label: input.hotel.room_type ?? "Room",
        _unit_date: input.hotel.check_in,
        _unit_price: input.price,
        _active: true,
      });
      if (uErr) throw uErr;
      return listing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["my-hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useSetListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database["public"]["Enums"]["listing_status"] }) => {
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["my-hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["hotel-listing"] });
      qc.invalidateQueries({ queryKey: ["admin-hotel-listings"] });
    },
  });
}

/** Seller-side room inventory edit (quantity / active) — server enforces ownership. */
export function useSetRoomInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      listingId: string;
      unitId?: string;
      quantityTotal: number;
      label?: string | null;
      unitDate?: string | null;
      unitPrice?: number | null;
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
      qc.invalidateQueries({ queryKey: ["hotel-listing"] });
      qc.invalidateQueries({ queryKey: ["hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["my-hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-hotel-listings"] });
    },
  });
}

export function useBookHotelRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { unitId: string; rooms: number; guestsPerRoom: number; notes?: string }) => {
      const { data, error } = await supabase.rpc("book_hotel_rooms", {
        _unit_id: input.unitId,
        _rooms: input.rooms,
        _guests_per_room: input.guestsPerRoom,
        _notes: input.notes ?? undefined,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotel-listing"] });
      qc.invalidateQueries({ queryKey: ["hotel-listings"] });
      qc.invalidateQueries({ queryKey: ["hotel-bookings"] });
    },
  });
}

export function useConfirmHotelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.rpc("confirm_hotel_booking", { _booking_id: bookingId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-bookings"] }),
  });
}

export function useCancelHotelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { error } = await supabase.rpc("cancel_hotel_booking", {
        _booking_id: bookingId,
        _reason: reason ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotel-bookings"] });
      qc.invalidateQueries({ queryKey: ["hotel-listing"] });
      qc.invalidateQueries({ queryKey: ["hotel-listings"] });
    },
  });
}

/** Hotel bookings visible to my agency — RLS returns only buyer/seller rows. */
export function useMyHotelBookings() {
  const { data: agency } = useMyAgency();
  return useQuery({
    enabled: !!agency?.id,
    queryKey: ["hotel-bookings", agency?.id],
    queryFn: async (): Promise<HotelBooking[]> => {
      const { data, error } = await supabase
        .from("hotel_bookings")
        .select("*, listings(*, agencies(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HotelBooking[];
    },
  });
}
