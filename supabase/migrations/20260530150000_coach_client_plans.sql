-- Pricing plans a coach sells to their own clients. The Stripe product/price
-- live in the coach's connected account (Direct charges); we keep a local
-- mirror for listing and for building client checkouts later.

create table if not exists public.coach_client_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  amount_cents integer not null,
  currency text not null default 'eur',
  interval text not null default 'month',
  stripe_product_id text,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists coach_client_plans_workspace_idx on public.coach_client_plans (workspace_id, active);
alter table public.coach_client_plans enable row level security;
