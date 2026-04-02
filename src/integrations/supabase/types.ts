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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          booked_by_client: boolean
          client_id: string
          company_id: string
          completed_at: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          professional_id: string | null
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          booked_by_client?: boolean
          client_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          professional_id?: string | null
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          booked_by_client?: boolean
          client_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          professional_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          professional_id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          date: string
          end_time: string
          id?: string
          professional_id: string
          reason?: string | null
          start_time: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          address: string | null
          birthday: string | null
          company_id: string
          created_at: string
          email: string | null
          favorite_professional_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferences: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          birthday?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          favorite_professional_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          birthday?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          favorite_professional_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_favorite_professional_id_fkey"
            columns: ["favorite_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cancel_limit_hours: number
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          google_maps_url: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_active_appointments: number
          max_advance_days: number
          name: string
          phone: string | null
          primary_color: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          whatsapp_number: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          cancel_limit_hours?: number
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_active_appointments?: number
          max_advance_days?: number
          name: string
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          cancel_limit_hours?: number
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_active_appointments?: number
          max_advance_days?: number
          name?: string
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          booked_by_client: boolean
          client_id: string | null
          company_id: string
          created_at: string
          estimated_end_date: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_date: string
          status: Database["public"]["Enums"]["product_sale_status"]
          total_price: number
        }
        Insert: {
          booked_by_client?: boolean
          client_id?: string | null
          company_id: string
          created_at?: string
          estimated_end_date?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_date?: string
          status?: Database["public"]["Enums"]["product_sale_status"]
          total_price?: number
        }
        Update: {
          booked_by_client?: boolean
          client_id?: string | null
          company_id?: string
          created_at?: string
          estimated_end_date?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_date?: string
          status?: Database["public"]["Enums"]["product_sale_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          name: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          avatar_url: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          specialties: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_roles_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          company_id: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          professional_id: string | null
          start_time: string
        }
        Insert: {
          company_id: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          professional_id?: string | null
          start_time: string
        }
        Update: {
          company_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          professional_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blocked_slots_public: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string | null
          end_time: string | null
          id: string | null
          professional_id: string | null
          start_time: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date?: string | null
          end_time?: string | null
          id?: string | null
          professional_id?: string | null
          start_time?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string | null
          end_time?: string | null
          id?: string | null
          professional_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies_public: {
        Row: {
          address: string | null
          cancel_limit_hours: number | null
          city: string | null
          cover_url: string | null
          description: string | null
          google_maps_url: string | null
          id: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_active_appointments: number | null
          max_advance_days: number | null
          name: string | null
          phone: string | null
          primary_color: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["company_status"] | null
          whatsapp_number: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          cancel_limit_hours?: number | null
          city?: string | null
          cover_url?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_active_appointments?: number | null
          max_advance_days?: number | null
          name?: string | null
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          cancel_limit_hours?: number | null
          city?: string | null
          cover_url?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_active_appointments?: number | null
          max_advance_days?: number | null
          name?: string | null
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
          whatsapp_number?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_company_id: { Args: never; Returns: string }
      get_request_header: { Args: { _name: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_professional_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "company_admin"
        | "employee"
        | "client"
        | "secretary"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      company_status: "active" | "suspended" | "trial"
      product_sale_status: "pending" | "completed" | "cancelled"
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
      app_role: [
        "super_admin",
        "company_admin",
        "employee",
        "client",
        "secretary",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      company_status: ["active", "suspended", "trial"],
      product_sale_status: ["pending", "completed", "cancelled"],
    },
  },
} as const
