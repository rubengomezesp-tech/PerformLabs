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
      assigned_meal_plans: {
        Row: {
          created_at: string
          ends_on: string | null
          formula_snapshot: Json
          id: string
          member_profile_id: string
          name: string
          source_template_id: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["plan_status"]
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          formula_snapshot?: Json
          id?: string
          member_profile_id: string
          name: string
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          formula_snapshot?: Json
          id?: string
          member_profile_id?: string
          name?: string
          source_template_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          version?: number
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
      assigned_workout_plans: {
        Row: {
          assigned_by: string | null
          assignment_goal: string | null
          assignment_notes: string | null
          created_at: string
          current_month: number
          current_week: number
          days_per_week: number | null
          ends_on: string | null
          id: string
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
          assigned_by?: string | null
          assignment_goal?: string | null
          assignment_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          days_per_week?: number | null
          ends_on?: string | null
          id?: string
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
          assigned_by?: string | null
          assignment_goal?: string | null
          assignment_notes?: string | null
          created_at?: string
          current_month?: number
          current_week?: number
          days_per_week?: number | null
          ends_on?: string | null
          id?: string
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
      member_diet_preferences: {
        Row: {
          allergies: string[]
          created_at: string
          diet_category_ids: string[]
          disliked_ingredient_ids: string[]
          hide_macros: boolean
          id: string
          member_profile_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[]
          created_at?: string
          diet_category_ids?: string[]
          disliked_ingredient_ids?: string[]
          hide_macros?: boolean
          id?: string
          member_profile_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[]
          created_at?: string
          diet_category_ids?: string[]
          disliked_ingredient_ids?: string[]
          hide_macros?: boolean
          id?: string
          member_profile_id?: string
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
          created_at: string
          days_per_week: number | null
          id: string
          injuries: string[]
          location: string | null
          member_profile_id: string
          session_minutes: number | null
          updated_at: string
        }
        Insert: {
          available_equipment?: string[]
          created_at?: string
          days_per_week?: number | null
          id?: string
          injuries?: string[]
          location?: string | null
          member_profile_id: string
          session_minutes?: number | null
          updated_at?: string
        }
        Update: {
          available_equipment?: string[]
          created_at?: string
          days_per_week?: number | null
          id?: string
          injuries?: string[]
          location?: string | null
          member_profile_id?: string
          session_minutes?: number | null
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
          slug: string
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
          slug: string
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
          slug?: string
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
      workout_template_days: {
        Row: {
          day_number: number
          id: string
          notes: string | null
          template_id: string
          title: string
          week_number: number
        }
        Insert: {
          day_number: number
          id?: string
          notes?: string | null
          template_id: string
          title: string
          week_number?: number
        }
        Update: {
          day_number?: number
          id?: string
          notes?: string | null
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
          day_id: string
          exercise_id: string
          id: string
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          sort_order: number
          swap_rules: Json
          tempo: string | null
        }
        Insert: {
          day_id: string
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order: number
          swap_rules?: Json
          tempo?: string | null
        }
        Update: {
          day_id?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          sort_order?: number
          swap_rules?: Json
          tempo?: string | null
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
          goal: string | null
          id: string
          level: string | null
          name: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_per_week: number
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_per_week?: number
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
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
      entitlement_status:
        | "active"
        | "past_due"
        | "suspended"
        | "revoked"
        | "terminated"
      plan_status: "draft" | "active" | "archived"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "cancelled"
        | "expired"
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
      entitlement_status: [
        "active",
        "past_due",
        "suspended",
        "revoked",
        "terminated",
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
