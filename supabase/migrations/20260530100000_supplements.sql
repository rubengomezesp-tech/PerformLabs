-- Supplements: the coach assigns a supplement protocol to the brand's client and
-- the client ticks them off daily. Self-contained, MacroActive-parity.
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  dose text not null default '',
  timing text not null default 'anytime' check (timing in ('morning', 'pre', 'post', 'meal', 'night', 'anytime')),
  notes text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists supplements_workspace_idx
  on public.supplements (workspace_id, active, sort_order);

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  taken_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (supplement_id, member_profile_id, taken_on)
);

create index if not exists supplement_logs_idx
  on public.supplement_logs (member_profile_id, taken_on);

alter table public.supplements enable row level security;
alter table public.supplement_logs enable row level security;
