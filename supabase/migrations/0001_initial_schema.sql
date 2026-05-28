create extension if not exists "pgcrypto";

create type public.workspace_role as enum (
  'platform_owner',
  'agency_admin',
  'coach_admin',
  'coach_staff',
  'member'
);

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired'
);

create type public.plan_status as enum (
  'draft',
  'active',
  'archived'
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  custom_domain text unique,
  support_email text,
  logo_url text,
  accent_color text not null default '#d8bd6b',
  app_name text not null default 'Coach App',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  birth_date date,
  sex text check (sex in ('male', 'female', 'other')),
  height_cm numeric(5,2),
  starting_weight_kg numeric(6,2),
  goal text,
  activity_level numeric(4,2) not null default 1.35,
  subscription_status public.subscription_status not null default 'trialing',
  onboarding_status text not null default 'not_started',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.exercise_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  category_id uuid references public.exercise_categories(id) on delete set null,
  name text not null,
  slug text not null,
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  locations text[] not null default '{}',
  difficulty text,
  instructions text,
  default_video_url text,
  is_base_library boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.exercise_videos (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null,
  video_url text not null,
  thumbnail_url text,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  goal text,
  level text,
  days_per_week int not null,
  status public.plan_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  week_number int not null default 1,
  day_number int not null,
  title text not null,
  notes text,
  unique (template_id, week_number, day_number)
);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.workout_template_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sort_order int not null,
  sets int,
  reps text,
  tempo text,
  rest_seconds int,
  notes text,
  swap_rules jsonb not null default '{}'
);

create table public.diet_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  calories_per_100g numeric(8,2) not null,
  protein_per_100g numeric(8,2) not null default 0,
  carbs_per_100g numeric(8,2) not null default 0,
  fat_per_100g numeric(8,2) not null default 0,
  allergens text[] not null default '{}',
  tags text[] not null default '{}',
  is_base_library boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  category_id uuid references public.diet_categories(id) on delete set null,
  name text not null,
  slug text not null,
  meal_slot text not null,
  instructions text,
  image_url text,
  video_url text,
  tags text[] not null default '{}',
  is_base_library boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  grams numeric(8,2) not null,
  sort_order int not null default 0
);

create table public.nutrition_formulas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  formula_type text not null,
  config jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid references public.diet_categories(id) on delete set null,
  formula_id uuid references public.nutrition_formulas(id) on delete set null,
  name text not null,
  goal text,
  calories_min int,
  calories_max int,
  protein_ratio numeric(5,4),
  carbs_ratio numeric(5,4),
  fat_ratio numeric(5,4),
  tags text[] not null default '{}',
  status public.plan_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diet_template_meals (
  id uuid primary key default gen_random_uuid(),
  diet_template_id uuid not null references public.diet_templates(id) on delete cascade,
  day_number int not null,
  meal_slot text not null,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  serving_multiplier numeric(8,4) not null default 1,
  sort_order int not null default 0
);

create table public.member_diet_preferences (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  diet_category_ids uuid[] not null default '{}',
  disliked_ingredient_ids uuid[] not null default '{}',
  allergies text[] not null default '{}',
  hide_macros boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_profile_id)
);

create table public.member_fitness_preferences (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  location text,
  available_equipment text[] not null default '{}',
  injuries text[] not null default '{}',
  days_per_week int,
  session_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_profile_id)
);

