-- Real personal-training agenda connected to the auditable session-credit ledger.
-- A scheduled appointment reserves one available credit without mutating a pack.
-- Completing, marking a no-show, or cancelling late consumes exactly one credit;
-- an on-time cancellation releases the reservation. Every transition is atomic
-- and idempotent through an external event id.

create table public.personal_training_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  location text,
  member_notes text,
  cancellation_window_hours integer not null default 24
    check (cancellation_window_hours between 0 and 168),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled_on_time', 'cancelled_late', 'no_show')),
  credit_state text not null default 'reserved'
    check (credit_state in ('reserved', 'consumed', 'released')),
  status_changed_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  status_changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_training_sessions_time_order check (ends_at > starts_at),
  constraint personal_training_sessions_status_credit_consistency check (
    (status = 'scheduled' and credit_state = 'reserved')
    or (status in ('completed', 'cancelled_late', 'no_show') and credit_state = 'consumed')
    or (status = 'cancelled_on_time' and credit_state = 'released')
  )
);

create index personal_training_sessions_workspace_start_idx
  on public.personal_training_sessions (workspace_id, starts_at);
create index personal_training_sessions_member_start_idx
  on public.personal_training_sessions (workspace_id, member_profile_id, starts_at desc);
create index personal_training_sessions_reserved_idx
  on public.personal_training_sessions (workspace_id, member_profile_id, starts_at)
  where status = 'scheduled' and credit_state = 'reserved';

create table public.personal_training_session_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  session_id uuid not null references public.personal_training_sessions(id) on delete cascade,
  event_type text not null
    check (event_type in ('scheduled', 'rescheduled', 'completed', 'cancelled_on_time', 'cancelled_late', 'no_show')),
  from_status text,
  to_status text not null,
  external_event_id text not null,
  note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (workspace_id, external_event_id)
);

create index personal_training_session_events_session_created_idx
  on public.personal_training_session_events (session_id, created_at desc);
create index personal_training_session_events_member_created_idx
  on public.personal_training_session_events (workspace_id, member_profile_id, created_at desc);

alter table public.personal_training_sessions enable row level security;
alter table public.personal_training_session_events enable row level security;

create policy "team reads personal training sessions"
  on public.personal_training_sessions for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "members read own personal training sessions"
  on public.personal_training_sessions for select to authenticated
  using (exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
      and member.user_id = (select auth.uid())
  ));

create policy "team reads personal training session events"
  on public.personal_training_session_events for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "members read own personal training session events"
  on public.personal_training_session_events for select to authenticated
  using (exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
      and member.user_id = (select auth.uid())
  ));

revoke all on table public.personal_training_sessions from anon, authenticated;
revoke all on table public.personal_training_session_events from anon, authenticated;
grant select on table public.personal_training_sessions to authenticated;
grant select on table public.personal_training_session_events to authenticated;
grant all on table public.personal_training_sessions to service_role;
grant all on table public.personal_training_session_events to service_role;

