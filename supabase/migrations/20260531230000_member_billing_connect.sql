-- Member -> Coach billing (Phase 1 of the monetization model).
-- Members subscribe to their coach via a Direct charge on the coach's connected
-- Stripe account; PerformLabs takes a 25% application fee on every member payment.
--
-- Additive + idempotent: only `add column if not exists` / `create table if not
-- exists`, so re-running is safe. Mirrors 20260530140000_stripe_billing.sql: the
-- new ledger and the existing member_subscriptions stay service-role only (RLS on,
-- no public policies; the service role bypasses RLS).

-- 1) Where the member's Stripe customer lives (on the coach's connected account).
alter table public.member_profiles
  add column if not exists stripe_customer_id text;
comment on column public.member_profiles.stripe_customer_id is
  'Stripe customer id on the coach''s connected account (Direct charges). Nullable until the member first checks out.';

-- 2) Extend member_subscriptions (table already exists from 0001) with the
--    Connect/Direct-charge fields we need to mirror the live Stripe subscription.
alter table public.member_subscriptions
  add column if not exists workspace_id uuid,
  add column if not exists coach_client_plan_id uuid,
  add column if not exists stripe_account_id text,
  add column if not exists stripe_price_id text,
  add column if not exists application_fee_percent numeric,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists amount integer,
  add column if not exists currency text,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.member_subscriptions.workspace_id is 'Coach workspace the subscription belongs to.';
comment on column public.member_subscriptions.coach_client_plan_id is 'coach_client_plans.id the member subscribed to.';
comment on column public.member_subscriptions.stripe_account_id is 'Connected account (acct_...) the Direct charge runs on.';
comment on column public.member_subscriptions.stripe_price_id is 'Stripe price id (on the connected account) being billed.';
comment on column public.member_subscriptions.application_fee_percent is 'Platform application fee percent applied to each invoice (default 25).';
comment on column public.member_subscriptions.cancel_at_period_end is 'Whether the subscription is set to cancel at period end.';

-- Upsert key for webhook reconciliation. Partial so the legacy rows that never
-- had a Stripe subscription id do not collide on NULL.
create unique index if not exists member_subscriptions_stripe_sub_idx
  on public.member_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- member_subscriptions has no public policies (service-role only). It predates
-- this migration; ensure RLS is enabled regardless.
alter table public.member_subscriptions enable row level security;

-- 3) Earnings ledger: one row per paid member invoice, keyed by the Stripe
--    invoice id so a duplicate webhook delivery is a no-op (insert conflict).
create table if not exists public.platform_fee_events (
  id text primary key,
  workspace_id uuid,
  member_profile_id uuid,
  stripe_account_id text,
  stripe_subscription_id text,
  amount_total integer,
  application_fee_amount integer,
  currency text,
  status text,
  created_at timestamptz not null default now()
);
comment on table public.platform_fee_events is
  'Append-only earnings ledger: one row per paid member invoice (id = Stripe invoice id) recording the 25% platform application fee. Service-role only.';
comment on column public.platform_fee_events.amount_total is 'Invoice amount paid, in the smallest currency unit (cents).';
comment on column public.platform_fee_events.application_fee_amount is 'Platform application fee collected for this invoice, in cents.';

create index if not exists platform_fee_events_workspace_idx on public.platform_fee_events (workspace_id, created_at desc);
create index if not exists platform_fee_events_subscription_idx on public.platform_fee_events (stripe_subscription_id);

-- Service-role only, mirroring stripe_billing.sql (RLS on, no public policies).
alter table public.platform_fee_events enable row level security;
