create or replace function private.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_memberships wm
      where wm.user_id = (select auth.uid())
        and wm.role = 'platform_owner'
    );
$$;

revoke execute on function private.is_platform_owner() from public, anon;
grant execute on function private.is_platform_owner() to authenticated, service_role;

drop policy if exists "workspace members can read workspace" on public.workspaces;
create policy "workspace members can read workspace"
on public.workspaces for select
to authenticated
using ((select private.is_workspace_member(id)));

drop policy if exists "workspace admins can update workspace" on public.workspaces;
create policy "workspace admins can update workspace"
on public.workspaces for update
to authenticated
using ((select private.has_workspace_role(id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])));

drop policy if exists "memberships visible inside workspace" on public.workspace_memberships;
create policy "memberships visible inside workspace"
on public.workspace_memberships for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists "platform owners manage memberships" on public.workspace_memberships;
create policy "platform owners manage memberships"
on public.workspace_memberships for all
to authenticated
using ((select private.is_platform_owner()))
with check ((select private.is_platform_owner()));

drop policy if exists "coach admins manage libraries" on public.exercises;
create policy "coach admins manage libraries"
on public.exercises for all
to authenticated
using (
  workspace_id is null
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  workspace_id is null
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "members can read exercises" on public.exercise_videos;
create policy "members can read exercises"
on public.exercise_videos for select
to authenticated
using (
  workspace_id is null
  or (select private.is_workspace_member(workspace_id))
);

drop policy if exists "members can read content" on public.content_pages;
create policy "members can read content"
on public.content_pages for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists "coach admins manage content" on public.content_pages;
create policy "coach admins manage content"
on public.content_pages for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can read profiles in workspace" on public.member_profiles;
create policy "members can read profiles in workspace"
on public.member_profiles for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists "members can update own profile" on public.member_profiles;
create policy "members can update own profile"
on public.member_profiles for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  user_id = (select auth.uid())
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace members read app settings" on public.app_settings;
create policy "workspace members read app settings"
on public.app_settings for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists "workspace members read app pages" on public.app_pages;
create policy "workspace members read app pages"
on public.app_pages for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists "coach admins manage app pages" on public.app_pages;
create policy "coach admins manage app pages"
on public.app_pages for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "coach admins manage products" on public.product_catalog_items;
create policy "coach admins manage products"
on public.product_catalog_items for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]
)));

drop policy if exists "coach admins manage pricing" on public.pricing_plans;
create policy "coach admins manage pricing"
on public.pricing_plans for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin']::public.workspace_role[]
)));

drop policy if exists "workspace members read media" on public.media_files;
create policy "workspace members read media"
on public.media_files for select
to authenticated
using (
  workspace_id is null
  or (select private.is_workspace_member(workspace_id))
);

drop policy if exists "workspace admins can read audit log" on public.audit_log;
create policy "workspace admins can read audit log"
on public.audit_log for select
to authenticated
using (
  (select private.is_platform_owner())
  or (
    workspace_id is not null
    and (select private.has_workspace_role(
      workspace_id,
      array['agency_admin','coach_admin']::public.workspace_role[]
    ))
  )
);

drop policy if exists "workspace admins can insert audit log" on public.audit_log;
create policy "workspace admins can insert audit log"
on public.audit_log for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (
    (select private.is_platform_owner())
    or workspace_id is null
    or (select private.has_workspace_role(
      workspace_id,
      array['agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
  )
);

drop policy if exists "workspace team can manage training reviews" on public.member_training_reviews;
create policy "workspace team can manage training reviews"
on public.member_training_reviews for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "workspace team can manage support conversations" on public.support_conversations;
create policy "workspace team can manage support conversations"
on public.support_conversations for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "workspace team can manage support messages" on public.support_messages;
create policy "workspace team can manage support messages"
on public.support_messages for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "workspace team can manage workout session logs" on public.workout_session_logs;
create policy "workspace team can manage workout session logs"
on public.workout_session_logs for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "workspace team can manage workout set logs" on public.workout_set_logs;
create policy "workspace team can manage workout set logs"
on public.workout_set_logs for all
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.has_workspace_role(
        session.workspace_id,
        array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
      ))
  )
)
with check (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.has_workspace_role(
        session.workspace_id,
        array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
      ))
  )
);

drop policy if exists "Platform can manage entitlements" on public.workspace_entitlements;
create policy "Platform can manage entitlements"
on public.workspace_entitlements for all
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)));

drop policy if exists "Workspace managers can read entitlements" on public.workspace_entitlements;
create policy "Workspace managers can read entitlements"
on public.workspace_entitlements for select
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "public can read brand assets" on storage.objects;

revoke execute on function public.is_workspace_member(uuid) from public, anon, authenticated;
revoke execute on function public.has_workspace_role(uuid, public.workspace_role[]) from public, anon, authenticated;
revoke execute on function public.is_platform_owner() from public, anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
