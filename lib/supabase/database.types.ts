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
      ai_usage_events: {
        Row: {
          cache_read_tokens: number
          cache_write_tokens: number
          cost_usd: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          member_profile_id: string | null
          model: string
          output_tokens: number
          workspace_id: string
        }
        Insert: {
          cache_read_tokens?: number
          cache_write_tokens?: number
          cost_usd?: number
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          member_profile_id?: string | null
          model: string
          output_tokens?: number
          workspace_id: string
        }
        Update: {
          cache_read_tokens?: number
          cache_write_tokens?: number
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          member_profile_id?: string | null
          model?: string
          output_tokens?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          starts_at: string | null
          target_route: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          target_route?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string | null
          target_route?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_banners_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_message_reads: {
        Row: {
          app_message_id: string
          id: string
          member_profile_id: string
          read_at: string
          workspace_id: string
        }
        Insert: {
          app_message_id: string
          id?: string
          member_profile_id: string
          read_at?: string
          workspace_id: string
        }
        Update: {
          app_message_id?: string
          id?: string
          member_profile_id?: string
          read_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_message_reads_app_message_id_fkey"
            columns: ["app_message_id"]
            isOneToOne: false
            referencedRelation: "app_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_message_reads_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_message_reads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_messages: {
        Row: {
          audience_filter: Json
          body: Json
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["plan_status"]
          target_route: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          audience_filter?: Json
          body?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_route?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          audience_filter?: Json
          body?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_route?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_pages: {
        Row: {
          content_page_id: string | null
          created_at: string
          id: string
          is_external: boolean
          is_system: boolean
          menu_area: string
          page_type: string
          route: string
          sort_order: number
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content_page_id?: string | null
          created_at?: string
          id?: string
          is_external?: boolean
          is_system?: boolean
          menu_area?: string
          page_type: string
          route: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content_page_id?: string | null
          created_at?: string
          id?: string
          is_external?: boolean
          is_system?: boolean
          menu_area?: string
          page_type?: string
          route?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_pages_content_page_id_fkey"
            columns: ["content_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
          workspace_id: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
          workspace_id: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_meal_plan_days: {
        Row: {
          assigned_meal_plan_id: string
          created_at: string
          day_number: number
          id: string
          member_profile_id: string
          notes: string | null
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_meal_plan_id: string
          created_at?: string
          day_number: number
          id?: string
          member_profile_id: string
          notes?: string | null
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_meal_plan_id?: string
          created_at?: string
          day_number?: number
          id?: string
          member_profile_id?: string
          notes?: string | null
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_meal_plan_days_assigned_meal_plan_id_fkey"
            columns: ["assigned_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plan_days_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plan_days_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_meal_plan_items: {
        Row: {
          assigned_meal_plan_day_id: string
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          id: string
          instructions: string | null
          meal_slot: string
          member_profile_id: string
          protein_g: number | null
          recipe_id: string | null
          serving_multiplier: number
          sort_order: number
          swap_options: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_meal_plan_day_id: string
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          instructions?: string | null
          meal_slot: string
          member_profile_id: string
          protein_g?: number | null
          recipe_id?: string | null
          serving_multiplier?: number
          sort_order?: number
          swap_options?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_meal_plan_day_id?: string
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          instructions?: string | null
          meal_slot?: string
          member_profile_id?: string
          protein_g?: number | null
          recipe_id?: string | null
          serving_multiplier?: number
          sort_order?: number
          swap_options?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_meal_plan_items_assigned_meal_plan_day_id_fkey"
            columns: ["assigned_meal_plan_day_id"]
            isOneToOne: false
            referencedRelation: "assigned_meal_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plan_items_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plan_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_meal_plans: {
        Row: {
          coach_notes: string | null
          created_at: string
          ends_on: string | null
          fiber_target_g: number | null
          formula_snapshot: Json
          generation_status: Database["public"]["Enums"]["plan_generation_status"]
          hide_macros: boolean
          id: string
          meals_per_day: number | null
          member_notes: string | null
          member_profile_id: string
          name: string
          next_review_on: string | null
          review_status: string
          sodium_target_mg: number | null
          source_template_id: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["plan_status"]
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          updated_at: string
          version: number
          water_target_ml: number | null
          workspace_id: string
        }
        Insert: {
          coach_notes?: string | null
          created_at?: string
          ends_on?: string | null
          fiber_target_g?: number | null
          formula_snapshot?: Json
          generation_status?: Database["public"]["Enums"]["plan_generation_status"]
          hide_macros?: boolean
          id?: string
          meals_per_day?: number | null
          member_notes?: string | null
          member_profile_id: string
          name: string
          next_review_on?: string | null
          review_status?: string
          sodium_target_mg?: number | null
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string
          version?: number
          water_target_ml?: number | null
          workspace_id: string
        }
        Update: {
          coach_notes?: string | null
          created_at?: string
          ends_on?: string | null
          fiber_target_g?: number | null
          formula_snapshot?: Json
          generation_status?: Database["public"]["Enums"]["plan_generation_status"]
          hide_macros?: boolean
          id?: string
          meals_per_day?: number | null
          member_notes?: string | null
          member_profile_id?: string
          name?: string
          next_review_on?: string | null
          review_status?: string
          sodium_target_mg?: number | null
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string
          version?: number
          water_target_ml?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_meal_plans_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plans_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "diet_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_meal_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_workout_days: {
        Row: {
          assigned_workout_plan_id: string
          completed_at: string | null
          created_at: string
          day_number: number
          estimated_minutes: number | null
          focus: string | null
          id: string
          instructions: string | null
          member_profile_id: string
          month_number: number
          scheduled_on: string | null
          source_template_day_id: string | null
          status: string
          title: string
          updated_at: string
          week_number: number
          workspace_id: string
        }
        Insert: {
          assigned_workout_plan_id: string
          completed_at?: string | null
          created_at?: string
          day_number: number
          estimated_minutes?: number | null
          focus?: string | null
          id?: string
          instructions?: string | null
          member_profile_id: string
          month_number: number
          scheduled_on?: string | null
          source_template_day_id?: string | null
          status?: string
          title: string
          updated_at?: string
          week_number: number
          workspace_id: string
        }
        Update: {
          assigned_workout_plan_id?: string
          completed_at?: string | null
          created_at?: string
          day_number?: number
          estimated_minutes?: number | null
          focus?: string | null
          id?: string
          instructions?: string | null
          member_profile_id?: string
          month_number?: number
          scheduled_on?: string | null
          source_template_day_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          week_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_workout_days_assigned_workout_plan_id_fkey"
            columns: ["assigned_workout_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_days_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_days_source_template_day_id_fkey"
            columns: ["source_template_day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_days_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_workout_exercises: {
        Row: {
          assigned_workout_day_id: string
          block_type: string
          created_at: string
          exercise_id: string | null
          id: string
          load_guidance: string | null
          member_profile_id: string
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number
          source_template_exercise_id: string | null
          swap_options: Json
          target_rir: string | null
          tempo: string | null
          title: string
          updated_at: string
          video_url: string | null
          workspace_id: string
        }
        Insert: {
          assigned_workout_day_id: string
          block_type?: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          load_guidance?: string | null
          member_profile_id: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          source_template_exercise_id?: string | null
          swap_options?: Json
          target_rir?: string | null
          tempo?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          workspace_id: string
        }
        Update: {
          assigned_workout_day_id?: string
          block_type?: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          load_guidance?: string | null
          member_profile_id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          source_template_exercise_id?: string | null
          swap_options?: Json
          target_rir?: string | null
          tempo?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_workout_exercises_assigned_workout_day_id_fkey"
            columns: ["assigned_workout_day_id"]
            isOneToOne: false
            referencedRelation: "assigned_workout_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_exercises_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_exercises_source_template_exercise_id_fkey"
            columns: ["source_template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_exercises_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_workout_plans: {
        Row: {
          algorithm_snapshot: Json
          assigned_by: string | null
          assignment_goal: string | null
          assignment_notes: string | null
          coach_notes: string | null
          created_at: string
          current_month: number
          current_week: number
          days_per_week: number | null
          ends_on: string | null
          generation_status: Database["public"]["Enums"]["plan_generation_status"]
          id: string
          member_notes: string | null
          member_profile_id: string
          name: string
          next_review_on: string | null
          review_status: string
          source_template_id: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          algorithm_snapshot?: Json
          assigned_by?: string | null
          assignment_goal?: string | null
          assignment_notes?: string | null
          coach_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          days_per_week?: number | null
          ends_on?: string | null
          generation_status?: Database["public"]["Enums"]["plan_generation_status"]
          id?: string
          member_notes?: string | null
          member_profile_id: string
          name: string
          next_review_on?: string | null
          review_status?: string
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          algorithm_snapshot?: Json
          assigned_by?: string | null
          assignment_goal?: string | null
          assignment_notes?: string | null
          coach_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          days_per_week?: number | null
          ends_on?: string | null
          generation_status?: Database["public"]["Enums"]["plan_generation_status"]
          id?: string
          member_notes?: string | null
          member_profile_id?: string
          name?: string
          next_review_on?: string | null
          review_status?: string
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_workout_plans_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_plans_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workout_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          member_profile_id: string
          workspace_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          member_profile_id: string
          workspace_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          member_profile_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          ends_on: string
          goal: number
          id: string
          metric: string
          starts_on: string
          status: string
          title: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          ends_on?: string
          goal?: number
          id?: string
          metric?: string
          starts_on?: string
          status?: string
          title: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          ends_on?: string
          goal?: number
          id?: string
          metric?: string
          starts_on?: string
          status?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_answers: {
        Row: {
          answer: Json
          checkin_id: string
          created_at: string
          id: string
          member_profile_id: string
          question_key: string
          workspace_id: string
        }
        Insert: {
          answer?: Json
          checkin_id: string
          created_at?: string
          id?: string
          member_profile_id: string
          question_key: string
          workspace_id: string
        }
        Update: {
          answer?: Json
          checkin_id?: string
          created_at?: string
          id?: string
          member_profile_id?: string
          question_key?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_answers_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "customer_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_answers_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_answers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_templates: {
        Row: {
          cadence: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          questions: Json
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          questions?: Json
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          questions?: Json
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_ai_brains: {
        Row: {
          assistant_name: string
          created_at: string
          enabled: boolean
          forbidden: string
          greeting: string
          id: string
          persona: string
          rules: string
          specialties: string
          substitutions: string
          tone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assistant_name?: string
          created_at?: string
          enabled?: boolean
          forbidden?: string
          greeting?: string
          id?: string
          persona?: string
          rules?: string
          specialties?: string
          substitutions?: string
          tone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assistant_name?: string
          created_at?: string
          enabled?: boolean
          forbidden?: string
          greeting?: string
          id?: string
          persona?: string
          rules?: string
          specialties?: string
          substitutions?: string
          tone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_ai_brains_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          member_profile_id: string | null
          role: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          member_profile_id?: string | null
          role: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          member_profile_id?: string | null
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_ai_messages_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_ai_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_ai_plan_drafts: {
        Row: {
          approved_at: string | null
          brief: Json
          content: Json
          created_at: string
          id: string
          kind: string
          status: string
          template_id: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          brief?: Json
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          status?: string
          template_id?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          brief?: Json
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          status?: string
          template_id?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_ai_plan_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_ai_plan_drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_plans: {
        Row: {
          active: boolean
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          name: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          workspace_id: string
        }
        Insert: {
          active?: boolean
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          name: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          workspace_id: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          name?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_member_notes: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_pinned: boolean
          member_profile_id: string
          note_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          member_profile_id: string
          note_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          member_profile_id?: string
          note_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_member_notes_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_member_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          member_profile_id: string
          post_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_profile_id: string
          post_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_profile_id?: string
          post_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          is_coach: boolean
          member_profile_id: string | null
          pinned: boolean
          status: string
          workspace_id: string
        }
        Insert: {
          author_name?: string
          body: string
          created_at?: string
          id?: string
          is_coach?: boolean
          member_profile_id?: string | null
          pinned?: boolean
          status?: string
          workspace_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_coach?: boolean
          member_profile_id?: string | null
          pinned?: boolean
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          amount_off_cents: number | null
          code: string
          created_at: string
          currency: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          percent_off: number | null
          stripe_coupon_id: string | null
          workspace_id: string
        }
        Insert: {
          amount_off_cents?: number | null
          code: string
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          percent_off?: number | null
          stripe_coupon_id?: string | null
          workspace_id: string
        }
        Update: {
          amount_off_cents?: number | null
          code?: string
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          percent_off?: number | null
          stripe_coupon_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_checkins: {
        Row: {
          created_at: string
          id: string
          key_values: Json
          member_profile_id: string
          photos_available: boolean
          results_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_values?: Json
          member_profile_id: string
          photos_available?: boolean
          results_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_values?: Json
          member_profile_id?: string
          photos_available?: boolean
          results_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_checkins_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_checkins_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_template_meals: {
        Row: {
          day_number: number
          diet_template_id: string
          id: string
          meal_slot: string
          recipe_id: string
          serving_multiplier: number
          sort_order: number
        }
        Insert: {
          day_number: number
          diet_template_id: string
          id?: string
          meal_slot: string
          recipe_id: string
          serving_multiplier?: number
          sort_order?: number
        }
        Update: {
          day_number?: number
          diet_template_id?: string
          id?: string
          meal_slot?: string
          recipe_id?: string
          serving_multiplier?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_template_meals_diet_template_id_fkey"
            columns: ["diet_template_id"]
            isOneToOne: false
            referencedRelation: "diet_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_template_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_templates: {
        Row: {
          calories_max: number | null
          calories_min: number | null
          carbs_ratio: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          fat_ratio: number | null
          formula_id: string | null
          goal: string | null
          id: string
          name: string
          protein_ratio: number | null
          status: Database["public"]["Enums"]["plan_status"]
          tags: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          calories_max?: number | null
          calories_min?: number | null
          carbs_ratio?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          fat_ratio?: number | null
          formula_id?: string | null
          goal?: string | null
          id?: string
          name: string
          protein_ratio?: number | null
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          calories_max?: number | null
          calories_min?: number | null
          carbs_ratio?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          fat_ratio?: number | null
          formula_id?: string | null
          goal?: string | null
          id?: string
          name?: string
          protein_ratio?: number | null
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "diet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_templates_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "nutrition_formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_videos: {
        Row: {
          created_at: string
          created_by: string | null
          exercise_id: string
          id: string
          is_default: boolean
          thumbnail_url: string | null
          title: string
          video_url: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exercise_id: string
          id?: string
          is_default?: boolean
          thumbnail_url?: string | null
          title: string
          video_url: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exercise_id?: string
          id?: string
          is_default?: boolean
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_videos_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_videos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          default_video_url: string | null
          difficulty: string | null
          equipment: string[]
          force_type: string | null
          id: string
          image_urls: Json
          instructions: string | null
          is_base_library: boolean
          locations: string[]
          mechanic: string | null
          movement_category: string | null
          muscle_groups: string[]
          name: string
          secondary_muscle_groups: string[]
          slug: string
          source_dataset: string | null
          source_id: string | null
          source_license: string | null
          source_url: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          default_video_url?: string | null
          difficulty?: string | null
          equipment?: string[]
          force_type?: string | null
          id?: string
          image_urls?: Json
          instructions?: string | null
          is_base_library?: boolean
          locations?: string[]
          mechanic?: string | null
          movement_category?: string | null
          muscle_groups?: string[]
          name: string
          secondary_muscle_groups?: string[]
          slug: string
          source_dataset?: string | null
          source_id?: string | null
          source_license?: string | null
          source_url?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          default_video_url?: string | null
          difficulty?: string | null
          equipment?: string[]
          force_type?: string | null
          id?: string
          image_urls?: Json
          instructions?: string | null
          is_base_library?: boolean
          locations?: string[]
          mechanic?: string | null
          movement_category?: string | null
          muscle_groups?: string[]
          name?: string
          secondary_muscle_groups?: string[]
          slug?: string
          source_dataset?: string | null
          source_id?: string | null
          source_license?: string | null
          source_url?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      food_diary_entries: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          id: string
          logged_on: string
          member_profile_id: string
          name: string
          protein_g: number | null
          source: string
          workspace_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          logged_on?: string
          member_profile_id: string
          name: string
          protein_g?: number | null
          source?: string
          workspace_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          logged_on?: string
          member_profile_id?: string
          name?: string
          protein_g?: number | null
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_diary_entries_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_diary_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      food_library_items: {
        Row: {
          brand: string | null
          calories: number
          carbs_g: number
          category: string
          created_at: string
          fat_g: number
          id: string
          name: string
          protein_g: number
          serving_label: string
          sort_order: number
          verified: boolean
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          calories?: number
          carbs_g?: number
          category?: string
          created_at?: string
          fat_g?: number
          id?: string
          name: string
          protein_g?: number
          serving_label?: string
          sort_order?: number
          verified?: boolean
          workspace_id: string
        }
        Update: {
          brand?: string | null
          calories?: number
          carbs_g?: number
          category?: string
          created_at?: string
          fat_g?: number
          id?: string
          name?: string
          protein_g?: number
          serving_label?: string
          sort_order?: number
          verified?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_library_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_projects: {
        Row: {
          assigned_agent: string | null
          client_email: string
          client_name: string
          created_at: string
          id: string
          launch_target_date: string | null
          lead_id: string | null
          project_name: string
          status: string
          template_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          client_email: string
          client_name: string
          created_at?: string
          id?: string
          launch_target_date?: string | null
          lead_id?: string | null
          project_name: string
          status?: string
          template_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          client_email?: string
          client_name?: string
          created_at?: string
          id?: string
          launch_target_date?: string | null
          lead_id?: string | null
          project_name?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementation_projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "implementation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_template_brief_defaults: {
        Row: {
          brand_notes: string | null
          content_notes: string | null
          domain_strategy: string
          exercise_video_notes: string | null
          internal_risks: string | null
          launch_notes: string | null
          legal_notes: string | null
          logo_status: string
          nutrition_notes: string | null
          offer_summary: string | null
          payment_provider: string | null
          pricing_notes: string | null
          target_audience: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          brand_notes?: string | null
          content_notes?: string | null
          domain_strategy?: string
          exercise_video_notes?: string | null
          internal_risks?: string | null
          launch_notes?: string | null
          legal_notes?: string | null
          logo_status?: string
          nutrition_notes?: string | null
          offer_summary?: string | null
          payment_provider?: string | null
          pricing_notes?: string | null
          target_audience?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          brand_notes?: string | null
          content_notes?: string | null
          domain_strategy?: string
          exercise_video_notes?: string | null
          internal_risks?: string | null
          launch_notes?: string | null
          legal_notes?: string | null
          logo_status?: string
          nutrition_notes?: string | null
          offer_summary?: string | null
          payment_provider?: string | null
          pricing_notes?: string | null
          target_audience?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_template_brief_defaults_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "implementation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_template_tasks: {
        Row: {
          created_at: string
          day_offset: number
          description: string | null
          id: string
          phase: string
          sort_order: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          day_offset?: number
          description?: string | null
          id?: string
          phase: string
          sort_order?: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          day_offset?: number
          description?: string | null
          id?: string
          phase?: string
          sort_order?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "implementation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_templates: {
        Row: {
          buyer_type: string | null
          created_at: string
          description: string | null
          estimated_days: number
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          buyer_type?: string | null
          created_at?: string
          description?: string | null
          estimated_days?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          buyer_type?: string | null
          created_at?: string
          description?: string | null
          estimated_days?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ingredient_substitutions: {
        Row: {
          conversion_ratio: number
          created_at: string
          id: string
          ingredient_id: string
          reason: string | null
          substitute_ingredient_id: string
          tags: string[]
          workspace_id: string | null
        }
        Insert: {
          conversion_ratio?: number
          created_at?: string
          id?: string
          ingredient_id: string
          reason?: string | null
          substitute_ingredient_id: string
          tags?: string[]
          workspace_id?: string | null
        }
        Update: {
          conversion_ratio?: number
          created_at?: string
          id?: string
          ingredient_id?: string
          reason?: string | null
          substitute_ingredient_id?: string
          tags?: string[]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_substitutions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_substitute_ingredient_id_fkey"
            columns: ["substitute_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_substitutions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          allergens: string[]
          calories_per_100g: number
          carbs_per_100g: number
          created_at: string
          fat_per_100g: number
          id: string
          is_base_library: boolean
          name: string
          protein_per_100g: number
          slug: string
          tags: string[]
          workspace_id: string | null
        }
        Insert: {
          allergens?: string[]
          calories_per_100g: number
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          id?: string
          is_base_library?: boolean
          name: string
          protein_per_100g?: number
          slug: string
          tags?: string[]
          workspace_id?: string | null
        }
        Update: {
          allergens?: string[]
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          id?: string
          is_base_library?: boolean
          name?: string
          protein_per_100g?: number
          slug?: string
          tags?: string[]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_name: string
          created_at: string
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          author_name?: string
          created_at?: string
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          owner_user_id: string | null
          purpose: string | null
          storage_path: string
          workspace_id: string | null
        }
        Insert: {
          bucket: string
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          owner_user_id?: string | null
          purpose?: string | null
          storage_path: string
          workspace_id?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          owner_user_id?: string | null
          purpose?: string | null
          storage_path?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_activity_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          member_profile_id: string
          metadata: Json
          occurred_at: string
          source: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          member_profile_id: string
          metadata?: Json
          occurred_at?: string
          source?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          member_profile_id?: string
          metadata?: Json
          occurred_at?: string
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_events_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_devices: {
        Row: {
          created_at: string
          endpoint: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          member_profile_id: string
          platform: string
          push_token: string | null
          subscription: Json
          updated_at: string
          user_agent: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          member_profile_id: string
          platform: string
          push_token?: string | null
          subscription?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          member_profile_id?: string
          platform?: string
          push_token?: string | null
          subscription?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_devices_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_devices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_diet_preferences: {
        Row: {
          allergies: string[]
          budget_level: string | null
          cooking_time_minutes: number | null
          created_at: string
          diet_category_ids: string[]
          diet_style: string | null
          disliked_foods: string[]
          disliked_ingredient_ids: string[]
          hide_macros: boolean
          id: string
          meals_per_day: number | null
          member_profile_id: string
          preferred_foods: string[]
          updated_at: string
        }
        Insert: {
          allergies?: string[]
          budget_level?: string | null
          cooking_time_minutes?: number | null
          created_at?: string
          diet_category_ids?: string[]
          diet_style?: string | null
          disliked_foods?: string[]
          disliked_ingredient_ids?: string[]
          hide_macros?: boolean
          id?: string
          meals_per_day?: number | null
          member_profile_id: string
          preferred_foods?: string[]
          updated_at?: string
        }
        Update: {
          allergies?: string[]
          budget_level?: string | null
          cooking_time_minutes?: number | null
          created_at?: string
          diet_category_ids?: string[]
          diet_style?: string | null
          disliked_foods?: string[]
          disliked_ingredient_ids?: string[]
          hide_macros?: boolean
          id?: string
          meals_per_day?: number | null
          member_profile_id?: string
          preferred_foods?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_diet_preferences_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: true
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_fitness_preferences: {
        Row: {
          available_equipment: string[]
          cardio_preference: string | null
          created_at: string
          daily_steps_target: number | null
          days_per_week: number | null
          experience_level: string | null
          id: string
          injuries: string[]
          location: string | null
          member_profile_id: string
          preferred_training_days: string[]
          session_minutes: number | null
          sleep_hours: number | null
          training_goal: string | null
          updated_at: string
        }
        Insert: {
          available_equipment?: string[]
          cardio_preference?: string | null
          created_at?: string
          daily_steps_target?: number | null
          days_per_week?: number | null
          experience_level?: string | null
          id?: string
          injuries?: string[]
          location?: string | null
          member_profile_id: string
          preferred_training_days?: string[]
          session_minutes?: number | null
          sleep_hours?: number | null
          training_goal?: string | null
          updated_at?: string
        }
        Update: {
          available_equipment?: string[]
          cardio_preference?: string | null
          created_at?: string
          daily_steps_target?: number | null
          days_per_week?: number | null
          experience_level?: string | null
          id?: string
          injuries?: string[]
          location?: string | null
          member_profile_id?: string
          preferred_training_days?: string[]
          session_minutes?: number | null
          sleep_hours?: number | null
          training_goal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_fitness_preferences_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: true
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_food_favorites: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          member_profile_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          member_profile_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          member_profile_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_food_favorites_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_food_favorites_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_food_favorites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_habit_logs: {
        Row: {
          count: number
          created_at: string
          habit_id: string
          id: string
          logged_on: string
          member_profile_id: string
          workspace_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          habit_id: string
          id?: string
          logged_on?: string
          member_profile_id: string
          workspace_id: string
        }
        Update: {
          count?: number
          created_at?: string
          habit_id?: string
          id?: string
          logged_on?: string
          member_profile_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "member_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_habit_logs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_habit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_habits: {
        Row: {
          archived: boolean
          cadence: string
          created_at: string
          icon: string | null
          id: string
          is_suggested: boolean
          member_profile_id: string | null
          name: string
          sort_order: number
          target_per_day: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived?: boolean
          cadence?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_suggested?: boolean
          member_profile_id?: string | null
          name: string
          sort_order?: number
          target_per_day?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived?: boolean
          cadence?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_suggested?: boolean
          member_profile_id?: string | null
          name?: string
          sort_order?: number
          target_per_day?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_habits_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_habits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          member_profile_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          member_profile_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          member_profile_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_meal_logs: {
        Row: {
          assigned_meal_plan_id: string | null
          created_at: string
          id: string
          logged_on: string
          meal_slot: string
          meal_title: string
          member_profile_id: string | null
          notes: string | null
          recipe_id: string | null
          satisfaction: number | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_meal_plan_id?: string | null
          created_at?: string
          id?: string
          logged_on?: string
          meal_slot: string
          meal_title: string
          member_profile_id?: string | null
          notes?: string | null
          recipe_id?: string | null
          satisfaction?: number | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_meal_plan_id?: string | null
          created_at?: string
          id?: string
          logged_on?: string
          meal_slot?: string
          meal_title?: string
          member_profile_id?: string | null
          notes?: string | null
          recipe_id?: string | null
          satisfaction?: number | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_meal_logs_assigned_meal_plan_id_fkey"
            columns: ["assigned_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_meal_logs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_meal_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_meal_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_nutrition_daily_logs: {
        Row: {
          created_at: string
          energy_level: number | null
          hunger_level: number | null
          id: string
          logged_on: string
          member_profile_id: string | null
          notes: string | null
          updated_at: string
          water_glasses: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          hunger_level?: number | null
          id?: string
          logged_on?: string
          member_profile_id?: string | null
          notes?: string | null
          updated_at?: string
          water_glasses?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          hunger_level?: number | null
          id?: string
          logged_on?: string
          member_profile_id?: string | null
          notes?: string | null
          updated_at?: string
          water_glasses?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_nutrition_daily_logs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_nutrition_daily_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_onboarding_responses: {
        Row: {
          activity_level: number | null
          created_at: string
          goal: string | null
          id: string
          meals_per_day: number | null
          member_profile_id: string
          onboarding_payload: Json
          reviewed_at: string | null
          session_minutes: number | null
          status: string
          submitted_at: string
          training_days_per_week: number | null
          training_location: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activity_level?: number | null
          created_at?: string
          goal?: string | null
          id?: string
          meals_per_day?: number | null
          member_profile_id: string
          onboarding_payload?: Json
          reviewed_at?: string | null
          session_minutes?: number | null
          status?: string
          submitted_at?: string
          training_days_per_week?: number | null
          training_location?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activity_level?: number | null
          created_at?: string
          goal?: string | null
          id?: string
          meals_per_day?: number | null
          member_profile_id?: string
          onboarding_payload?: Json
          reviewed_at?: string | null
          session_minutes?: number | null
          status?: string
          submitted_at?: string
          training_days_per_week?: number | null
          training_location?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_onboarding_responses_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: true
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_onboarding_responses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          activity_level: number
          birth_date: string | null
          coach_user_id: string | null
          created_at: string
          full_name: string
          goal: string | null
          height_cm: number | null
          id: string
          onboarding_status: string
          phone: string | null
          sex: string | null
          starting_weight_kg: number | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_level?: number
          birth_date?: string | null
          coach_user_id?: string | null
          created_at?: string
          full_name: string
          goal?: string | null
          height_cm?: number | null
          id?: string
          onboarding_status?: string
          phone?: string | null
          sex?: string | null
          starting_weight_kg?: number | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_level?: number
          birth_date?: string | null
          coach_user_id?: string | null
          created_at?: string
          full_name?: string
          goal?: string | null
          height_cm?: number | null
          id?: string
          onboarding_status?: string
          phone?: string | null
          sex?: string | null
          starting_weight_kg?: number | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          member_profile_id: string
          pricing_plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          member_profile_id: string
          pricing_plan_id?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          member_profile_id?: string
          pricing_plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_subscriptions_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_training_reviews: {
        Row: {
          adherence_rate: number | null
          assigned_workout_plan_id: string | null
          best_set_snapshot: Json
          coach_notes: string | null
          created_at: string
          current_month: number
          current_week: number
          decision: string
          id: string
          member_profile_id: string
          next_actions: string[]
          pain_flags: number
          planned_sessions: number
          recommended_days_per_week: number | null
          review_on: string
          reviewed_by: string | null
          sessions_completed: number
          volume_kg: number
          workspace_id: string
        }
        Insert: {
          adherence_rate?: number | null
          assigned_workout_plan_id?: string | null
          best_set_snapshot?: Json
          coach_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          decision?: string
          id?: string
          member_profile_id: string
          next_actions?: string[]
          pain_flags?: number
          planned_sessions?: number
          recommended_days_per_week?: number | null
          review_on?: string
          reviewed_by?: string | null
          sessions_completed?: number
          volume_kg?: number
          workspace_id: string
        }
        Update: {
          adherence_rate?: number | null
          assigned_workout_plan_id?: string | null
          best_set_snapshot?: Json
          coach_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          decision?: string
          id?: string
          member_profile_id?: string
          next_actions?: string[]
          pain_flags?: number
          planned_sessions?: number
          recommended_days_per_week?: number | null
          review_on?: string
          reviewed_by?: string | null
          sessions_completed?: number
          volume_kg?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_training_reviews_assigned_workout_plan_id_fkey"
            columns: ["assigned_workout_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_training_reviews_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_training_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: string
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          member_profile_id: string | null
          payload: Json
          provider: string | null
          provider_message_id: string | null
          queued_at: string
          recipient: string | null
          scheduled_notification_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          subject: string | null
          template_id: string | null
          workspace_id: string
        }
        Insert: {
          channel: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          member_profile_id?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          recipient?: string | null
          scheduled_notification_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          subject?: string | null
          template_id?: string | null
          workspace_id: string
        }
        Update: {
          channel?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          member_profile_id?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          recipient?: string | null
          scheduled_notification_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          subject?: string | null
          template_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_scheduled_notification_id_fkey"
            columns: ["scheduled_notification_id"]
            isOneToOne: false
            referencedRelation: "scheduled_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: Json
          channel: string
          created_at: string
          event_key: string
          id: string
          is_enabled: boolean
          subject: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          body?: Json
          channel: string
          created_at?: string
          event_key: string
          id?: string
          is_enabled?: boolean
          subject?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          body?: Json
          channel?: string
          created_at?: string
          event_key?: string
          id?: string
          is_enabled?: boolean
          subject?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_calculation_runs: {
        Row: {
          assigned_meal_plan_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          formula_id: string | null
          goal: string
          id: string
          input_snapshot: Json
          member_profile_id: string
          output_snapshot: Json
          status: Database["public"]["Enums"]["plan_generation_status"]
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          workspace_id: string
        }
        Insert: {
          assigned_meal_plan_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          formula_id?: string | null
          goal: string
          id?: string
          input_snapshot?: Json
          member_profile_id: string
          output_snapshot?: Json
          status?: Database["public"]["Enums"]["plan_generation_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          workspace_id: string
        }
        Update: {
          assigned_meal_plan_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          formula_id?: string | null
          goal?: string
          id?: string
          input_snapshot?: Json
          member_profile_id?: string
          output_snapshot?: Json
          status?: Database["public"]["Enums"]["plan_generation_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_calculation_runs_assigned_meal_plan_id_fkey"
            columns: ["assigned_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_calculation_runs_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "nutrition_formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_calculation_runs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_calculation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_formulas: {
        Row: {
          config: Json
          created_at: string
          formula_type: string
          id: string
          is_default: boolean
          name: string
          slug: string
          workspace_id: string | null
        }
        Insert: {
          config: Json
          created_at?: string
          formula_type: string
          id?: string
          is_default?: boolean
          name: string
          slug: string
          workspace_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          formula_type?: string
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_formulas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          price_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          id: string
          name: string
          price_cents: number
          product_id: string
          status: Database["public"]["Enums"]["plan_status"]
          stripe_price_id: string | null
          trial_days: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          billing_interval: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          price_cents: number
          product_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          stripe_price_id?: string | null
          trial_days?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          price_cents?: number
          product_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          stripe_price_id?: string | null
          trial_days?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          included_modules: string[]
          name: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          included_modules?: string[]
          name: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          included_modules?: string[]
          name?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_catalog_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_entries: {
        Row: {
          arms_cm: number | null
          body_fat_percentage: number | null
          calves_cm: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          legs_cm: number | null
          logged_on: string
          member_profile_id: string
          notes: string | null
          shoulders_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arms_cm?: number | null
          body_fat_percentage?: number | null
          calves_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          legs_cm?: number | null
          logged_on: string
          member_profile_id: string
          notes?: string | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arms_cm?: number | null
          body_fat_percentage?: number | null
          calves_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          legs_cm?: number | null
          logged_on?: string
          member_profile_id?: string
          notes?: string | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          photo_type: string
          progress_entry_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_type: string
          progress_entry_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_type?: string
          progress_entry_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_progress_entry_id_fkey"
            columns: ["progress_entry_id"]
            isOneToOne: false
            referencedRelation: "progress_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      project_briefs: {
        Row: {
          accent_color: string | null
          app_name: string | null
          brand_notes: string | null
          content_notes: string | null
          created_at: string
          desired_domain: string | null
          domain_strategy: string
          exercise_video_notes: string | null
          id: string
          internal_risks: string | null
          kickoff_call_at: string | null
          launch_notes: string | null
          legal_notes: string | null
          logo_status: string
          nutrition_notes: string | null
          offer_summary: string | null
          payment_provider: string | null
          pricing_notes: string | null
          primary_color: string | null
          project_id: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          app_name?: string | null
          brand_notes?: string | null
          content_notes?: string | null
          created_at?: string
          desired_domain?: string | null
          domain_strategy?: string
          exercise_video_notes?: string | null
          id?: string
          internal_risks?: string | null
          kickoff_call_at?: string | null
          launch_notes?: string | null
          legal_notes?: string | null
          logo_status?: string
          nutrition_notes?: string | null
          offer_summary?: string | null
          payment_provider?: string | null
          pricing_notes?: string | null
          primary_color?: string | null
          project_id: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          app_name?: string | null
          brand_notes?: string | null
          content_notes?: string | null
          created_at?: string
          desired_domain?: string | null
          domain_strategy?: string
          exercise_video_notes?: string | null
          id?: string
          internal_risks?: string | null
          kickoff_call_at?: string | null
          launch_notes?: string | null
          legal_notes?: string | null
          logo_status?: string
          nutrition_notes?: string | null
          offer_summary?: string | null
          payment_provider?: string | null
          pricing_notes?: string | null
          primary_color?: string | null
          project_id?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_onboarding_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          phase: string
          project_id: string
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: string
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_onboarding_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          enabled: boolean
          endpoint: string
          id: string
          last_notified_at: string | null
          member_profile_id: string | null
          p256dh: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          enabled?: boolean
          endpoint: string
          id?: string
          last_notified_at?: string | null
          member_profile_id?: string | null
          p256dh: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          enabled?: boolean
          endpoint?: string
          id?: string
          last_notified_at?: string | null
          member_profile_id?: string | null
          p256dh?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_alternatives: {
        Row: {
          alternative_recipe_id: string
          created_at: string
          id: string
          priority: number
          reason: string | null
          recipe_id: string
          tags: string[]
          workspace_id: string | null
        }
        Insert: {
          alternative_recipe_id: string
          created_at?: string
          id?: string
          priority?: number
          reason?: string | null
          recipe_id: string
          tags?: string[]
          workspace_id?: string | null
        }
        Update: {
          alternative_recipe_id?: string
          created_at?: string
          id?: string
          priority?: number
          reason?: string | null
          recipe_id?: string
          tags?: string[]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_alternatives_alternative_recipe_id_fkey"
            columns: ["alternative_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_alternatives_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_alternatives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          grams: number
          id: string
          ingredient_id: string
          recipe_id: string
          sort_order: number
        }
        Insert: {
          grams: number
          id?: string
          ingredient_id: string
          recipe_id: string
          sort_order?: number
        }
        Update: {
          grams?: number
          id?: string
          ingredient_id?: string
          recipe_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_base_library: boolean
          meal_slot: string
          name: string
          prep_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["plan_status"]
          tags: string[]
          updated_at: string
          video_url: string | null
          workspace_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_base_library?: boolean
          meal_slot: string
          name: string
          prep_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          updated_at?: string
          video_url?: string | null
          workspace_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_base_library?: boolean
          meal_slot?: string
          name?: string
          prep_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          updated_at?: string
          video_url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "diet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_outreach: {
        Row: {
          acted_at: string | null
          created_at: string
          id: string
          member_profile_id: string
          message: string
          reason: string
          risk_score: number
          status: string
          workspace_id: string
        }
        Insert: {
          acted_at?: string | null
          created_at?: string
          id?: string
          member_profile_id: string
          message: string
          reason?: string
          risk_score?: number
          status?: string
          workspace_id: string
        }
        Update: {
          acted_at?: string | null
          created_at?: string
          id?: string
          member_profile_id?: string
          message?: string
          reason?: string
          risk_score?: number
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_outreach_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          assigned_agent: string | null
          brand_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          main_goal: string | null
          monthly_clients: string | null
          next_action_at: string | null
          notes: string | null
          phone: string | null
          priority: string
          qualification_notes: string | null
          source: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          assigned_agent?: string | null
          brand_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          main_goal?: string | null
          monthly_clients?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          qualification_notes?: string | null
          source?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          assigned_agent?: string | null
          brand_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          main_goal?: string | null
          monthly_clients?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          qualification_notes?: string | null
          source?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          audience_filter: Json
          channel: string
          created_at: string
          delivery_at: string | null
          id: string
          name: string
          payload: Json
          sequence_number: number | null
          status: string
          workspace_id: string
        }
        Insert: {
          audience_filter?: Json
          channel: string
          created_at?: string
          delivery_at?: string | null
          id?: string
          name: string
          payload?: Json
          sequence_number?: number | null
          status?: string
          workspace_id: string
        }
        Update: {
          audience_filter?: Json
          channel?: string
          created_at?: string
          delivery_at?: string | null
          id?: string
          name?: string
          payload?: Json
          sequence_number?: number | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          assigned_meal_plan_id: string | null
          created_at: string
          ends_on: string | null
          id: string
          items: Json
          member_profile_id: string
          starts_on: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_meal_plan_id?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          items?: Json
          member_profile_id: string
          starts_on?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_meal_plan_id?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          items?: Json
          member_profile_id?: string
          starts_on?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_assigned_meal_plan_id_fkey"
            columns: ["assigned_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "assigned_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_accounts: {
        Row: {
          charges_enabled: boolean
          connected_at: string
          country: string | null
          default_currency: string | null
          details_submitted: boolean
          livemode: boolean
          payouts_enabled: boolean
          scope: string | null
          stripe_user_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          charges_enabled?: boolean
          connected_at?: string
          country?: string | null
          default_currency?: string | null
          details_submitted?: boolean
          livemode?: boolean
          payouts_enabled?: boolean
          scope?: string | null
          stripe_user_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          charges_enabled?: boolean
          connected_at?: string
          country?: string | null
          default_currency?: string | null
          details_submitted?: boolean
          livemode?: boolean
          payouts_enabled?: boolean
          scope?: string | null
          stripe_user_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          account_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          account_id?: string | null
          id: string
          payload?: Json | null
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          account_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string
          id: string
          member_profile_id: string
          supplement_id: string
          taken_on: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_profile_id: string
          supplement_id: string
          taken_on?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_profile_id?: string
          supplement_id?: string
          taken_on?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          active: boolean
          created_at: string
          dose: string
          id: string
          name: string
          notes: string
          sort_order: number
          timing: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dose?: string
          id?: string
          name: string
          notes?: string
          sort_order?: number
          timing?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dose?: string
          id?: string
          name?: string
          notes?: string
          sort_order?: number
          timing?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          category: string
          created_at: string
          id: string
          last_message_at: string
          member_profile_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          member_profile_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          member_profile_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: Json
          body: string
          conversation_id: string
          created_at: string
          id: string
          member_profile_id: string | null
          read_at: string | null
          sender_role: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          member_profile_id?: string | null
          read_at?: string | null
          sender_role: string
          workspace_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          member_profile_id?: string | null
          read_at?: string | null
          sender_role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise_alternatives: {
        Row: {
          alternative_exercise_id: string
          created_at: string
          equipment_tags: string[]
          exercise_id: string
          id: string
          injury_tags: string[]
          priority: number
          reason: string | null
          workspace_id: string | null
        }
        Insert: {
          alternative_exercise_id: string
          created_at?: string
          equipment_tags?: string[]
          exercise_id: string
          id?: string
          injury_tags?: string[]
          priority?: number
          reason?: string | null
          workspace_id?: string | null
        }
        Update: {
          alternative_exercise_id?: string
          created_at?: string
          equipment_tags?: string[]
          exercise_id?: string
          id?: string
          injury_tags?: string[]
          priority?: number
          reason?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_alternatives_alternative_exercise_id_fkey"
            columns: ["alternative_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_alternatives_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_alternatives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_logs: {
        Row: {
          created_at: string
          day_id: string | null
          duration_minutes: number | null
          id: string
          member_profile_id: string | null
          notes: string | null
          perceived_effort: number | null
          session_date: string
          status: string
          template_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          day_id?: string | null
          duration_minutes?: number | null
          id?: string
          member_profile_id?: string | null
          notes?: string | null
          perceived_effort?: number | null
          session_date?: string
          status?: string
          template_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          day_id?: string | null
          duration_minutes?: number | null
          id?: string
          member_profile_id?: string | null
          notes?: string | null
          perceived_effort?: number | null
          session_date?: string
          status?: string
          template_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_logs_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          actual_reps: number | null
          completed: boolean
          created_at: string
          exercise_id: string | null
          id: string
          notes: string | null
          planned_reps: string | null
          rir: number | null
          rpe: number | null
          session_log_id: string
          set_number: number
          template_exercise_id: string | null
          weight_kg: number | null
        }
        Insert: {
          actual_reps?: number | null
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          planned_reps?: string | null
          rir?: number | null
          rpe?: number | null
          session_log_id: string
          set_number: number
          template_exercise_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          actual_reps?: number | null
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          notes?: string | null
          planned_reps?: string | null
          rir?: number | null
          rpe?: number | null
          session_log_id?: string
          set_number?: number
          template_exercise_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_session_log_id_fkey"
            columns: ["session_log_id"]
            isOneToOne: false
            referencedRelation: "workout_session_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_set_logs_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          notes: string | null
          sort_order: number
          template_day_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          block_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          sort_order?: number
          template_day_id: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          sort_order?: number
          template_day_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_blocks_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_blocks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_days: {
        Row: {
          day_number: number
          estimated_minutes: number | null
          focus: string | null
          id: string
          intensity: string | null
          month_number: number | null
          notes: string | null
          phase_title: string | null
          template_id: string
          title: string
          week_number: number
        }
        Insert: {
          day_number: number
          estimated_minutes?: number | null
          focus?: string | null
          id?: string
          intensity?: string | null
          month_number?: number | null
          notes?: string | null
          phase_title?: string | null
          template_id: string
          title: string
          week_number?: number
        }
        Update: {
          day_number?: number
          estimated_minutes?: number | null
          focus?: string | null
          id?: string
          intensity?: string | null
          month_number?: number | null
          notes?: string | null
          phase_title?: string | null
          template_id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          block_type: string
          day_id: string
          exercise_id: string
          id: string
          load_guidance: string | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number
          swap_rules: Json
          target_rir: string | null
          tempo: string | null
          video_required: boolean
        }
        Insert: {
          block_type?: string
          day_id: string
          exercise_id: string
          id?: string
          load_guidance?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order: number
          swap_rules?: Json
          target_rir?: string | null
          tempo?: string | null
          video_required?: boolean
        }
        Update: {
          block_type?: string
          day_id?: string
          exercise_id?: string
          id?: string
          load_guidance?: string | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          swap_rules?: Json
          target_rir?: string | null
          tempo?: string | null
          video_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string | null
          days_per_week: number
          duration_weeks: number
          goal: string | null
          id: string
          level: string | null
          name: string
          phase_structure: Json
          rotation_rules: Json
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_per_week: number
          duration_weeks?: number
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          phase_structure?: Json
          rotation_rules?: Json
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_per_week?: number
          duration_weeks?: number
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          phase_structure?: Json
          rotation_rules?: Json
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_domains: {
        Row: {
          created_at: string
          dns_target: string | null
          domain: string
          domain_type: Database["public"]["Enums"]["workspace_domain_type"]
          failure_reason: string | null
          id: string
          is_primary: boolean
          last_checked_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verification_token: string
          verified_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          dns_target?: string | null
          domain: string
          domain_type: Database["public"]["Enums"]["workspace_domain_type"]
          failure_reason?: string | null
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          dns_target?: string | null
          domain?: string
          domain_type?: Database["public"]["Enums"]["workspace_domain_type"]
          failure_reason?: string | null
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_domains_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_entitlements: {
        Row: {
          contract_ref: string | null
          created_at: string
          enforced_at: string | null
          modules: Json
          reason: string | null
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          contract_ref?: string | null
          created_at?: string
          enforced_at?: string | null
          modules?: Json
          reason?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          contract_ref?: string | null
          created_at?: string
          enforced_at?: string | null
          modules?: Json
          reason?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_entitlements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_team_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          accent_color: string
          app_name: string
          created_at: string
          custom_domain: string | null
          fallback_subdomain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          member_domain: string | null
          name: string
          public_domain: string | null
          slug: string
          support_email: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          app_name?: string
          created_at?: string
          custom_domain?: string | null
          fallback_subdomain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          member_domain?: string | null
          name: string
          public_domain?: string | null
          slug: string
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          app_name?: string
          created_at?: string
          custom_domain?: string | null
          fallback_subdomain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          member_domain?: string | null
          name?: string
          public_domain?: string | null
          slug?: string
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_workspace_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["workspace_role"][]
          target_workspace_id: string
        }
        Returns: boolean
      }
      is_platform_owner: { Args: never; Returns: boolean }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      delivery_status: "queued" | "sent" | "delivered" | "failed" | "cancelled"
      entitlement_status:
        | "active"
        | "past_due"
        | "suspended"
        | "revoked"
        | "terminated"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      plan_generation_status:
        | "draft"
        | "generated"
        | "reviewed"
        | "published"
        | "archived"
      plan_status: "draft" | "active" | "archived"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "cancelled"
        | "expired"
      verification_status: "pending" | "verified" | "failed" | "disabled"
      workspace_domain_type:
        | "public_site"
        | "member_app"
        | "fallback"
        | "custom_app"
      workspace_role:
        | "platform_owner"
        | "agency_admin"
        | "coach_admin"
        | "coach_staff"
        | "member"
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
      delivery_status: ["queued", "sent", "delivered", "failed", "cancelled"],
      entitlement_status: [
        "active",
        "past_due",
        "suspended",
        "revoked",
        "terminated",
      ],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      plan_generation_status: [
        "draft",
        "generated",
        "reviewed",
        "published",
        "archived",
      ],
      plan_status: ["draft", "active", "archived"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "paused",
        "cancelled",
        "expired",
      ],
      verification_status: ["pending", "verified", "failed", "disabled"],
      workspace_domain_type: [
        "public_site",
        "member_app",
        "fallback",
        "custom_app",
      ],
      workspace_role: [
        "platform_owner",
        "agency_admin",
        "coach_admin",
        "coach_staff",
        "member",
      ],
    },
  },
} as const
