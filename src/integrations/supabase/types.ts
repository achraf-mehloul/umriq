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
          bio_ar: string | null
          bio_en: string | null
          city_ar: string
          city_en: string
          commercial_register_url: string | null
          created_at: string
          email: string | null
          id: string
          license_number: string | null
          license_url: string | null
          logo_url: string | null
          name_ar: string
          name_en: string
          owner_id: string
          phone: string | null
          rating: number
          total_deals: number
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          city_ar: string
          city_en: string
          commercial_register_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          license_url?: string | null
          logo_url?: string | null
          name_ar: string
          name_en: string
          owner_id: string
          phone?: string | null
          rating?: number
          total_deals?: number
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          city_ar?: string
          city_en?: string
          commercial_register_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          license_url?: string | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          owner_id?: string
          phone?: string | null
          rating?: number
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
            foreignKeyName: "conversations_agency_b_id_fkey"
            columns: ["agency_b_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
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
          created_at: string
          currency: string
          departure_date: string
          expires_at: string | null
          id: string
          notes_ar: string | null
          notes_en: string | null
          original_price: number
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
          created_at?: string
          currency?: string
          departure_date: string
          expires_at?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          original_price: number
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
          created_at?: string
          currency?: string
          departure_date?: string
          expires_at?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          original_price?: number
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
        ]
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
        ]
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
            foreignKeyName: "reviews_reviewer_agency_id_fkey"
            columns: ["reviewer_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agency_owner" | "agency_staff" | "rabateur"
      booking_status:
        | "pending"
        | "confirmed"
        | "paid"
        | "completed"
        | "cancelled"
      notification_type: "deal" | "message" | "urgent" | "system"
      offer_status: "active" | "paused" | "sold_out" | "expired"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "agency_owner", "agency_staff", "rabateur"],
      booking_status: [
        "pending",
        "confirmed",
        "paid",
        "completed",
        "cancelled",
      ],
      notification_type: ["deal", "message", "urgent", "system"],
      offer_status: ["active", "paused", "sold_out", "expired"],
    },
  },
} as const