create or replace function public.schedule_personal_training_session(
  p_workspace_id uuid,
  p_member_profile_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_timezone text,
  p_location text,
  p_member_notes text,
  p_cancellation_window_hours integer,
  p_actor_user_id uuid,
  p_external_event_id text
)
returns table (session_id uuid, balance integer, reserved integer, available integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_balance integer;
  v_reserved integer;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'Session end must be after its start';
  end if;
  if p_ends_at - p_starts_at > interval '4 hours' then
    raise exception 'Session duration cannot exceed four hours';
  end if;
  if p_cancellation_window_hours is null or p_cancellation_window_hours < 0 or p_cancellation_window_hours > 168 then
    raise exception 'Invalid cancellation window';
  end if;
  if nullif(trim(p_external_event_id), '') is null then
    raise exception 'External event id is required';
  end if;
  if not exists (
    select 1 from public.member_profiles member
    where member.id = p_member_profile_id and member.workspace_id = p_workspace_id
  ) then
    raise exception 'Member does not belong to workspace';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_member_profile_id::text, 0));

  select event.session_id into v_session_id
  from public.personal_training_session_events event
  where event.workspace_id = p_workspace_id
    and event.external_event_id = p_external_event_id;

  select coalesce(sum(pack.remaining_sessions), 0)::integer into v_balance
  from public.member_session_packs pack
  where pack.workspace_id = p_workspace_id
    and pack.member_profile_id = p_member_profile_id
    and pack.status = 'active'
    and pack.remaining_sessions > 0
    and (pack.expires_at is null or pack.expires_at > now());

  select count(*)::integer into v_reserved
  from public.personal_training_sessions session
  where session.workspace_id = p_workspace_id
    and session.member_profile_id = p_member_profile_id
    and session.status = 'scheduled'
    and session.credit_state = 'reserved';

  if v_session_id is not null then
    return query select v_session_id, v_balance, v_reserved, greatest(v_balance - v_reserved, 0);
    return;
  end if;

  if v_balance - v_reserved < 1 then
    raise exception 'Insufficient available session balance';
  end if;

  insert into public.personal_training_sessions (
    workspace_id, member_profile_id, starts_at, ends_at, timezone, location,
    member_notes, cancellation_window_hours, created_by, status_changed_by
  ) values (
    p_workspace_id, p_member_profile_id, p_starts_at, p_ends_at,
    coalesce(nullif(trim(p_timezone), ''), 'UTC'), nullif(trim(p_location), ''),
    nullif(trim(p_member_notes), ''), p_cancellation_window_hours,
    p_actor_user_id, p_actor_user_id
  ) returning id into v_session_id;

  insert into public.personal_training_session_events (
    workspace_id, member_profile_id, session_id, event_type, from_status,
    to_status, external_event_id, actor_user_id,
    metadata
  ) values (
    p_workspace_id, p_member_profile_id, v_session_id, 'scheduled', null,
    'scheduled', p_external_event_id, p_actor_user_id,
    jsonb_build_object('startsAt', p_starts_at, 'endsAt', p_ends_at)
  );

  v_reserved := v_reserved + 1;
  return query select v_session_id, v_balance, v_reserved, greatest(v_balance - v_reserved, 0);
end;
$$;

