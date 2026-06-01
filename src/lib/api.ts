/**
 * Centralized data layer for Umriq.
 * Uses the browser Supabase client directly — RLS policies enforce authorization.
 * All hooks integrate with TanStack Query for caching + realtime invalidation.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ============ Types ============
export interface Agency {
  id: string;
  owner_id: string;
  name_ar: string;
  name_en: string;
  city_ar: string;
  city_en: string;
  verified: boolean;
  license_number: string | null;
  commercial_register_url: string | null;
  license_url: string | null;
  logo_url: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  total_deals: number;
  created_at: string;
}

export interface Offer {
  id: string;
  agency_id: string;
  airline: string;
  city_from_ar: string;
  city_from_en: string;
  city_to_ar: string;
  city_to_en: string;
  departure_date: string;
  return_date: string | null;
  total_seats: number;
  remaining_seats: number;
  original_price: number;
  price: number;
  currency: string;
  urgent: boolean;
  status: "active" | "paused" | "expired" | "sold_out";
  notes_ar: string | null;
  notes_en: string | null;
  images: string[];
  hotel_name: string | null;
  hotel_stars: number | null;
  package_type: string | null;
  expires_at: string | null;
  created_at: string;
  // joined
  agencies?: Agency | null;
}

export interface Booking {
  id: string;
  offer_id: string;
  buyer_agency_id: string;
  seller_agency_id: string;
  seats: number;
  price_per_seat: number;
  total_price: number;
  status: "pending" | "confirmed" | "paid" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  offers?: Offer | null;
  buyer?: Agency | null;
  seller?: Agency | null;
}

export interface Conversation {
  id: string;
  agency_a_id: string;
  agency_b_id: string;
  last_message_at: string;
  created_at: string;
  agency_a?: Agency | null;
  agency_b?: Agency | null;
  last_message?: { body: string; created_at: string } | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  masked_body: string | null;
  read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_agency_id: string;
  reviewed_agency_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ============ Agency ============
export function useMyAgency() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-agency", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Agency | null> => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Agency | null;
    },
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Agency> & { name_ar: string; name_en: string; city_ar: string; city_en: string }) => {
      const { data, error } = await supabase
        .from("agencies")
        .insert({ ...input, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("profiles").update({ agency_id: data.id }).eq("id", user!.id);
      return data as Agency;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-agency"] });
      toast.success("Agency created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAgency(id: string | undefined) {
  return useQuery({
    queryKey: ["agency", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Agency;
    },
  });
}

// ============ Offers ============
export interface OfferFilters {
  search?: string;
  urgent?: boolean;
  verified?: boolean;
  city_from?: string;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "date_asc";
}

export function useOffers(filters: OfferFilters = {}) {
  const qc = useQueryClient();

  // Realtime invalidation
  useEffect(() => {
    const ch = supabase
      .channel("offers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        qc.invalidateQueries({ queryKey: ["offers"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ["offers", filters],
    queryFn: async () => {
      let q = supabase
        .from("offers")
        .select("*, agencies(*)")
        .eq("status", "active")
        .gt("remaining_seats", 0);

      if (filters.urgent) q = q.eq("urgent", true);
      if (filters.city_from) q = q.or(`city_from_ar.ilike.%${filters.city_from}%,city_from_en.ilike.%${filters.city_from}%`);
      if (filters.search) q = q.or(`airline.ilike.%${filters.search}%,city_from_ar.ilike.%${filters.search}%,city_from_en.ilike.%${filters.search}%`);
      if (filters.min_price !== undefined) q = q.gte("price", filters.min_price);
      if (filters.max_price !== undefined) q = q.lte("price", filters.max_price);

      switch (filters.sort) {
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        case "date_asc": q = q.order("departure_date", { ascending: true }); break;
        default: q = q.order("created_at", { ascending: false });
      }

      const { data, error } = await q.limit(50);
      if (error) throw error;
      let rows = (data ?? []) as Offer[];
      if (filters.verified) rows = rows.filter((o) => o.agencies?.verified);
      return rows;
    },
  });
}

export function useOffer(id: string | undefined) {
  return useQuery({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, agencies(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Offer;
    },
  });
}

export function useMyOffers() {
  const { data: agency } = useMyAgency();
  return useQuery({
    queryKey: ["my-offers", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("agency_id", agency!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (input: Omit<Offer, "id" | "agency_id" | "status" | "created_at" | "agencies"> & { status?: Offer["status"] }) => {
      if (!agency) throw new Error("Create your agency first");
      const { data, error } = await supabase
        .from("offers")
        .insert({ ...input, agency_id: agency.id })
        .select()
        .single();
      if (error) throw error;
      return data as Offer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["my-offers"] });
      toast.success("Offer published");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Offer> & { id: string }) => {
      const { error } = await supabase.from("offers").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["my-offers"] });
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-offers"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offer deleted");
    },
  });
}

// ============ Storage ============
export async function uploadImage(bucket: string, file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ============ Bookings ============
export function useCreateBooking() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (input: { offer: Offer; seats: number; notes?: string }) => {
      if (!agency) throw new Error("Create your agency first");
      if (input.offer.agency_id === agency.id) throw new Error("Cannot reserve your own offer");
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          offer_id: input.offer.id,
          buyer_agency_id: agency.id,
          seller_agency_id: input.offer.agency_id,
          seats: input.seats,
          price_per_seat: input.offer.price,
          total_price: input.offer.price * input.seats,
          notes: input.notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reservation request sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyBookings(role: "buyer" | "seller" | "all" = "all") {
  const { data: agency } = useMyAgency();
  return useQuery({
    queryKey: ["bookings", agency?.id, role],
    enabled: !!agency,
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("*, offers(*), buyer:agencies!bookings_buyer_agency_id_fkey(*), seller:agencies!bookings_seller_agency_id_fkey(*)");
      if (role === "buyer") q = q.eq("buyer_agency_id", agency!.id);
      else if (role === "seller") q = q.eq("seller_agency_id", agency!.id);
      else q = q.or(`buyer_agency_id.eq.${agency!.id},seller_agency_id.eq.${agency!.id}`);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) {
        // FK alias may not exist; fall back to simpler select
        const fb = await supabase
          .from("bookings")
          .select("*, offers(*)")
          .or(`buyer_agency_id.eq.${agency!.id},seller_agency_id.eq.${agency!.id}`)
          .order("created_at", { ascending: false });
        if (fb.error) throw fb.error;
        return (fb.data ?? []) as Booking[];
      }
      return (data ?? []) as Booking[];
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Booking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ Conversations & Messages ============
export function useConversations() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();

  useEffect(() => {
    if (!agency) return;
    const ch = supabase
      .channel("messages-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [agency, qc]);

  return useQuery({
    queryKey: ["conversations", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`agency_a_id.eq.${agency!.id},agency_b_id.eq.${agency!.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const convs = (data ?? []) as Conversation[];
      // hydrate other party + last message
      const otherIds = convs.map((c) => (c.agency_a_id === agency!.id ? c.agency_b_id : c.agency_a_id));
      if (otherIds.length === 0) return convs;
      const { data: agencies } = await supabase.from("agencies").select("*").in("id", otherIds);
      const map = new Map((agencies ?? []).map((a: Agency) => [a.id, a]));
      return convs.map((c) => ({
        ...c,
        agency_a: c.agency_a_id === agency!.id ? null : map.get(c.agency_a_id) ?? null,
        agency_b: c.agency_b_id === agency!.id ? null : map.get(c.agency_b_id) ?? null,
      }));
    },
  });
}

export function useOrCreateConversation() {
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (otherAgencyId: string): Promise<Conversation> => {
      if (!agency) throw new Error("Create your agency first");
      const [a, b] = [agency.id, otherAgencyId].sort();
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("agency_a_id", a)
        .eq("agency_b_id", b)
        .maybeSingle();
      if (existing) return existing as Conversation;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ agency_a_id: a, agency_b_id: b })
        .select()
        .single();
      if (error) throw error;
      return data as Conversation;
    },
  });
}

export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`msg-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, qc]);

  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

// Masks DZ phone numbers, emails, common contact-sharing patterns
function maskContacts(text: string): string {
  return text
    .replace(/(\+213|00213|0)[\s-]?[5-7]\d{1,2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/g, "••• phone hidden •••")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "••• email hidden •••")
    .replace(/\b(wa\.me|t\.me|whatsapp|telegram|viber|imo)\b[^\s]*/gi, "••• link hidden •••");
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const masked = maskContacts(body);
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        body,
        masked_body: masked !== body ? masked : null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ============ Notifications ============
