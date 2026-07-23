-- Auditable session-credit accounting for RG Coach and other workspaces.
-- Packs are mutable projections of the remaining balance; the ledger is
-- append-only and explains every purchase, use, refund, assignment, or manual
-- correction. All writes go through service-role RPCs after application auth.

create table public.member_session_packs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  source text not null default 'manual'
    check (source in ('manual', 'revenuecat')),
  product_identifier text not null,
  external_transaction_id text,
  revenuecat_app_user_id text,
  customer_email text,
  total_sessions integer not null check (total_sessions > 0 and total_sessions <= 500),
  remaining_sessions integer not null
    check (remaining_sessions >= 0 and remaining_sessions <= total_sessions),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'exhausted', 'refunded', 'void')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source, external_transaction_id)
);

create index member_session_packs_member_balance_idx
  on public.member_session_packs (workspace_id, member_profile_id, status, expires_at);

create index member_session_packs_pending_revenuecat_idx
  on public.member_session_packs (workspace_id, revenuecat_app_user_id, purchased_at desc)
  where member_profile_id is null and source = 'revenuecat';

create table public.member_session_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  pack_id uuid references public.member_session_packs(id) on delete set null,
  event_type text not null
    check (event_type in (
      'purchase', 'session_used', 'coach_credit', 'coach_debit',
      'refund', 'pack_assigned', 'void'
    )),
  delta integer not null check (delta between -500 and 500),
  external_event_id text,
  note text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index member_session_ledger_external_event_idx
  on public.member_session_ledger (workspace_id, external_event_id)
  where external_event_id is not null;

create index member_session_ledger_member_created_idx
  on public.member_session_ledger (workspace_id, member_profile_id, created_at desc);

create table public.revenuecat_webhook_events (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  app_user_id text,
  event_type text not null,
  product_identifier text,
  transaction_id text,
  environment text,
  processing_status text not null
    check (processing_status in ('processed', 'pending_assignment', 'ignored', 'failed')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  error_message text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index revenuecat_webhook_events_workspace_created_idx
  on public.revenuecat_webhook_events (workspace_id, created_at desc);

alter table public.member_session_packs enable row level security;
alter table public.member_session_ledger enable row level security;
alter table public.revenuecat_webhook_events enable row level security;

create policy "members read own session packs"
  on public.member_session_packs for select to authenticated
  using (exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
      and member.user_id = (select auth.uid())
  ));

create policy "team reads session packs"
  on public.member_session_packs for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "members read own session ledger"
  on public.member_session_ledger for select to authenticated
  using (exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
      and member.user_id = (select auth.uid())
  ));

create policy "team reads session ledger"
  on public.member_session_ledger for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "team reads revenuecat events"
  on public.revenuecat_webhook_events for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

revoke all on table public.member_session_packs from anon, authenticated;
revoke all on table public.member_session_ledger from anon, authenticated;
revoke all on table public.revenuecat_webhook_events from anon, authenticated;
grant select on table public.member_session_packs to authenticated;
grant select on table public.member_session_ledger to authenticated;
grant select on table public.revenuecat_webhook_events to authenticated;
grant all on table public.member_session_packs to service_role;
grant all on table public.member_session_ledger to service_role;
grant all on table public.revenuecat_webhook_events to service_role;

