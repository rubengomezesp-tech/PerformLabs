alter table public.member_fitness_preferences
  add column if not exists experience_level text,
  add column if not exists training_goal text,
  add column if not exists preferred_training_days text[] not null default '{}',
  add column if not exists cardio_preference text,
  add column if not exists daily_steps_target int,
  add column if not exists sleep_hours numeric(4,2);

alter table public.member_diet_preferences
  add column if not exists diet_style text,
  add column if not exists meals_per_day int,
  add column if not exists preferred_foods text[] not null default '{}',
  add column if not exists disliked_foods text[] not null default '{}',
  add column if not exists cooking_time_minutes int,
  add column if not exists budget_level text;

create table if not exists public.member_onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  goal text,
  training_days_per_week int,
  training_location text,
  session_minutes int,
  meals_per_day int,
  activity_level numeric(4,3),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'reviewed', 'applied')),
  onboarding_payload jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_profile_id)
);

create index if not exists member_onboarding_responses_workspace_status_idx
  on public.member_onboarding_responses (workspace_id, status, submitted_at desc);

create index if not exists member_onboarding_responses_member_idx
  on public.member_onboarding_responses (member_profile_id, submitted_at desc);

alter table public.member_onboarding_responses enable row level security;

drop policy if exists "workspace team can manage member onboarding responses" on public.member_onboarding_responses;
create policy "workspace team can manage member onboarding responses"
on public.member_onboarding_responses
for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "members can read own onboarding responses" on public.member_onboarding_responses;
create policy "members can read own onboarding responses"
on public.member_onboarding_responses
for select
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.user_id = (select auth.uid())
  )
);

drop policy if exists "members can submit own onboarding responses" on public.member_onboarding_responses;
create policy "members can submit own onboarding responses"
on public.member_onboarding_responses
for insert
with check (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.workspace_id = member_onboarding_responses.workspace_id
      and profile.user_id = (select auth.uid())
  )
);

drop policy if exists "members can update own onboarding responses" on public.member_onboarding_responses;
create policy "members can update own onboarding responses"
on public.member_onboarding_responses
for update
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.workspace_id = member_onboarding_responses.workspace_id
      and profile.user_id = (select auth.uid())
  )
);
