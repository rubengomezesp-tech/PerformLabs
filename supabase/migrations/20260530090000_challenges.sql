-- Challenges + leaderboard: coach-run group challenges that drive engagement and
-- retention (gamification). Progress is computed from real activity (workouts,
-- habits, check-ins) in the challenge window, so there's nothing to fake.
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  metric text not null default 'workouts' check (metric in ('workouts', 'habits', 'checkins')),
  goal integer not null default 12,
  starts_on date not null default current_date,
  ends_on date not null default (current_date + 28),
  status text not null default 'active' check (status in ('draft', 'active', 'ended')),
  created_at timestamptz not null default now()
);

create index if not exists challenges_workspace_idx
  on public.challenges (workspace_id, status, ends_on desc);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, member_profile_id)
);

create index if not exists challenge_participants_idx
  on public.challenge_participants (challenge_id);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
