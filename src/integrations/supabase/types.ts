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
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
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
        ]
      }
      preferences: {
        Row: {
          created_at: string
          max_age: number
          min_age: number
          open_to_long_distance: boolean
          preferred_gender: Database["public"]["Enums"]["gender_t"] | null
          preferred_hobbies: string[] | null
          preferred_languages: string[] | null
          preferred_regions: string[] | null
          preferred_relationship_goal:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          preferred_tribes: string[] | null
          tribe_importance:
            | Database["public"]["Enums"]["tribe_importance_t"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          max_age?: number
          min_age?: number
          open_to_long_distance?: boolean
          preferred_gender?: Database["public"]["Enums"]["gender_t"] | null
          preferred_hobbies?: string[] | null
          preferred_languages?: string[] | null
          preferred_regions?: string[] | null
          preferred_relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          preferred_tribes?: string[] | null
          tribe_importance?:
            | Database["public"]["Enums"]["tribe_importance_t"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          max_age?: number
          min_age?: number
          open_to_long_distance?: boolean
          preferred_gender?: Database["public"]["Enums"]["gender_t"] | null
          preferred_hobbies?: string[] | null
          preferred_languages?: string[] | null
          preferred_regions?: string[] | null
          preferred_relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          preferred_tribes?: string[] | null
          tribe_importance?:
            | Database["public"]["Enums"]["tribe_importance_t"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_likes: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: Database["public"]["Enums"]["like_status_t"]
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: Database["public"]["Enums"]["like_status_t"]
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: Database["public"]["Enums"]["like_status_t"]
          to_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          education: string | null
          gender: Database["public"]["Enums"]["gender_t"] | null
          hobbies: string[] | null
          id: string
          languages: string[] | null
          last_active: string
          lifestyle: string[] | null
          nationality: string | null
          occupation: string | null
          photos: string[] | null
          profile_completed: boolean
          region: string | null
          relationship_goal:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          religion: string | null
          town: string | null
          tribe: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          education?: string | null
          gender?: Database["public"]["Enums"]["gender_t"] | null
          hobbies?: string[] | null
          id: string
          languages?: string[] | null
          last_active?: string
          lifestyle?: string[] | null
          nationality?: string | null
          occupation?: string | null
          photos?: string[] | null
          profile_completed?: boolean
          region?: string | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          religion?: string | null
          town?: string | null
          tribe?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          education?: string | null
          gender?: Database["public"]["Enums"]["gender_t"] | null
          hobbies?: string[] | null
          id?: string
          languages?: string[] | null
          last_active?: string
          lifestyle?: string[] | null
          nationality?: string | null
          occupation?: string | null
          photos?: string[] | null
          profile_completed?: boolean
          region?: string | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal_t"]
            | null
          religion?: string | null
          town?: string | null
          tribe?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conv_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
    }
    Enums: {
      gender_t: "male" | "female" | "non_binary" | "other"
      like_status_t: "pending" | "matched" | "rejected"
      relationship_goal_t:
        | "serious"
        | "marriage"
        | "friendship"
        | "casual"
        | "open"
      tribe_importance_t:
        | "very_important"
        | "somewhat_important"
        | "not_important"
        | "open_to_all"
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
      gender_t: ["male", "female", "non_binary", "other"],
      like_status_t: ["pending", "matched", "rejected"],
      relationship_goal_t: [
        "serious",
        "marriage",
        "friendship",
        "casual",
        "open",
      ],
      tribe_importance_t: [
        "very_important",
        "somewhat_important",
        "not_important",
        "open_to_all",
      ],
    },
  },
} as const
