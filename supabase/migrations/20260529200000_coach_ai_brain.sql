-- Coach Brain: the per-creator AI. Each workspace trains its own assistant that
-- speaks in the coach's voice and follows the coach's rules. This is the moat:
-- a proprietary, per-creator knowledge + tone layer that competitors can't clone.
create table if not exists public.coach_ai_brains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  enabled boolean not null default false,
  assistant_name text not null default 'Tu asistente',
  greeting text not null default '¡Hola! Soy el asistente de tu coach. Pregúntame lo que necesites sobre tu entreno, tu dieta o tus dudas del día a día.',
  persona text not null default '',
  tone text not null default '',
  specialties text not null default '',
  rules text not null default '',
  substitutions text not null default '',
  forbidden text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

-- Client <-> Coach Brain conversation. Persisted so the chat has continuity and
-- so the coach can later see what their clients actually ask (pure operator gold).
create table if not exists public.coach_ai_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_ai_messages_thread_idx
  on public.coach_ai_messages (workspace_id, member_profile_id, created_at);

alter table public.coach_ai_brains enable row level security;
alter table public.coach_ai_messages enable row level security;
