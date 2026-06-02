-- Coach inquiries: contact messages + 1-1 coaching applications captured from a coach's
-- public sales site (/c/[slug]/contacto and /c/[slug]/1-1-coaching). Server-only: RLS is
-- enabled with NO policies, so anon/authenticated can neither read nor write — the same
-- deny-all posture as the rest of the data layer (reads/writes go through the service role).

create table if not exists public.coach_inquiries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  full_name text not null,
  email text not null,
  message text not null default '',
  kind text not null default 'contact',
  created_at timestamptz not null default now()
);

alter table public.coach_inquiries enable row level security;

create index if not exists coach_inquiries_workspace_idx
  on public.coach_inquiries (workspace_id, created_at desc);