create or replace function public.adjust_member_session_balance(
  p_workspace_id uuid,
  p_member_profile_id uuid,
  p_delta integer,
  p_event_type text,
  p_note text,
  p_expires_at timestamptz,
  p_actor_user_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pack record;
  v_pack_id uuid;
  v_to_consume integer;
  v_take integer;
  v_available integer;
  v_balance integer;
begin
  if p_delta = 0 or abs(p_delta) > 500 then
    raise exception 'Session adjustment must be between -500 and 500 and cannot be zero';
  end if;

  if p_event_type not in ('session_used', 'coach_credit', 'coach_debit') then
    raise exception 'Invalid session adjustment event type';
  end if;

  if not exists (
    select 1 from public.member_profiles member
    where member.id = p_member_profile_id
      and member.workspace_id = p_workspace_id
  ) then
    raise exception 'Member does not belong to workspace';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_member_profile_id::text, 0));

  if p_delta > 0 then
    insert into public.member_session_packs (
      workspace_id, member_profile_id, source, product_identifier,
      total_sessions, remaining_sessions, expires_at, created_by
    ) values (
      p_workspace_id, p_member_profile_id, 'manual', 'manual_adjustment',
      p_delta, p_delta, p_expires_at, p_actor_user_id
    ) returning id into v_pack_id;

    insert into public.member_session_ledger (
      workspace_id, member_profile_id, pack_id, event_type, delta, note, actor_user_id
    ) values (
      p_workspace_id, p_member_profile_id, v_pack_id, p_event_type, p_delta,
      nullif(trim(p_note), ''), p_actor_user_id
    );
  else
    select coalesce(sum(pack.remaining_sessions), 0)::integer
      into v_available
    from public.member_session_packs pack
    where pack.workspace_id = p_workspace_id
      and pack.member_profile_id = p_member_profile_id
      and pack.status = 'active'
      and pack.remaining_sessions > 0
      and (pack.expires_at is null or pack.expires_at > now());

    v_to_consume := abs(p_delta);
    if v_available < v_to_consume then
      raise exception 'Insufficient session balance';
    end if;

    for v_pack in
      select pack.id, pack.remaining_sessions
      from public.member_session_packs pack
      where pack.workspace_id = p_workspace_id
        and pack.member_profile_id = p_member_profile_id
        and pack.status = 'active'
        and pack.remaining_sessions > 0
        and (pack.expires_at is null or pack.expires_at > now())
      order by pack.expires_at asc nulls last, pack.purchased_at asc, pack.id asc
      for update
    loop
      exit when v_to_consume = 0;
      v_take := least(v_pack.remaining_sessions, v_to_consume);

      update public.member_session_packs pack
      set remaining_sessions = pack.remaining_sessions - v_take,
          status = case when pack.remaining_sessions - v_take = 0 then 'exhausted' else 'active' end,
          updated_at = now()
      where pack.id = v_pack.id;

      insert into public.member_session_ledger (
        workspace_id, member_profile_id, pack_id, event_type, delta, note, actor_user_id
      ) values (
        p_workspace_id, p_member_profile_id, v_pack.id, p_event_type, -v_take,
        nullif(trim(p_note), ''), p_actor_user_id
      );

      v_to_consume := v_to_consume - v_take;
    end loop;
  end if;

  select coalesce(sum(pack.remaining_sessions), 0)::integer
    into v_balance
  from public.member_session_packs pack
  where pack.workspace_id = p_workspace_id
    and pack.member_profile_id = p_member_profile_id
    and pack.status = 'active'
    and pack.remaining_sessions > 0
    and (pack.expires_at is null or pack.expires_at > now());

  return v_balance;
end;
$$;

