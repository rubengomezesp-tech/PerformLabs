-- Coach Copilot de retención: the AI drafts a re-engagement message in the
-- coach's voice for an at-risk client; the coach reviews, sends or dismisses.
-- Coach-in-the-loop accountability — the highest-evidence retention lever.
create table if not exists public.retention_outreach (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  risk_score integer not null default 0,
  reason text not null default '',
  message text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'dismissed')),
  created_at timestamptz not null default now(),
  acted_at timestamptz
);

create index if not exists retention_outreach_workspace_idx
  on public.retention_outreach (workspace_id, status, created_at desc);

create index if not exists retention_outreach_member_idx
  on public.retention_outreach (member_profile_id, created_at desc);

alter table public.retention_outreach enable row level security;
