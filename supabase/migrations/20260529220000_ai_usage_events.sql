-- AI usage metering: every Claude call is logged with tokens and estimated cost
-- so we can show coaches their consumption and enforce per-workspace monthly
-- quotas — protecting our margin as AI usage scales.
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feature text not null check (feature in ('coach_brain', 'plan_gen', 'photo')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_workspace_month_idx
  on public.ai_usage_events (workspace_id, created_at desc);

create index if not exists ai_usage_events_feature_idx
  on public.ai_usage_events (workspace_id, feature, created_at desc);

alter table public.ai_usage_events enable row level security;
