-- Durable, idempotent post-purchase communications for RG Coach.
-- RevenueCat remains the payment source of truth. This queue records only the
-- transactional confirmation and coach alert that must follow a live purchase.

create table public.revenuecat_purchase_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id text not null references public.revenuecat_webhook_events(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  audience text not null check (audience in ('customer', 'coach')),
  delivery_type text not null check (delivery_type in ('purchase_confirmation', 'coach_purchase_alert')),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, audience)
);

create index revenuecat_purchase_deliveries_due_idx
  on public.revenuecat_purchase_deliveries (status, next_attempt_at, created_at)
  where status in ('pending', 'failed', 'sending');

create index revenuecat_purchase_deliveries_workspace_idx
  on public.revenuecat_purchase_deliveries (workspace_id, created_at desc);

alter table public.revenuecat_purchase_deliveries enable row level security;

create policy "team reads RevenueCat purchase deliveries"
  on public.revenuecat_purchase_deliveries for select to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

revoke all on table public.revenuecat_purchase_deliveries from public, anon, authenticated;
grant select on table public.revenuecat_purchase_deliveries to authenticated;
grant all on table public.revenuecat_purchase_deliveries to service_role;

create or replace function public.claim_revenuecat_purchase_deliveries(p_limit integer default 20)
returns setof public.revenuecat_purchase_deliveries
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select delivery.id
    from public.revenuecat_purchase_deliveries delivery
    where delivery.attempt_count < 5
      and (
        (delivery.status in ('pending', 'failed') and delivery.next_attempt_at <= now())
        or (delivery.status = 'sending' and delivery.claimed_at < now() - interval '15 minutes')
      )
    order by delivery.next_attempt_at asc, delivery.created_at asc
    for update skip locked
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
  ), claimed as (
    update public.revenuecat_purchase_deliveries delivery
    set status = 'sending',
        attempt_count = delivery.attempt_count + 1,
        claimed_at = now(),
        updated_at = now(),
        last_error = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_revenuecat_purchase_deliveries(integer)
  from public, anon, authenticated;
grant execute on function public.claim_revenuecat_purchase_deliveries(integer)
  to service_role;