export function useNotifications() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ============ Reviews ============
export function useAgencyReviews(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { data: agency } = useMyAgency();
  return useMutation({
    mutationFn: async (input: { booking_id: string; reviewed_agency_id: string; rating: number; comment?: string }) => {
      if (!agency) throw new Error("No agency");
      const { error } = await supabase.from("reviews").insert({
        booking_id: input.booking_id,
        reviewer_agency_id: agency.id,
        reviewed_agency_id: input.reviewed_agency_id,
        rating: input.rating,
        comment: input.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Review submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ Dashboard stats ============
export function useDashboardStats() {
  const { data: agency } = useMyAgency();
  return useQuery({
    queryKey: ["dashboard-stats", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const [offersRes, bookingsRes, urgentRes, pendingRes] = await Promise.all([
        supabase.from("offers").select("remaining_seats, total_seats", { count: "exact" }).eq("agency_id", agency!.id).eq("status", "active"),
        supabase.from("bookings").select("seats", { count: "exact" }).eq("seller_agency_id", agency!.id).in("status", ["confirmed", "completed"]),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("agency_id", agency!.id).eq("urgent", true).eq("status", "active"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("seller_agency_id", agency!.id).eq("status", "pending"),
      ]);
      const published = (offersRes.data ?? []).reduce((s, r) => s + (r.remaining_seats ?? 0), 0);
      const sold = (bookingsRes.data ?? []).reduce((s, r) => s + (r.seats ?? 0), 0);
      return {
        published,
        sold,
        urgent: urgentRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      };
    },
  });
}
