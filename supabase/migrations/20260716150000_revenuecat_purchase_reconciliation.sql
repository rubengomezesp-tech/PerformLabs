-- Persistent RevenueCat identity links and coaching-access periods.
-- A public web checkout starts with a provisional app_user_id. Once that ID is
-- matched to a member, every later renewal, billing issue and expiration can be
-- resolved without another manual step.

create table public.revenuecat_customer_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  app_user_id text not null,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  customer_email text,
  assignment_source text not null default 'automatic'
    check (assignment_source in ('automatic', 'manual', 'direct_id', 'email')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, app_user_id)
);

create index revenuecat_customer_links_member_idx
  on public.revenuecat_customer_links (workspace_id, member_profile_id);

create table public.member_coaching_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  source text not null default 'revenuecat' check (source in ('revenuecat', 'manual')),
  product_identifier text not null,
  external_transaction_id text not null,
  original_transaction_id text,
  revenuecat_app_user_id text,
  customer_email text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'cancelled', 'expired', 'refunded', 'void')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source, external_transaction_id)
);

create index member_coaching_access_member_idx
  on public.member_coaching_access (workspace_id, member_profile_id, status, ends_at desc);
create index member_coaching_access_pending_idx
  on public.member_coaching_access (workspace_id, revenuecat_app_user_id, created_at desc)
  where member_profile_id is null and source = 'revenuecat';

alter table public.revenuecat_customer_links enable row level security;
alter table public.member_coaching_access enable row level security;

create policy "team reads RevenueCat customer links"
  on public.revenuecat_customer_links for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "members read own coaching access, team reads workspace"
  on public.member_coaching_access for select to authenticated
  using (
    exists (
      select 1 from public.member_profiles member
      where member.id = member_profile_id
        and member.workspace_id = workspace_id
        and member.user_id = (select auth.uid())
    )
    or (select private.has_workspace_role(
      workspace_id,
      array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
    ))
  );

revoke all on table public.revenuecat_customer_links from anon, authenticated;
revoke all on table public.member_coaching_access from anon, authenticated;
grant select on table public.revenuecat_customer_links to authenticated;
grant select on table public.member_coaching_access to authenticated;
grant all on table public.revenuecat_customer_links to service_role;
grant all on table public.member_coaching_access to service_role;

create or replace function public.assign_revenuecat_purchase(
  p_workspace_id uuid,
  p_event_id text,
  p_member_profile_id uuid,
  p_actor_user_id uuid
)
returns table (assigned_events integer, assigned_packs integer, assigned_access integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.revenuecat_webhook_events%rowtype;
  v_pack record;
  v_events integer := 0;
  v_packs integer := 0;
  v_access integer := 0;
begin
  if not exists (
    select 1 from public.member_profiles member
    where member.id = p_member_profile_id
      and member.workspace_id = p_workspace_id
  ) then
    raise exception 'Member does not belong to workspace';
  end if;

  select * into v_event
  from public.revenuecat_webhook_events event
  where event.id = p_event_id and event.workspace_id = p_workspace_id
  for update;

  if v_event.id is null then
    raise exception 'RevenueCat event not found';
  end if;

  if v_event.member_profile_id is not null and v_event.member_profile_id <> p_member_profile_id then
    raise exception 'RevenueCat event is already assigned to another member';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(v_event.app_user_id, v_event.id), 0));

  if nullif(trim(v_event.app_user_id), '') is not null then
    insert into public.revenuecat_customer_links (
      workspace_id, app_user_id, member_profile_id, assignment_source, assigned_by
    ) values (
      p_workspace_id, v_event.app_user_id, p_member_profile_id, 'manual', p_actor_user_id
    )
    on conflict (workspace_id, app_user_id) do update
    set member_profile_id = excluded.member_profile_id,
        assignment_source = 'manual',
        assigned_by = excluded.assigned_by,
        updated_at = now();
  end if;

  for v_pack in
    select pack.id
    from public.member_session_packs pack
    where pack.workspace_id = p_workspace_id
      and pack.member_profile_id is null
      and (
        (v_event.app_user_id is not null and pack.revenuecat_app_user_id = v_event.app_user_id)
        or (v_event.transaction_id is not null and pack.external_transaction_id = v_event.transaction_id)
      )
    for update
  loop
    update public.member_session_ledger ledger
    set member_profile_id = p_member_profile_id
    where ledger.pack_id = v_pack.id and ledger.member_profile_id is null;

    update public.member_session_packs pack
    set member_profile_id = p_member_profile_id, updated_at = now()
    where pack.id = v_pack.id;

    insert into public.member_session_ledger (
      workspace_id, member_profile_id, pack_id, event_type, delta,
      external_event_id, note, actor_user_id
    ) values (
      p_workspace_id, p_member_profile_id, v_pack.id, 'pack_assigned', 0,
      'assignment:' || p_event_id || ':' || v_pack.id::text,
      'Compra RevenueCat asignada manualmente', p_actor_user_id
    ) on conflict do nothing;

    v_packs := v_packs + 1;
  end loop;

  update public.member_coaching_access access
  set member_profile_id = p_member_profile_id,
      status = case when access.ends_at <= now() then 'expired' else access.status end,
      updated_at = now()
  where access.workspace_id = p_workspace_id
    and access.member_profile_id is null
    and (
      (v_event.app_user_id is not null and access.revenuecat_app_user_id = v_event.app_user_id)
      or (v_event.transaction_id is not null and access.external_transaction_id = v_event.transaction_id)
    );
  get diagnostics v_access = row_count;

  update public.revenuecat_webhook_events event
  set member_profile_id = p_member_profile_id,
      processing_status = case when event.processing_status = 'pending_assignment' then 'processed' else event.processing_status end,
      processed_at = now()
  where event.workspace_id = p_workspace_id
    and (
      event.id = p_event_id
      or (v_event.app_user_id is not null and event.app_user_id = v_event.app_user_id)
    );
  get diagnostics v_events = row_count;

  if exists (
    select 1 from public.member_coaching_access access
    where access.workspace_id = p_workspace_id
      and access.member_profile_id = p_member_profile_id
      and access.status in ('active', 'past_due', 'cancelled')
      and access.ends_at > now()
  ) then
    update public.member_profiles member
    set subscription_status = 'active', updated_at = now()
    where member.id = p_member_profile_id and member.workspace_id = p_workspace_id;
  end if;

  return query select v_events, v_packs, v_access;
end;
$$;

revoke all on function public.assign_revenuecat_purchase(uuid, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.assign_revenuecat_purchase(uuid, text, uuid, uuid)
  to service_role;
