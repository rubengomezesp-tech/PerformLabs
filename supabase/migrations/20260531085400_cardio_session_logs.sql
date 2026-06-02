-- Member-owned cardio session logs (logged from /app/cardio).
-- RLS enabled; member CRUD own rows, workspace staff manage all.
-- Mirrors the member-owned policy shape used by member_meal_logs /
-- member_habit_logs (private.is_member_profile_owner / private.has_workspace_role).

create table if not exists public.cardio_session_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  modality text not null,
  minutes int,
  intensity text,
  distance_km numeric,
  calories int,
  avg_hr int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cardio_session_logs_member_day_idx
  on public.cardio_session_logs (member_profile_id, logged_on desc);
create index if not exists cardio_session_logs_workspace_idx
  on public.cardio_session_logs (workspace_id);

alter table public.cardio_session_logs enable row level security;

drop policy if exists "workspace team can manage cardio session logs" on public.cardio_session_logs;
create policy "workspace team can manage cardio session logs"
on public.cardio_session_logs for all
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "members can read own cardio session logs" on public.cardio_session_logs;
create policy "members can read own cardio session logs"
on public.cardio_session_logs for select
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can create own cardio session logs" on public.cardio_session_logs;
create policy "members can create own cardio session logs"
on public.cardio_session_logs for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can update own cardio session logs" on public.cardio_session_logs;
create policy "members can update own cardio session logs"
on public.cardio_session_logs for update
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)))
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can delete own cardio session logs" on public.cardio_session_logs;
create policy "members can delete own cardio session logs"
on public.cardio_session_logs for delete
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

grant select, insert, update, delete on public.cardio_session_logs to authenticated, service_role;
