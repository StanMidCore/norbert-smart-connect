export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          channel_id: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          start_time: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          start_time: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          start_time?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_type: string
          connected_at: string | null
          created_at: string | null
          id: string
          priority_order: number | null
          provider_info: Json | null
          status: string | null
          unipile_account_id: string
          user_id: string | null
        }
        Insert: {
          channel_type: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          priority_order?: number | null
          provider_info?: Json | null
          status?: string | null
          unipile_account_id: string
          user_id?: string | null
        }
        Update: {
          channel_type?: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          priority_order?: number | null
          provider_info?: Json | null
          status?: string | null
          unipile_account_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          ai_instructions_built: string | null
          availability: string | null
          bio_description: string | null
          created_at: string | null
          n8n_webhook_url: string | null
          pricing: string | null
          services_offered: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          ai_instructions_built?: string | null
          availability?: string | null
          bio_description?: string | null
          created_at?: string | null
          n8n_webhook_url?: string | null
          pricing?: string | null
          services_offered?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          ai_instructions_built?: string | null
          availability?: string | null
          bio_description?: string | null
          created_at?: string | null
          n8n_webhook_url?: string | null
          pricing?: string | null
          services_offered?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          first_contact: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          phone_number: string | null
          preferred_channel: string | null
          status: string | null
          total_messages: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_contact?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          phone_number?: string | null
          preferred_channel?: string | null
          status?: string | null
          total_messages?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_contact?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          phone_number?: string | null
          preferred_channel?: string | null
          status?: string | null
          total_messages?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          channel_type: string
          content: string
          conversation_id: string | null
          id: string
          read: boolean | null
          sender: string
          timestamp: string | null
        }
        Insert: {
          channel_type: string
          content: string
          conversation_id?: string | null
          id?: string
          read?: boolean | null
          sender: string
          timestamp?: string | null
        }
        Update: {
          channel_type?: string
          content?: string
          conversation_id?: string | null
          id?: string
          read?: boolean | null
          sender?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel_type: string
          client_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          messages_count: number | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          channel_type: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages_count?: number | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          channel_type?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages_count?: number | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body_preview: string
          channel_id: string | null
          from_name: string
          from_number: string | null
          handled_by: string | null
          id: string
          requires_response: boolean | null
          response_status: string | null
          timestamp: string | null
          urgent: boolean | null
          user_id: string | null
        }
        Insert: {
          body_preview: string
          channel_id?: string | null
          from_name: string
          from_number?: string | null
          handled_by?: string | null
          id?: string
          requires_response?: boolean | null
          response_status?: string | null
          timestamp?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Update: {
          body_preview?: string
          channel_id?: string | null
          from_name?: string
          from_number?: string | null
          handled_by?: string | null
          id?: string
          requires_response?: boolean | null
          response_status?: string | null
          timestamp?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      signup_process: {
        Row: {
          business_name: string
          created_at: string
          email: string
          email_verified: boolean
          id: string
          payment_completed: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          verification_expires_at: string | null
          verification_token: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          email: string
          email_verified?: boolean
          id?: string
          payment_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          verification_expires_at?: string | null
          verification_token?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          payment_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          verification_expires_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          autopilot: boolean | null
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          phone_number: string | null
          workflow_id_n8n: string | null
        }
        Insert: {
          autopilot?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          last_login?: string | null
          phone_number?: string | null
          workflow_id_n8n?: string | null
        }
        Update: {
          autopilot?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          phone_number?: string | null
          workflow_id_n8n?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