create table public.assigned_workout_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  source_template_id uuid references public.workout_templates(id) on delete set null,
  name text not null,
  starts_on date,
  ends_on date,
  version int not null default 1,
  status public.plan_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.assigned_meal_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  source_template_id uuid references public.diet_templates(id) on delete set null,
  formula_snapshot jsonb not null default '{}',
  name text not null,
  starts_on date,
  ends_on date,
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  version int not null default 1,
  status public.plan_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  logged_on date not null,
  weight_kg numeric(6,2),
  body_fat_percentage numeric(5,2),
  shoulders_cm numeric(6,2),
  arms_cm numeric(6,2),
  chest_cm numeric(6,2),
  waist_cm numeric(6,2),
  hips_cm numeric(6,2),
  legs_cm numeric(6,2),
  calves_cm numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  progress_entry_id uuid not null references public.progress_entries(id) on delete cascade,
  photo_type text not null check (photo_type in ('front', 'side', 'back', 'other')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  slug text not null,
  body jsonb not null default '{}',
  status public.plan_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table public.product_catalog_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  included_modules text[] not null default '{}',
  status public.plan_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id uuid not null references public.product_catalog_items(id) on delete cascade,
  name text not null,
  price_cents int not null,
  currency text not null default 'eur',
  billing_interval text not null,
  trial_days int not null default 0,
  stripe_price_id text,
  status public.plan_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null,
  percent_off numeric(5,2),
  amount_off_cents int,
  currency text,
  max_redemptions int,
  expires_at timestamptz,
  stripe_coupon_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table public.member_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  pricing_plan_id uuid references public.pricing_plans(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status public.subscription_status not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  purpose text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.app_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  route text not null,
  page_type text not null,
  menu_area text not null default 'main',
  sort_order int not null default 0,
  is_external boolean not null default false,
  is_system boolean not null default false,
  status public.plan_status not null default 'draft',
  content_page_id uuid references public.content_pages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, route)
);

create table public.app_banners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  image_url text,
  target_route text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  event_key text not null,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  subject text,
  body jsonb not null default '{}',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, event_key, channel)
);

create table public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  audience_filter jsonb not null default '{}',
  payload jsonb not null default '{}',
  delivery_at timestamptz,
  sequence_number int,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.customer_checkins (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  status text not null default 'submitted',
  photos_available boolean not null default false,
  results_status text,
  key_values jsonb not null default '{}',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.member_profiles enable row level security;
alter table public.exercise_categories enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_videos enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_days enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.diet_categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.nutrition_formulas enable row level security;
alter table public.diet_templates enable row level security;
alter table public.diet_template_meals enable row level security;
alter table public.member_diet_preferences enable row level security;
alter table public.member_fitness_preferences enable row level security;
alter table public.assigned_workout_plans enable row level security;
alter table public.assigned_meal_plans enable row level security;
alter table public.progress_entries enable row level security;
alter table public.progress_photos enable row level security;
alter table public.content_pages enable row level security;
alter table public.app_settings enable row level security;
alter table public.product_catalog_items enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.coupons enable row level security;
alter table public.member_subscriptions enable row level security;
alter table public.media_files enable row level security;
alter table public.app_pages enable row level security;
alter table public.app_banners enable row level security;
alter table public.notification_templates enable row level security;
alter table public.scheduled_notifications enable row level security;
alter table public.customer_checkins enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

create policy "workspace members can read workspace"
on public.workspaces for select
using (public.is_workspace_member(id));

create policy "workspace admins can update workspace"
on public.workspaces for update
using (public.has_workspace_role(id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]));

create policy "memberships visible inside workspace"
on public.workspace_memberships for select
using (public.is_workspace_member(workspace_id));

create policy "coach admins manage libraries"
on public.exercises for all
using (workspace_id is null or public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (workspace_id is null or public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

create policy "members can read exercises"
on public.exercise_videos for select
using (workspace_id is null or public.is_workspace_member(workspace_id));

create policy "members can read content"
on public.content_pages for select
using (public.is_workspace_member(workspace_id));

create policy "coach admins manage content"
on public.content_pages for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

create policy "members can read profiles in workspace"
on public.member_profiles for select
using (public.is_workspace_member(workspace_id));

create policy "members can update own profile"
on public.member_profiles for update
using (user_id = auth.uid() or public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

create policy "workspace members read app settings"
on public.app_settings for select
using (public.is_workspace_member(workspace_id));

create policy "workspace members read app pages"
on public.app_pages for select
using (public.is_workspace_member(workspace_id));

create policy "coach admins manage app pages"
on public.app_pages for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

create policy "coach admins manage products"
on public.product_catalog_items for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]));

create policy "coach admins manage pricing"
on public.pricing_plans for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]));

create policy "workspace members read media"
on public.media_files for select
using (workspace_id is null or public.is_workspace_member(workspace_id));
