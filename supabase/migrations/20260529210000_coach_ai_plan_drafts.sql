-- AI plan generation with coach-in-the-loop. The Coach Brain drafts a program
-- from a brief; the coach reviews and approves it into a real workout_template.
-- The AI never publishes on its own — the coach is always the gate.
create table if not exists public.coach_ai_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null default 'workout' check (kind in ('workout', 'nutrition')),
  title text not null,
  brief jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'discarded')),
  template_id uuid references public.workout_templates(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists coach_ai_plan_drafts_workspace_idx
  on public.coach_ai_plan_drafts (workspace_id, created_at desc);

alter table public.coach_ai_plan_drafts enable row level security;
