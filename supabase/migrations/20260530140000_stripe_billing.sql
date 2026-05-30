-- Stripe Connect (Standard) + platform billing.
-- Workspace-scoped tables written only through the service client (RLS on with
-- no public policies = service-role only; never touched from the browser).

create table if not exists public.stripe_accounts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  stripe_user_id text not null,
  livemode boolean not null default false,
  scope text,
  country text,
  default_currency text,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists stripe_accounts_user_idx on public.stripe_accounts (stripe_user_id);
alter table public.stripe_accounts enable row level security;

create table if not exists public.platform_subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists platform_subscriptions_customer_idx on public.platform_subscriptions (stripe_customer_id);
alter table public.platform_subscriptions enable row level security;

-- Append-only ledger that makes webhook processing idempotent: an event id seen
-- twice (Stripe retries) is a no-op.
create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  account_id text,
  payload jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.stripe_webhook_events enable row level security;
