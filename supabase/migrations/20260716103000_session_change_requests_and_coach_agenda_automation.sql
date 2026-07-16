-- Member-initiated session changes and a durable, idempotent coach agenda digest.
-- Requests never mutate a booked session directly: the coach must approve them.

create table public.personal_training_session_change_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  session_id uuid not null references public.personal_training_sessions(id) on delete cascade,
  requested_starts_at timestamptz not null,
  requested_ends_at timestamptz not null,
  timezone text not null default 'UTC',
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'cancelled')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_training_change_request_time_order
    check (requested_ends_at > requested_starts_at),
  constraint personal_training_change_request_duration
    check (requested_ends_at - requested_starts_at <= interval '4 hours')
);

create unique index personal_training_change_requests_one_pending_idx
  on public.personal_training_session_change_requests (session_id)
  where status = 'pending';
create index personal_training_change_requests_coach_queue_idx
  on public.personal_training_session_change_requests (workspace_id, status, created_at);
create index personal_training_change_requests_member_idx
  on public.personal_training_session_change_requests (member_profile_id, created_at desc);

alter table public.personal_training_session_change_requests enable row level security;

create policy "team reads session change requests"
  on public.personal_training_session_change_requests for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "members read own session change requests"
  on public.personal_training_session_change_requests for select to authenticated
  using (exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
      and member.user_id = (select auth.uid())
  ));

create policy "members request own session changes"
  on public.personal_training_session_change_requests for insert to authenticated
  with check (
    status = 'pending'
    and resolved_by is null
    and resolved_at is null
    and exists (
      select 1
      from public.member_profiles member
      join public.personal_training_sessions session
        on session.id = personal_training_session_change_requests.session_id
       and session.workspace_id = personal_training_session_change_requests.workspace_id
       and session.member_profile_id = personal_training_session_change_requests.member_profile_id
      where member.id = personal_training_session_change_requests.member_profile_id
        and member.workspace_id = personal_training_session_change_requests.workspace_id
        and member.user_id = (select auth.uid())
        and session.status = 'scheduled'
        and session.starts_at > now()
    )
  );

revoke all on table public.personal_training_session_change_requests from anon, authenticated;
grant select, insert on table public.personal_training_session_change_requests to authenticated;
grant all on table public.personal_training_session_change_requests to service_role;

-- The configuration row is the source of truth for whether the automation is active.
create table public.coach_agenda_automation_configs (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  timezone text not null default 'America/New_York',
  delivery_hour smallint not null default 22 check (delivery_hour between 0 and 23),
  recipient_email text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_agenda_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  local_date date not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  session_count integer not null default 0,
  pending_change_count integer not null default 0,
  provider_message_id text,
  error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, local_date)
);

alter table public.coach_agenda_automation_configs enable row level security;
alter table public.coach_agenda_digest_deliveries enable row level security;

create policy "team reads coach agenda automation"
  on public.coach_agenda_automation_configs for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));
create policy "team reads coach agenda deliveries"
  on public.coach_agenda_digest_deliveries for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

revoke all on table public.coach_agenda_automation_configs from public, anon, authenticated;
revoke all on table public.coach_agenda_digest_deliveries from public, anon, authenticated;
grant select on table public.coach_agenda_automation_configs to authenticated;
grant select on table public.coach_agenda_digest_deliveries to authenticated;
grant all on table public.coach_agenda_automation_configs to service_role;
grant all on table public.coach_agenda_digest_deliveries to service_role;

create or replace function public.claim_coach_agenda_digest(
  p_workspace_id uuid,
  p_local_date date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_delivery_id uuid;
begin
  insert into public.coach_agenda_digest_deliveries (workspace_id, local_date)
  values (p_workspace_id, p_local_date)
  on conflict (workspace_id, local_date) do update
    set status = 'sending',
        attempt_count = public.coach_agenda_digest_deliveries.attempt_count + 1,
        error_code = null,
        updated_at = now()
    where public.coach_agenda_digest_deliveries.status = 'failed'
      and public.coach_agenda_digest_deliveries.attempt_count < 5
  returning id into v_delivery_id;

  return v_delivery_id;
end;
$$;

revoke all on function public.claim_coach_agenda_digest(uuid, date)
  from public, anon, authenticated;
grant execute on function public.claim_coach_agenda_digest(uuid, date)
  to service_role;

-- RG Coach: active every day at 22:00 Miami time.
insert into public.coach_agenda_automation_configs (
  workspace_id, timezone, delivery_hour, recipient_email, enabled
) values (
  '83a83c28-7baa-48b5-9ca3-22634e030fd4',
  'America/New_York',
  22,
  'rubengomezesp@gmail.com',
  true
)
on conflict (workspace_id) do update
set timezone = excluded.timezone,
    delivery_hour = excluded.delivery_hour,
    recipient_email = excluded.recipient_email,
    enabled = true,
    updated_at = now();
