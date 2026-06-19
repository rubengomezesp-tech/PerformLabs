-- Shared store for the generic sliding-window rate limiter (audit SEC-001 /
-- BUG-3). The coach-ai limiter was an in-memory Map, so on serverless each
-- instance had its own counter and the effective limit was RATE_MAX x instances
-- (and it leaked, never evicting keys). This table + RPC enforce an N-per-window
-- limit atomically across instances. Service-role only: RLS enabled with no
-- policies, so it is unreachable by anon/authenticated.
create table if not exists public.rate_limit_counters (
  bucket text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_counters enable row level security;

-- Atomic "consume one token" for a fixed window. The ON CONFLICT DO UPDATE locks
-- the row, so concurrent deliveries can't race past the limit. Returns true when
-- the request is allowed (post-increment count <= p_max), false when throttled.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_window_ms integer,
  p_max integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limit_counters as r (bucket, count, reset_at, updated_at)
  values (
    p_bucket,
    1,
    v_now + make_interval(secs => p_window_ms / 1000.0),
    v_now
  )
  on conflict (bucket) do update
    set count = case when r.reset_at <= v_now then 1 else r.count + 1 end,
        reset_at = case
          when r.reset_at <= v_now then v_now + make_interval(secs => p_window_ms / 1000.0)
          else r.reset_at
        end,
        updated_at = v_now
  returning r.count into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
