do $$
begin
  if not exists (select 1 from pg_type where typname = 'entitlement_status') then
    create type public.entitlement_status as enum ('active', 'past_due', 'suspended', 'revoked', 'terminated');
  end if;
end $$;

create table if not exists public.workspace_entitlements (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  status public.entitlement_status not null default 'active',
  modules jsonb not null default '{
    "member_app": true,
    "coach_console": true,
    "training": true,
    "nutrition": true,
    "checkins": true,
    "content": true,
    "notifications": true,
    "billing": true
  }'::jsonb,
  contract_ref text,
  reason text,
  enforced_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_entitlements enable row level security;

drop policy if exists "Platform can manage entitlements" on public.workspace_entitlements;
create policy "Platform can manage entitlements"
on public.workspace_entitlements
for all
to authenticated
using (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin']::public.workspace_role[])
)
with check (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin']::public.workspace_role[])
);

drop policy if exists "Workspace managers can read entitlements" on public.workspace_entitlements;
create policy "Workspace managers can read entitlements"
on public.workspace_entitlements
for select
to authenticated
using (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
);

insert into public.workspace_entitlements (workspace_id)
select id from public.workspaces
on conflict (workspace_id) do nothing;

create index if not exists workspace_entitlements_status_idx
on public.workspace_entitlements (status);
