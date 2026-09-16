export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          banned: boolean
          bio_ar: string | null
          bio_en: string | null
          city_ar: string
          city_en: string
          created_at: string
          id: string
          is_buyer: boolean
          is_supplier: boolean
          kyc_reviewed_at: string | null
          kyc_reviewed_by: string | null
          kyc_status: string
          kyc_submitted_at: string | null
          logo_url: string | null
          name_ar: string
          name_en: string
          owner_id: string
          rating: number
          supplier_types: string[]
          total_deals: number
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          banned?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          city_ar: string
          city_en: string
          created_at?: string
          id?: string
          is_buyer?: boolean
          is_supplier?: boolean
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          logo_url?: string | null
          name_ar: string
          name_en: string
          owner_id: string
          rating?: number
          supplier_types?: string[]
          total_deals?: number
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          banned?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          city_ar?: string
          city_en?: string
          created_at?: string
          id?: string
          is_buyer?: boolean
          is_supplier?: boolean
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          owner_id?: string
          rating?: number
          supplier_types?: string[]
          total_deals?: number
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_private: {
        Row: {
          agency_id: string
          commercial_register_url: string | null
          created_at: string
          email: string | null
          kyc_rejection_reason: string | null
          license_number: string | null
          license_url: string | null
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          commercial_register_url?: string | null
          created_at?: string
          email?: string | null
          kyc_rejection_reason?: string | null
          license_number?: string | null
          license_url?: string | null
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          commercial_register_url?: string | null
          created_at?: string
          email?: string | null
          kyc_rejection_reason?: string | null
          license_number?: string | null
          license_url?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_private_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_private_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      bookings: {
        Row: {
          buyer_agency_id: string
          created_at: string
          id: string
          notes: string | null
          offer_id: string
          price_per_seat: number
          seats: number
          seller_agency_id: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          buyer_agency_id: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_id: string
          price_per_seat: number
          seats: number
          seller_agency_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          buyer_agency_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_id?: string
          price_per_seat?: number
          seats?: number
          seller_agency_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      conversations: {
        Row: {
          agency_a_id: string
          agency_b_id: string
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          agency_a_id: string
          agency_b_id: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          agency_a_id?: string
          agency_b_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agency_a_id_fkey"
            columns: ["agency_a_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_agency_a_id_fkey"
            columns: ["agency_a_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "conversations_agency_b_id_fkey"
            columns: ["agency_b_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_agency_b_id_fkey"
            columns: ["agency_b_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          body: string
          created_at: string
          dispute_id: string
          id: string
          is_admin: boolean
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dispute_id: string
          id?: string
          is_admin?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          buyer_agency_id: string
          created_at: string
          description: string
          id: string
          opened_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_agency_id: string
          status: Database["public"]["Enums"]["dispute_status"]
          type: Database["public"]["Enums"]["dispute_type"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          buyer_agency_id: string
          created_at?: string
          description: string
          id?: string
          opened_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_agency_id: string
          status?: Database["public"]["Enums"]["dispute_status"]
          type: Database["public"]["Enums"]["dispute_type"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          buyer_agency_id?: string
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_agency_id?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          type?: Database["public"]["Enums"]["dispute_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "disputes_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          body_html: string
          created_at: string
          id: string
          kind: string
          last_error: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          body_html: string
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          body_html?: string
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_bookings: {
        Row: {
          board_type: string | null
          buyer_agency_id: string
          cancellation_policy: string | null
          cancelled_reason: string | null
          check_in: string
          check_out: string
          city_zone: string
          created_at: string
          currency: string
          free_cancellation_until: string | null
          guests_per_room: number
          hold_id: string | null
          hotel_name: string
          hotel_name_ar: string | null
          hotel_stars: number | null
          id: string
          listing_id: string
          nights: number
          notes: string | null
          price_per_room: number
          room_type: string | null
          rooms: number
          seller_agency_id: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          board_type?: string | null
          buyer_agency_id: string
          cancellation_policy?: string | null
          cancelled_reason?: string | null
          check_in: string
          check_out: string
          city_zone?: string
          created_at?: string
          currency?: string
          free_cancellation_until?: string | null
          guests_per_room?: number
          hold_id?: string | null
          hotel_name: string
          hotel_name_ar?: string | null
          hotel_stars?: number | null
          id?: string
          listing_id: string
          nights: number
          notes?: string | null
          price_per_room: number
          room_type?: string | null
          rooms: number
          seller_agency_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          board_type?: string | null
          buyer_agency_id?: string
          cancellation_policy?: string | null
          cancelled_reason?: string | null
          check_in?: string
          check_out?: string
          city_zone?: string
          created_at?: string
          currency?: string
          free_cancellation_until?: string | null
          guests_per_room?: number
          hold_id?: string | null
          hotel_name?: string
          hotel_name_ar?: string | null
          hotel_stars?: number | null
          id?: string
          listing_id?: string
          nights?: number
          notes?: string | null
          price_per_room?: number
          room_type?: string | null
          rooms?: number
          seller_agency_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "hotel_bookings_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "inventory_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "hotel_bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_holds: {
        Row: {
          booking_id: string | null
          buyer_agency_id: string | null
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          quantity: number
          status: Database["public"]["Enums"]["hold_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          buyer_agency_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id: string
          quantity: number
          status?: Database["public"]["Enums"]["hold_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          buyer_agency_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["hold_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_holds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "inventory_holds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_holds_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_units: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          id: string
          label: string | null
          listing_id: string
          quantity_sold: number
          quantity_total: number
          unit_date: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_id: string
          created_at?: string
          id?: string
          label?: string | null
          listing_id: string
          quantity_sold?: number
          quantity_total: number
          unit_date?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label?: string | null
          listing_id?: string
          quantity_sold?: number
          quantity_total?: number
          unit_date?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_units_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_units_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "inventory_units_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_flight_details: {
        Row: {
          airline: string
          city_from_ar: string
          city_from_en: string
          city_to_ar: string
          city_to_en: string
          created_at: string
          departure_date: string
          listing_id: string
          return_date: string | null
          updated_at: string
        }
        Insert: {
          airline: string
          city_from_ar: string
          city_from_en: string
          city_to_ar: string
          city_to_en: string
          created_at?: string
          departure_date: string
          listing_id: string
          return_date?: string | null
          updated_at?: string
        }
        Update: {
          airline?: string
          city_from_ar?: string
          city_from_en?: string
          city_to_ar?: string
          city_to_en?: string
          created_at?: string
          departure_date?: string
          listing_id?: string
          return_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_flight_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_hotel_details: {
        Row: {
          address: string | null
          board_type: string | null
          cancellation_policy_ar: string | null
          cancellation_policy_en: string | null
          check_in: string | null
          check_out: string | null
          city_zone: string
          created_at: string
          distance_to_haram_m: number | null
          free_cancellation_days: number | null
          hotel_name: string
          hotel_name_ar: string | null
          hotel_stars: number | null
          landmark_note_ar: string | null
          landmark_note_en: string | null
          listing_id: string
          max_occupancy: number
          nights: number | null
          room_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          board_type?: string | null
          cancellation_policy_ar?: string | null
          cancellation_policy_en?: string | null
          check_in?: string | null
          check_out?: string | null
          city_zone?: string
          created_at?: string
          distance_to_haram_m?: number | null
          free_cancellation_days?: number | null
          hotel_name: string
          hotel_name_ar?: string | null
          hotel_stars?: number | null
          landmark_note_ar?: string | null
          landmark_note_en?: string | null
          listing_id: string
          max_occupancy?: number
          nights?: number | null
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          board_type?: string | null
          cancellation_policy_ar?: string | null
          cancellation_policy_en?: string | null
          check_in?: string | null
          check_out?: string | null
          city_zone?: string
          created_at?: string
          distance_to_haram_m?: number | null
          free_cancellation_days?: number | null
          hotel_name?: string
          hotel_name_ar?: string | null
          hotel_stars?: number | null
          landmark_note_ar?: string | null
          landmark_note_en?: string | null
          listing_id?: string
          max_occupancy?: number
          nights?: number | null
          room_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_hotel_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_package_components: {
        Row: {
          component_listing_id: string | null
          component_type: Database["public"]["Enums"]["product_type"]
          created_at: string
          id: string
          label_ar: string | null
          label_en: string | null
          package_listing_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          component_listing_id?: string | null
          component_type: Database["public"]["Enums"]["product_type"]
          created_at?: string
          id?: string
          label_ar?: string | null
          label_en?: string | null
          package_listing_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          component_listing_id?: string | null
          component_type?: Database["public"]["Enums"]["product_type"]
          created_at?: string
          id?: string
          label_ar?: string | null
          label_en?: string | null
          package_listing_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_package_components_component_listing_id_fkey"
            columns: ["component_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_package_components_package_listing_id_fkey"
            columns: ["package_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_package_details: {
        Row: {
          created_at: string
          departure_date: string | null
          inclusions_ar: string | null
          inclusions_en: string | null
          itinerary_ar: string | null
          itinerary_en: string | null
          listing_id: string
          nights: number | null
          return_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          departure_date?: string | null
          inclusions_ar?: string | null
          inclusions_en?: string | null
          itinerary_ar?: string | null
          itinerary_en?: string | null
          listing_id: string
          nights?: number | null
          return_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          departure_date?: string | null
          inclusions_ar?: string | null
          inclusions_en?: string | null
          itinerary_ar?: string | null
          itinerary_en?: string | null
          listing_id?: string
          nights?: number | null
          return_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_package_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_visa_details: {
        Row: {
          created_at: string
          entry_type: string | null
          listing_id: string
          processing_days: number | null
          requirements_ar: string | null
          requirements_en: string | null
          updated_at: string
          validity_days: number | null
          visa_type: string
        }
        Insert: {
          created_at?: string
          entry_type?: string | null
          listing_id: string
          processing_days?: number | null
          requirements_ar?: string | null
          requirements_en?: string | null
          updated_at?: string
          validity_days?: number | null
          visa_type: string
        }
        Update: {
          created_at?: string
          entry_type?: string | null
          listing_id?: string
          processing_days?: number | null
          requirements_ar?: string | null
          requirements_en?: string | null
          updated_at?: string
          validity_days?: number | null
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_visa_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          agency_id: string
          city_ar: string | null
          city_en: string | null
          created_at: string
          currency: string
          description_ar: string | null
          description_en: string | null
          expires_at: string | null
          id: string
          images: string[]
          original_price: number | null
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          status: Database["public"]["Enums"]["listing_status"]
          title_ar: string
          title_en: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          agency_id: string
          city_ar?: string | null
          city_en?: string | null
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          expires_at?: string | null
          id?: string
          images?: string[]
          original_price?: number | null
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title_ar: string
          title_en: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          agency_id?: string
          city_ar?: string | null
          city_en?: string | null
          created_at?: string
          currency?: string
          description_ar?: string | null
          description_en?: string | null
          expires_at?: string | null
          id?: string
          images?: string[]
          original_price?: number | null
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          masked_body: string | null
          read: boolean
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          masked_body?: string | null
          read?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          masked_body?: string | null
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title_ar?: string
          title_en?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          agency_id: string
          airline: string
          city_from_ar: string
          city_from_en: string
          city_to_ar: string
          city_to_en: string
          created_at: string
          currency: string
          departure_date: string
          expires_at: string | null
          hotel_name: string | null
          hotel_stars: number | null
          id: string
          images: string[]
          listing_id: string | null
          notes_ar: string | null
          notes_en: string | null
          original_price: number
          package_type: string | null
          price: number
          remaining_seats: number
          return_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          total_seats: number
          updated_at: string
          urgent: boolean
        }
        Insert: {
          agency_id: string
          airline: string
          city_from_ar: string
          city_from_en: string
          city_to_ar?: string
          city_to_en?: string
          created_at?: string
          currency?: string
          departure_date: string
          expires_at?: string | null
          hotel_name?: string | null
          hotel_stars?: number | null
          id?: string
          images?: string[]
          listing_id?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          original_price: number
          package_type?: string | null
          price: number
          remaining_seats: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          total_seats: number
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          agency_id?: string
          airline?: string
          city_from_ar?: string
          city_from_en?: string
          city_to_ar?: string
          city_to_en?: string
          created_at?: string
          currency?: string
          departure_date?: string
          expires_at?: string | null
          hotel_name?: string | null
          hotel_stars?: number | null
          id?: string
          images?: string[]
          listing_id?: string | null
          notes_ar?: string | null
          notes_en?: string | null
          original_price?: number
          package_type?: string | null
          price?: number
          remaining_seats?: number
          return_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          total_seats?: number
          updated_at?: string
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "offers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_number: string
          agency_id: string
          bank_name: string | null
          bic: string | null
          created_at: string
          holder_name: string
          id: string
          is_default: boolean
          notes: string | null
          owner_id: string
          rip: string | null
          type: Database["public"]["Enums"]["payment_account_type"]
          updated_at: string
        }
        Insert: {
          account_number: string
          agency_id: string
          bank_name?: string | null
          bic?: string | null
          created_at?: string
          holder_name: string
          id?: string
          is_default?: boolean
          notes?: string | null
          owner_id: string
          rip?: string | null
          type: Database["public"]["Enums"]["payment_account_type"]
          updated_at?: string
        }
        Update: {
          account_number?: string
          agency_id?: string
          bank_name?: string | null
          bic?: string | null
          created_at?: string
          holder_name?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          owner_id?: string
          rip?: string | null
          type?: Database["public"]["Enums"]["payment_account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_accounts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number
          booking_id: string
          buyer_agency_id: string
          created_at: string
          id: string
          method: string
          notes: string | null
          receipt_url: string
          reference: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_agency_id: string
          status: Database["public"]["Enums"]["payment_proof_status"]
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          amount: number
          booking_id: string
          buyer_agency_id: string
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          receipt_url: string
          reference?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_agency_id: string
          status?: Database["public"]["Enums"]["payment_proof_status"]
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          buyer_agency_id?: string
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          receipt_url?: string
          reference?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_agency_id?: string
          status?: Database["public"]["Enums"]["payment_proof_status"]
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_buyer_agency_id_fkey"
            columns: ["buyer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "payment_proofs_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_seller_agency_id_fkey"
            columns: ["seller_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      platform_payment_accounts: {
        Row: {
          account_number: string
          created_at: string
          holder_name: string
          id: string
          instructions_ar: string | null
          instructions_en: string | null
          is_active: boolean
          label_ar: string
          label_en: string
          method: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          holder_name: string
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          is_active?: boolean
          label_ar: string
          label_en: string
          method: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          holder_name?: string
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          is_active?: boolean
          label_ar?: string
          label_en?: string
          method?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          suspended: boolean
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_fk"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_agency_fk"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_events: {
        Row: {
          created_at: string
          id: number
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_agency_id: string
          reviewer_agency_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_agency_id: string
          reviewer_agency_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_agency_id?: string
          reviewer_agency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_agency_id_fkey"
            columns: ["reviewed_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_agency_id_fkey"
            columns: ["reviewed_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_agency_id_fkey"
            columns: ["reviewer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_agency_id_fkey"
            columns: ["reviewer_agency_id"]
            isOneToOne: false
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          airline: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          destination: string | null
          id: string
          last_notified_at: string | null
          max_price: number | null
          min_seats: number | null
          name: string
          notify: boolean
          origin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          airline?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          destination?: string | null
          id?: string
          last_notified_at?: string | null
          max_price?: number | null
          min_seats?: number | null
          name: string
          notify?: boolean
          origin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          airline?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          destination?: string | null
          id?: string
          last_notified_at?: string | null
          max_price?: number | null
          min_seats?: number | null
          name?: string
          notify?: boolean
          origin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          agency_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agency_trust"
            referencedColumns: ["agency_id"]
          },
        ]
      }
      suspensions: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          id: string
          reason: string
          suspended_by: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          reason: string
          suspended_by: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          suspended_by?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      agency_trust: {
        Row: {
          agency_id: string | null
          open_disputes: number | null
          rating: number | null
          review_count: number | null
          total_deals: number | null
          trust_score: number | null
          verified: boolean | null
        }
        Insert: {
          agency_id?: string | null
          open_disputes?: never
          rating?: number | null
          review_count?: never
          total_deals?: number | null
          trust_score?: never
          verified?: boolean | null
        }
        Update: {
          agency_id?: string | null
          open_disputes?: never
          rating?: number | null
          review_count?: never
          total_deals?: number | null
          trust_score?: never
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_stats: { Args: never; Returns: Json }
      agency_access_active: { Args: { _agency_id: string }; Returns: boolean }
      book_hotel_rooms: {
        Args: {
          _guests_per_room?: number
          _hold_minutes?: number
          _notes?: string
          _rooms: number
          _unit_id: string
        }
        Returns: string
      }
      cancel_hotel_booking: {
        Args: { _booking_id: string; _reason?: string }
        Returns: undefined
      }
      confirm_hotel_booking: {
        Args: { _booking_id: string }
        Returns: undefined
      }
      confirm_inventory_hold: { Args: { _hold_id: string }; Returns: undefined }
      enforce_rate_limit: {
        Args: { _kind: string; _max: number; _window: string }
        Returns: undefined
      }
      expire_inventory_holds: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inventory_available: { Args: { _unit_id: string }; Returns: number }
      is_admin: { Args: { _user: string }; Returns: boolean }
      is_agency_member: { Args: { _agency_id: string }; Returns: boolean }
      queue_email: {
        Args: { _html: string; _kind: string; _subject: string; _to: string }
        Returns: undefined
      }
      release_inventory_hold: { Args: { _hold_id: string }; Returns: undefined }
      reserve_inventory: {
        Args: {
          _booking_id?: string
          _buyer_agency_id?: string
          _hold_minutes?: number
          _quantity: number
          _unit_id: string
        }
        Returns: string
      }
      upsert_inventory_unit: {
        Args: {
          _active?: boolean
          _label?: string
          _listing_id: string
          _quantity_total: number
          _unit_date?: string
          _unit_id?: string
          _unit_price?: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "agency_owner"
        | "agency_staff"
        | "rabateur"
        | "moderator"
        | "agency"
      booking_status:
        | "pending"
        | "confirmed"
        | "paid"
        | "completed"
        | "cancelled"
      dispute_status: "open" | "investigating" | "resolved" | "rejected"
      dispute_type:
        | "no_show"
        | "payment_issue"
        | "misrepresentation"
        | "cancellation"
        | "other"
      hold_status: "active" | "confirmed" | "released" | "expired"
      listing_status:
        | "draft"
        | "active"
        | "paused"
        | "sold_out"
        | "expired"
        | "archived"
      notification_type: "deal" | "message" | "urgent" | "system"
      offer_status: "active" | "paused" | "sold_out" | "expired"
      payment_account_type:
        | "baridimob"
        | "ccp"
        | "edahabia"
        | "cib"
        | "bank"
        | "paypal"
        | "visa"
      payment_proof_status: "submitted" | "accepted" | "rejected"
      product_type: "flight_seat" | "hotel_room" | "visa" | "package"
      subscription_status: "trialing" | "active" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "agency_owner",
        "agency_staff",
        "rabateur",
        "moderator",
        "agency",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "paid",
        "completed",
        "cancelled",
      ],
      dispute_status: ["open", "investigating", "resolved", "rejected"],
      dispute_type: [
        "no_show",
        "payment_issue",
        "misrepresentation",
        "cancellation",
        "other",
      ],
      hold_status: ["active", "confirmed", "released", "expired"],
      listing_status: [
        "draft",
        "active",
        "paused",
        "sold_out",
        "expired",
        "archived",
      ],
      notification_type: ["deal", "message", "urgent", "system"],
      offer_status: ["active", "paused", "sold_out", "expired"],
      payment_account_type: [
        "baridimob",
        "ccp",
        "edahabia",
        "cib",
        "bank",
        "paypal",
        "visa",
      ],
      payment_proof_status: ["submitted", "accepted", "rejected"],
      product_type: ["flight_seat", "hotel_room", "visa", "package"],
      subscription_status: ["trialing", "active", "expired", "cancelled"],
    },
  },
} as const
