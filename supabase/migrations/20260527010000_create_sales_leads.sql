create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  brand_name text,
  website_url text,
  monthly_clients text,
  main_goal text,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'lost', 'won')),
  source text not null default 'landing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales_leads enable row level security;

create index if not exists sales_leads_status_created_at_idx
on public.sales_leads (status, created_at desc);

create index if not exists sales_leads_email_idx
on public.sales_leads (email);
