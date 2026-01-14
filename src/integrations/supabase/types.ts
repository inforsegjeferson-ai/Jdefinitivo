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
            checklist_executions: {
              Row: {
                id: string;
                template_id: string;
                template_name: string;
                service_order_id: string;
                executed_by: string;
                responses: Json;
                status: string;
                started_at: string;
                completed_at: string;
                created_at: string;
              };
              Insert: {
                template_id: string;
                template_name: string;
                service_order_id: string;
                executed_by: string;
                responses: Json;
                status: string;
                started_at: string;
                completed_at: string;
                created_at?: string;
              };
              Update: {
                template_id?: string;
                template_name?: string;
                service_order_id?: string;
                executed_by?: string;
                responses?: Json;
                status?: string;
                started_at?: string;
                completed_at?: string;
                created_at?: string;
              };
              Relationships: [];
            };
            checklist_templates: {
              Row: {
                id: string;
                name: string;
                description: string;
                category: string;
                items: Json;
                created_at: string;
                updated_at: string;
                is_active: boolean;
              };
              Insert: {
                name: string;
                description: string;
                category: string;
                items: Json;
                created_at?: string;
                updated_at?: string;
                is_active?: boolean;
              };
              Update: {
                name?: string;
                description?: string;
                category?: string;
                items?: Json;
                created_at?: string;
                updated_at?: string;
                is_active?: boolean;
              };
              Relationships: [];
            };
            service_order_products: {
              Row: {
                id: string;
                service_order_id: string;
                product_id: string;
                product_name: string;
                quantity: number;
                unit: string;
                created_at: string;
              };
              Insert: {
                service_order_id: string;
                product_id: string;
                product_name: string;
                quantity: number;
                unit?: string;
                created_at?: string;
              };
              Update: {
                service_order_id?: string;
                product_id?: string;
                product_name?: string;
                quantity?: number;
                unit?: string;
                created_at?: string;
              };
              Relationships: [];
            };
      clients: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          tolerance_radius: number | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          tolerance_radius?: number | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          tolerance_radius?: number | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_order_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["service_order_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["service_order_status"] | null
          service_order_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
          service_order_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
          service_order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_audit_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_evidence: {
        Row: {
          captured_at: string
          captured_by: string
          created_at: string
          data_url: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          service_order_id: string
          type: string
        }
        Insert: {
          captured_at?: string
          captured_by: string
          created_at?: string
          data_url: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          service_order_id: string
          type: string
        }
        Update: {
          captured_at?: string
          captured_by?: string
          created_at?: string
          data_url?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          service_order_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_evidence_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          auxiliary_id: string | null
          checklist_template_id: string | null
          client_address: string
          client_id: string | null
          client_name: string
          completed_checklist: Json | null
          created_at: string | null
          created_by: string | null
          end_mileage: number | null
          id: string
          notes: string | null
          order_number: string
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: string
          start_mileage: number | null
          status: Database["public"]["Enums"]["service_order_status"] | null
          team_lead_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          auxiliary_id?: string | null
          checklist_template_id?: string | null
          client_address: string
          client_id?: string | null
          client_name: string
          completed_checklist?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_mileage?: number | null
          id?: string
          notes?: string | null
          order_number: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type: string
          start_mileage?: number | null
          status?: Database["public"]["Enums"]["service_order_status"] | null
          team_lead_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          auxiliary_id?: string | null
          checklist_template_id?: string | null
          client_address?: string
          client_id?: string | null
          client_name?: string
          completed_checklist?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_mileage?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string
          start_mileage?: number | null
          status?: Database["public"]["Enums"]["service_order_status"] | null
          team_lead_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_auxiliary_id_fkey"
            columns: ["auxiliary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          created_at: string | null
          distance_from_main: number | null
          id: string
          is_validated: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          record_type: string
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          distance_from_main?: number | null
          id?: string
          is_validated?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          record_type: string
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          distance_from_main?: number | null
          id?: string
          is_validated?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          record_type?: string
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          fuel_level: number | null
          id: string
          last_maintenance: string | null
          model: string
          next_maintenance: string | null
          plate: string
          status: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          fuel_level?: number | null
          id?: string
          last_maintenance?: string | null
          model: string
          next_maintenance?: string | null
          plate: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          fuel_level?: number | null
          id?: string
          last_maintenance?: string | null
          model?: string
          next_maintenance?: string | null
          plate?: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user_with_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "installer" | "auxiliary"
      location_type: "main" | "branch" | "warehouse"
      service_order_status: "pending" | "inProgress" | "completed" | "cancelled"
      vehicle_status: "available" | "inUse" | "maintenance"
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
      app_role: ["admin", "installer", "auxiliary"],
      location_type: ["main", "branch", "warehouse"],
      service_order_status: ["pending", "inProgress", "completed", "cancelled"],
      vehicle_status: ["available", "inUse", "maintenance"],
    },
  },
} as const