create or replace function public.transition_personal_training_session(
  p_workspace_id uuid,
  p_session_id uuid,
  p_next_status text,
  p_note text,
  p_actor_user_id uuid,
  p_external_event_id text
)
returns table (session_id uuid, status text, balance integer, reserved integer, available integer, changed boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.personal_training_sessions%rowtype;
  v_pack public.member_session_packs%rowtype;
  v_balance integer;
  v_reserved integer;
  v_changed boolean := true;
  v_credit_state text;
begin
  if p_next_status not in ('completed', 'cancelled_on_time', 'cancelled_late', 'no_show') then
    raise exception 'Invalid session status transition';
  end if;
  if nullif(trim(p_external_event_id), '') is null then
    raise exception 'External event id is required';
  end if;

  select * into v_session
  from public.personal_training_sessions session
  where session.id = p_session_id and session.workspace_id = p_workspace_id
  for update;

  if v_session.id is null then raise exception 'Session not found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_session.member_profile_id::text, 0));

  if exists (
    select 1 from public.personal_training_session_events event
    where event.workspace_id = p_workspace_id
      and event.external_event_id = p_external_event_id
  ) then
    v_changed := false;
  elsif v_session.status <> 'scheduled' then
    raise exception 'Session has already been resolved';
  else
    if p_next_status in ('completed', 'cancelled_late', 'no_show') then
      select pack.* into v_pack
      from public.member_session_packs pack
      where pack.workspace_id = p_workspace_id
        and pack.member_profile_id = v_session.member_profile_id
        and pack.status = 'active'
        and pack.remaining_sessions > 0
        and (pack.expires_at is null or pack.expires_at > now())
      order by pack.expires_at asc nulls last, pack.purchased_at asc, pack.id asc
      for update
      limit 1;

      if v_pack.id is null then raise exception 'Insufficient session balance'; end if;

      update public.member_session_packs pack
      set remaining_sessions = pack.remaining_sessions - 1,
          status = case when pack.remaining_sessions - 1 = 0 then 'exhausted' else 'active' end,
          updated_at = now()
      where pack.id = v_pack.id;

      insert into public.member_session_ledger (
        workspace_id, member_profile_id, pack_id, event_type, delta,
        external_event_id, note, metadata, actor_user_id
      ) values (
        p_workspace_id, v_session.member_profile_id, v_pack.id, 'session_used', -1,
        p_external_event_id, coalesce(nullif(trim(p_note), ''),
          case p_next_status
            when 'completed' then 'Entrenamiento personal realizado'
            when 'no_show' then 'No-show'
            else 'Cancelación tardía'
          end),
        jsonb_build_object('personalTrainingSessionId', v_session.id, 'resolution', p_next_status),
        p_actor_user_id
      );
      v_credit_state := 'consumed';
    else
      v_credit_state := 'released';
    end if;

    update public.personal_training_sessions session
    set status = p_next_status,
        credit_state = v_credit_state,
        status_changed_at = now(),
        status_changed_by = p_actor_user_id,
        updated_at = now()
    where session.id = v_session.id;

    insert into public.personal_training_session_events (
      workspace_id, member_profile_id, session_id, event_type, from_status,
      to_status, external_event_id, note, actor_user_id
    ) values (
      p_workspace_id, v_session.member_profile_id, v_session.id, p_next_status,
      'scheduled', p_next_status, p_external_event_id,
      nullif(trim(p_note), ''), p_actor_user_id
    );

    v_session.status := p_next_status;
  end if;

  select coalesce(sum(pack.remaining_sessions), 0)::integer into v_balance
  from public.member_session_packs pack
  where pack.workspace_id = p_workspace_id
    and pack.member_profile_id = v_session.member_profile_id
    and pack.status = 'active'
    and pack.remaining_sessions > 0
    and (pack.expires_at is null or pack.expires_at > now());

  select count(*)::integer into v_reserved
  from public.personal_training_sessions session
  where session.workspace_id = p_workspace_id
    and session.member_profile_id = v_session.member_profile_id
    and session.status = 'scheduled'
    and session.credit_state = 'reserved';

  return query select v_session.id, v_session.status, v_balance, v_reserved,
    greatest(v_balance - v_reserved, 0), v_changed;
end;
$$;

create or replace function public.reschedule_personal_training_session(
  p_workspace_id uuid,
  p_session_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_timezone text,
  p_location text,
  p_member_notes text,
  p_actor_user_id uuid,
  p_external_event_id text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.personal_training_sessions%rowtype;
begin
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at
    or p_ends_at - p_starts_at > interval '4 hours' then
    raise exception 'Invalid session time range';
  end if;
  if nullif(trim(p_external_event_id), '') is null then
    raise exception 'External event id is required';
  end if;

  select * into v_session
  from public.personal_training_sessions session
  where session.id = p_session_id and session.workspace_id = p_workspace_id
  for update;

  if v_session.id is null then raise exception 'Session not found'; end if;
  if exists (
    select 1 from public.personal_training_session_events event
    where event.workspace_id = p_workspace_id
      and event.external_event_id = p_external_event_id
  ) then
    return v_session.id;
  end if;
  if v_session.status <> 'scheduled' then raise exception 'Only scheduled sessions can be rescheduled'; end if;

  update public.personal_training_sessions session
  set starts_at = p_starts_at,
      ends_at = p_ends_at,
      timezone = coalesce(nullif(trim(p_timezone), ''), session.timezone),
      location = nullif(trim(p_location), ''),
      member_notes = nullif(trim(p_member_notes), ''),
      updated_at = now(),
      status_changed_at = now(),
      status_changed_by = p_actor_user_id
  where session.id = v_session.id;

  insert into public.personal_training_session_events (
    workspace_id, member_profile_id, session_id, event_type, from_status,
    to_status, external_event_id, note, actor_user_id, metadata
  ) values (
    p_workspace_id, v_session.member_profile_id, v_session.id, 'rescheduled',
    'scheduled', 'scheduled', p_external_event_id, null,
    p_actor_user_id,
    jsonb_build_object(
      'previousStartsAt', v_session.starts_at, 'previousEndsAt', v_session.ends_at,
      'startsAt', p_starts_at, 'endsAt', p_ends_at
    )
  );

  return v_session.id;
end;
$$;

revoke all on function public.schedule_personal_training_session(uuid, uuid, timestamptz, timestamptz, text, text, text, integer, uuid, text)
  from public, anon, authenticated;
revoke all on function public.transition_personal_training_session(uuid, uuid, text, text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.reschedule_personal_training_session(uuid, uuid, timestamptz, timestamptz, text, text, text, uuid, text)
  from public, anon, authenticated;

grant execute on function public.schedule_personal_training_session(uuid, uuid, timestamptz, timestamptz, text, text, text, integer, uuid, text)
  to service_role;
grant execute on function public.transition_personal_training_session(uuid, uuid, text, text, uuid, text)
  to service_role;
grant execute on function public.reschedule_personal_training_session(uuid, uuid, timestamptz, timestamptz, text, text, text, uuid, text)
  to service_role;
