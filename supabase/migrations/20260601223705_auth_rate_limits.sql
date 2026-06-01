-- Shared store for the login rate limiter (audit M4). The previous limiter was an
-- in-memory Map, so on serverless each instance had its own counter and the
-- effective limit was 5 x instances (and reset on cold start). This table makes
-- the 5-attempts / 15-min window+block enforcement consistent across instances.
-- Service-role only (the limiter runs in server actions via the service client);
-- RLS is enabled with no policies so it is unreachable by anon/authenticated.
create table if not exists public.auth_rate_limits (
  key text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;