create or replace function public.record_revenuecat_session_purchase(
  p_workspace_id uuid,
  p_member_profile_id uuid,
  p_product_identifier text,
  p_external_transaction_id text,
  p_external_event_id text,
  p_revenuecat_app_user_id text,
  p_customer_email text,
  p_total_sessions integer,
  p_purchased_at timestamptz,
  p_expires_at timestamptz,
  p_metadata jsonb
)
returns table (pack_id uuid, created boolean, assigned boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pack_id uuid;
  v_existing_member uuid;
begin
  if p_total_sessions <= 0 or p_total_sessions > 500 then
    raise exception 'Invalid session pack size';
  end if;
  if nullif(trim(p_external_transaction_id), '') is null then
    raise exception 'RevenueCat transaction id is required';
  end if;
  if p_member_profile_id is not null and not exists (
    select 1 from public.member_profiles member
    where member.id = p_member_profile_id and member.workspace_id = p_workspace_id
  ) then
    raise exception 'Member does not belong to workspace';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_external_transaction_id, 0));

  select pack.id, pack.member_profile_id
    into v_pack_id, v_existing_member
  from public.member_session_packs pack
  where pack.workspace_id = p_workspace_id
    and pack.source = 'revenuecat'
    and pack.external_transaction_id = p_external_transaction_id;

  if v_pack_id is not null then
    if v_existing_member is null and p_member_profile_id is not null then
      update public.member_session_packs pack
      set member_profile_id = p_member_profile_id,
          customer_email = coalesce(pack.customer_email, nullif(lower(trim(p_customer_email)), '')),
          updated_at = now()
      where pack.id = v_pack_id;
      update public.member_session_ledger ledger
      set member_profile_id = p_member_profile_id
      where ledger.pack_id = v_pack_id and ledger.member_profile_id is null;
      v_existing_member := p_member_profile_id;
    end if;
    return query select v_pack_id, false, v_existing_member is not null;
    return;
  end if;

  insert into public.member_session_packs (
    workspace_id, member_profile_id, source, product_identifier,
    external_transaction_id, revenuecat_app_user_id, customer_email,
    total_sessions, remaining_sessions, purchased_at, expires_at, metadata
  ) values (
    p_workspace_id, p_member_profile_id, 'revenuecat', p_product_identifier,
    p_external_transaction_id, p_revenuecat_app_user_id,
    nullif(lower(trim(p_customer_email)), ''), p_total_sessions, p_total_sessions,
    coalesce(p_purchased_at, now()), p_expires_at, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_pack_id;

  insert into public.member_session_ledger (
    workspace_id, member_profile_id, pack_id, event_type, delta,
    external_event_id, metadata
  ) values (
    p_workspace_id, p_member_profile_id, v_pack_id, 'purchase', p_total_sessions,
    p_external_event_id, coalesce(p_metadata, '{}'::jsonb)
  );

  return query select v_pack_id, true, p_member_profile_id is not null;
end;
$$;

create or replace function public.refund_revenuecat_session_purchase(
  p_workspace_id uuid,
  p_external_transaction_id text,
  p_external_event_id text,
  p_metadata jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pack public.member_session_packs%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_external_transaction_id, 0));
  select * into v_pack
  from public.member_session_packs pack
  where pack.workspace_id = p_workspace_id
    and pack.source = 'revenuecat'
    and pack.external_transaction_id = p_external_transaction_id
  for update;

  if v_pack.id is null then return false; end if;
  if v_pack.status = 'refunded' then return true; end if;

  update public.member_session_packs pack
  set remaining_sessions = 0, status = 'refunded', updated_at = now()
  where pack.id = v_pack.id;

  if v_pack.remaining_sessions > 0 then
    insert into public.member_session_ledger (
      workspace_id, member_profile_id, pack_id, event_type, delta,
      external_event_id, metadata
    ) values (
      p_workspace_id, v_pack.member_profile_id, v_pack.id, 'refund',
      -v_pack.remaining_sessions, p_external_event_id, coalesce(p_metadata, '{}'::jsonb)
    ) on conflict do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.adjust_member_session_balance(uuid, uuid, integer, text, text, timestamptz, uuid)
  from public, anon, authenticated;
revoke all on function public.record_revenuecat_session_purchase(uuid, uuid, text, text, text, text, text, integer, timestamptz, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.refund_revenuecat_session_purchase(uuid, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.adjust_member_session_balance(uuid, uuid, integer, text, text, timestamptz, uuid)
  to service_role;
grant execute on function public.record_revenuecat_session_purchase(uuid, uuid, text, text, text, text, text, integer, timestamptz, timestamptz, jsonb)
  to service_role;
grant execute on function public.refund_revenuecat_session_purchase(uuid, text, text, jsonb)
  to service_role;
