alter table public.sales_leads
add column if not exists assigned_agent text,
add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
add column if not exists next_action_at timestamptz,
add column if not exists qualification_notes text;

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads(id) on delete cascade,
  author_name text not null default 'Equipo',
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.implementation_projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid unique references public.sales_leads(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  project_name text not null,
  client_name text not null,
  client_email text not null,
  assigned_agent text,
  status text not null default 'discovery' check (status in ('discovery', 'brand_setup', 'content_setup', 'review', 'launch_ready', 'launched', 'paused')),
  launch_target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.implementation_projects(id) on delete cascade,
  phase text not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'blocked')),
  sort_order int not null default 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lead_notes enable row level security;
alter table public.implementation_projects enable row level security;
alter table public.project_onboarding_tasks enable row level security;

create index if not exists lead_notes_lead_id_created_at_idx
on public.lead_notes (lead_id, created_at desc);

create index if not exists implementation_projects_status_created_at_idx
on public.implementation_projects (status, created_at desc);

create index if not exists project_onboarding_tasks_project_sort_idx
on public.project_onboarding_tasks (project_id, sort_order);
