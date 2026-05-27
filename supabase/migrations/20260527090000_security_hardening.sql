create index if not exists audit_log_workspace_created_idx
on public.audit_log (workspace_id, created_at desc);

create index if not exists audit_log_actor_created_idx
on public.audit_log (actor_user_id, created_at desc);

create index if not exists workspace_memberships_user_role_idx
on public.workspace_memberships (user_id, role);

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.user_id = auth.uid()
      and wm.role = 'platform_owner'
  );
$$;

drop policy if exists "platform owners manage memberships" on public.workspace_memberships;
create policy "platform owners manage memberships"
on public.workspace_memberships for all
using (public.is_platform_owner())
with check (public.is_platform_owner());

drop policy if exists "workspace admins can read audit log" on public.audit_log;
create policy "workspace admins can read audit log"
on public.audit_log for select
using (
  public.is_platform_owner()
  or (
    workspace_id is not null
    and public.has_workspace_role(
      workspace_id,
      array['agency_admin','coach_admin']::public.workspace_role[]
    )
  )
);

drop policy if exists "workspace admins can insert audit log" on public.audit_log;
create policy "workspace admins can insert audit log"
on public.audit_log for insert
with check (
  auth.uid() is not null
  and (
    public.is_platform_owner()
    or workspace_id is null
    or public.has_workspace_role(
      workspace_id,
      array['agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    )
  )
);
