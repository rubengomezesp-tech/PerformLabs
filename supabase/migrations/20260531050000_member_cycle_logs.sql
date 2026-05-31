-- Optional member period / cycle tracker: one row per logged day.
-- Read/written through the service client (RLS enabled, no public policies),
-- consistent with member_meal_logs / member_nutrition_daily_logs / member_habit_logs.
-- Lets a member log the start of a period plus flow + symptoms, and see history.

create table if not exists public.member_cycle_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  -- 'period_start' marks day 1 of a cycle (used to compute cycle length / next predicted date);
  -- 'spotting' / 'symptom' are lighter same-day notes.
  entry_type text not null default 'period_start' check (entry_type in ('period_start', 'spotting', 'symptom')),
  flow text check (flow in ('light', 'medium', 'heavy')),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_profile_id, logged_on)
);

create index if not exists member_cycle_logs_member_date_idx
  on public.member_cycle_logs (member_profile_id, logged_on desc);

create index if not exists member_cycle_logs_workspace_idx
  on public.member_cycle_logs (workspace_id);

alter table public.member_cycle_logs enable row level security;
