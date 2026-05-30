-- Web Push subscriptions for proactive notifications (motivational reminders,
-- "you haven't trained" nudges) delivered even when the app is closed.
-- Channel-agnostic by design: the same engine drives APNs/FCM on the native track.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_workspace_idx
  on public.push_subscriptions (workspace_id, enabled);

create index if not exists push_subscriptions_member_idx
  on public.push_subscriptions (member_profile_id);

alter table public.push_subscriptions enable row level security;
