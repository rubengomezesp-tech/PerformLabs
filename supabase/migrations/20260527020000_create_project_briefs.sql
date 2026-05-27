create table if not exists public.project_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.implementation_projects(id) on delete cascade,
  app_name text,
  domain_strategy text not null default 'undecided' check (domain_strategy in ('undecided', 'new_domain', 'existing_domain', 'subdomain')),
  desired_domain text,
  logo_status text not null default 'pending' check (logo_status in ('pending', 'received', 'needs_design', 'approved')),
  primary_color text,
  accent_color text,
  brand_notes text,
  target_audience text,
  offer_summary text,
  pricing_notes text,
  payment_provider text,
  content_notes text,
  exercise_video_notes text,
  nutrition_notes text,
  legal_notes text,
  launch_notes text,
  internal_risks text,
  kickoff_call_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_briefs enable row level security;

create index if not exists project_briefs_project_id_idx
on public.project_briefs (project_id);

grant select on public.project_briefs to anon, authenticated;
grant insert, update, delete on public.project_briefs to authenticated;
grant all privileges on public.project_briefs to service_role;
