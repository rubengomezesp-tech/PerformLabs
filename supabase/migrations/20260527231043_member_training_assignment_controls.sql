alter table public.assigned_workout_plans
  add column if not exists days_per_week int check (days_per_week between 1 and 7),
  add column if not exists current_month int not null default 1 check (current_month between 1 and 3),
  add column if not exists current_week int not null default 1 check (current_week between 1 and 12),
  add column if not exists assignment_goal text,
  add column if not exists assignment_notes text,
  add column if not exists next_review_on date,
  add column if not exists review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'changes_requested', 'completed')),
  add column if not exists assigned_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists assigned_workout_plans_member_status_idx
  on public.assigned_workout_plans (member_profile_id, status, created_at desc);

create index if not exists assigned_workout_plans_workspace_review_idx
  on public.assigned_workout_plans (workspace_id, next_review_on, review_status);

create table if not exists public.member_training_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  assigned_workout_plan_id uuid references public.assigned_workout_plans(id) on delete set null,
  review_on date not null default current_date,
  reviewed_by uuid references auth.users(id) on delete set null,
  current_month int not null default 1 check (current_month between 1 and 3),
  current_week int not null default 1 check (current_week between 1 and 12),
  adherence_rate numeric(5,2) check (adherence_rate >= 0 and adherence_rate <= 1),
  sessions_completed int not null default 0 check (sessions_completed >= 0),
  planned_sessions int not null default 0 check (planned_sessions >= 0),
  volume_kg numeric(12,2) not null default 0 check (volume_kg >= 0),
  best_set_snapshot jsonb not null default '{}',
  pain_flags int not null default 0 check (pain_flags >= 0),
  coach_notes text,
  decision text not null default 'hold' check (decision in ('progress', 'hold', 'regress', 'deload', 'manual')),
  recommended_days_per_week int check (recommended_days_per_week between 1 and 7),
  next_actions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists member_training_reviews_member_date_idx
  on public.member_training_reviews (member_profile_id, review_on desc);

create index if not exists member_training_reviews_workspace_date_idx
  on public.member_training_reviews (workspace_id, review_on desc);

alter table public.member_training_reviews enable row level security;

drop policy if exists "workspace team can manage training reviews" on public.member_training_reviews;
create policy "workspace team can manage training reviews"
on public.member_training_reviews for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "members can read own training reviews" on public.member_training_reviews;
create policy "members can read own training reviews"
on public.member_training_reviews for select
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_training_reviews.member_profile_id
      and profile.user_id = (select auth.uid())
  )
);
