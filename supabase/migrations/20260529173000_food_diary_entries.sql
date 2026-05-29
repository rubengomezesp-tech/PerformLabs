-- Free-form food diary entries (Smart Add / manual), separate from plan meals.
-- Read/written through the service client (RLS enabled, no public policies).

create table if not exists public.food_diary_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  name text not null,
  source text not null default 'smart_add',
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  calories numeric,
  created_at timestamptz not null default now()
);

create index if not exists food_diary_entries_day_idx on public.food_diary_entries (member_profile_id, logged_on);

alter table public.food_diary_entries enable row level security;
