create table if not exists public.workout_session_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  day_id uuid references public.workout_template_days(id) on delete set null,
  session_date date not null default current_date,
  status text not null default 'completed' check (status in ('planned', 'completed', 'partial', 'skipped')),
  perceived_effort int check (perceived_effort between 1 and 10),
  duration_minutes int check (duration_minutes between 0 and 360),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_log_id uuid not null references public.workout_session_logs(id) on delete cascade,
  template_exercise_id uuid references public.workout_template_exercises(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  set_number int not null check (set_number between 1 and 20),
  planned_reps text,
  actual_reps int check (actual_reps between 0 and 300),
  weight_kg numeric(7,2) check (weight_kg >= 0),
  rir numeric(4,1) check (rir >= 0 and rir <= 10),
  rpe numeric(4,1) check (rpe >= 0 and rpe <= 10),
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists workout_session_logs_workspace_date_idx
  on public.workout_session_logs (workspace_id, session_date desc);

create index if not exists workout_session_logs_member_date_idx
  on public.workout_session_logs (member_profile_id, session_date desc);

create index if not exists workout_set_logs_session_idx
  on public.workout_set_logs (session_log_id, set_number);

alter table public.workout_session_logs enable row level security;
alter table public.workout_set_logs enable row level security;

drop policy if exists "workspace team can manage workout session logs" on public.workout_session_logs;
create policy "workspace team can manage workout session logs"
on public.workout_session_logs for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "workspace team can manage workout set logs" on public.workout_set_logs;
create policy "workspace team can manage workout set logs"
on public.workout_set_logs for all
using (
  exists (
    select 1 from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and public.has_workspace_role(session.workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  )
)
with check (
  exists (
    select 1 from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and public.has_workspace_role(session.workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  )
);
