create table public.member_meal_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  assigned_meal_plan_id uuid references public.assigned_meal_plans(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  logged_on date not null default current_date,
  meal_slot text not null,
  meal_title text not null,
  status text not null default 'done' check (status in ('done', 'skipped', 'swap_requested')),
  satisfaction int check (satisfaction between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, member_profile_id, logged_on, meal_slot)
);

create index member_meal_logs_workspace_date_idx
  on public.member_meal_logs (workspace_id, logged_on desc);

create index member_meal_logs_member_date_idx
  on public.member_meal_logs (member_profile_id, logged_on desc);

create table public.member_nutrition_daily_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  water_glasses int not null default 0 check (water_glasses between 0 and 20),
  hunger_level int check (hunger_level between 1 and 5),
  energy_level int check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, member_profile_id, logged_on)
);

create index member_nutrition_daily_logs_workspace_date_idx
  on public.member_nutrition_daily_logs (workspace_id, logged_on desc);

create index member_nutrition_daily_logs_member_date_idx
  on public.member_nutrition_daily_logs (member_profile_id, logged_on desc);

alter table public.member_meal_logs enable row level security;
alter table public.member_nutrition_daily_logs enable row level security;
