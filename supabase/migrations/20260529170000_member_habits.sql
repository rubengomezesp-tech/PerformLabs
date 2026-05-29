-- Member habit tracker: habit definitions + daily completion logs.
-- Read/written through the service client (RLS enabled, no public policies),
-- consistent with member_meal_logs / member_nutrition_daily_logs.

create table if not exists public.member_habits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  name text not null,
  icon text,
  cadence text not null default 'daily',
  target_per_day int not null default 1,
  sort_order int not null default 0,
  is_suggested boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_habits_member_idx on public.member_habits (member_profile_id, archived);
create index if not exists member_habits_workspace_idx on public.member_habits (workspace_id);

create table if not exists public.member_habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.member_habits(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  logged_on date not null default current_date,
  count int not null default 1,
  created_at timestamptz not null default now(),
  unique (habit_id, logged_on)
);

create index if not exists member_habit_logs_day_idx on public.member_habit_logs (member_profile_id, logged_on);

alter table public.member_habits enable row level security;
alter table public.member_habit_logs enable row level security;
