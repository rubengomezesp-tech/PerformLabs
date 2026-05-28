create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_workspace_id is not null
    and (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.member_profiles mp
        where mp.workspace_id = target_workspace_id
          and mp.user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_workspace_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role = any(allowed_roles)
    );
$$;

create or replace function private.has_workspace_role_by_text(
  target_workspace_id text,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(target_workspace_id, '') is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id::text = target_workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role = any(allowed_roles)
    );
$$;

create or replace function private.is_workspace_member_by_text(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(target_workspace_id, '') is not null
    and (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id::text = target_workspace_id
          and wm.user_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.member_profiles mp
        where mp.workspace_id::text = target_workspace_id
          and mp.user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.is_member_profile_owner(
  target_workspace_id uuid,
  target_member_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_workspace_id is not null
    and target_member_profile_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.member_profiles mp
      where mp.id = target_member_profile_id
        and mp.workspace_id = target_workspace_id
        and mp.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_member_profile_owner_by_text(
  target_workspace_id text,
  target_member_profile_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(target_workspace_id, '') is not null
    and nullif(target_member_profile_id, '') is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.member_profiles mp
      where mp.workspace_id::text = target_workspace_id
        and mp.id::text = target_member_profile_id
        and mp.user_id = (select auth.uid())
    );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

drop policy if exists "workspace team can manage member meal logs" on public.member_meal_logs;
create policy "workspace team can manage member meal logs"
on public.member_meal_logs for all
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "members can read own meal logs" on public.member_meal_logs;
create policy "members can read own meal logs"
on public.member_meal_logs for select
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can create own meal logs" on public.member_meal_logs;
create policy "members can create own meal logs"
on public.member_meal_logs for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can update own meal logs" on public.member_meal_logs;
create policy "members can update own meal logs"
on public.member_meal_logs for update
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)))
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "workspace team can manage nutrition daily logs" on public.member_nutrition_daily_logs;
create policy "workspace team can manage nutrition daily logs"
on public.member_nutrition_daily_logs for all
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "members can read own nutrition daily logs" on public.member_nutrition_daily_logs;
create policy "members can read own nutrition daily logs"
on public.member_nutrition_daily_logs for select
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can create own nutrition daily logs" on public.member_nutrition_daily_logs;
create policy "members can create own nutrition daily logs"
on public.member_nutrition_daily_logs for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can update own nutrition daily logs" on public.member_nutrition_daily_logs;
create policy "members can update own nutrition daily logs"
on public.member_nutrition_daily_logs for update
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)))
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can read own workout session logs" on public.workout_session_logs;
create policy "members can read own workout session logs"
on public.workout_session_logs for select
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can create own workout session logs" on public.workout_session_logs;
create policy "members can create own workout session logs"
on public.workout_session_logs for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can update own workout session logs" on public.workout_session_logs;
create policy "members can update own workout session logs"
on public.workout_session_logs for update
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)))
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

drop policy if exists "members can read own workout set logs" on public.workout_set_logs;
create policy "members can read own workout set logs"
on public.workout_set_logs for select
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
  )
);

drop policy if exists "members can create own workout set logs" on public.workout_set_logs;
create policy "members can create own workout set logs"
on public.workout_set_logs for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
  )
);

drop policy if exists "members can update own workout set logs" on public.workout_set_logs;
create policy "members can update own workout set logs"
on public.workout_set_logs for update
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
  )
)
with check (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'brand-assets',
    'brand-assets',
    true,
    10485760,
    array['image/png','image/jpeg','image/webp','image/svg+xml']
  ),
  (
    'exercise-media',
    'exercise-media',
    false,
    524288000,
    array['video/mp4','video/quicktime','video/webm','image/png','image/jpeg','image/webp']
  ),
  (
    'member-progress',
    'member-progress',
    false,
    52428800,
    array['image/png','image/jpeg','image/webp']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read brand assets" on storage.objects;
create policy "public can read brand assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'brand-assets');

drop policy if exists "workspace team can upload brand assets" on storage.objects;
create policy "workspace team can upload brand assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'brand-assets'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace team can update brand assets" on storage.objects;
create policy "workspace team can update brand assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'brand-assets'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  bucket_id = 'brand-assets'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace team can delete brand assets" on storage.objects;
create policy "workspace team can delete brand assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'brand-assets'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace members can read exercise media" on storage.objects;
create policy "workspace members can read exercise media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'exercise-media'
  and (select private.is_workspace_member_by_text((storage.foldername(name))[1]))
);

drop policy if exists "workspace team can upload exercise media" on storage.objects;
create policy "workspace team can upload exercise media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'exercise-media'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace team can update exercise media" on storage.objects;
create policy "workspace team can update exercise media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'exercise-media'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  bucket_id = 'exercise-media'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "workspace team can delete exercise media" on storage.objects;
create policy "workspace team can delete exercise media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'exercise-media'
  and (select private.has_workspace_role_by_text(
    (storage.foldername(name))[1],
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

drop policy if exists "progress owners and team can read progress media" on storage.objects;
create policy "progress owners and team can read progress media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'member-progress'
  and (
    (select private.has_workspace_role_by_text(
      (storage.foldername(name))[1],
      array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
    or (select private.is_member_profile_owner_by_text(
      (storage.foldername(name))[1],
      (storage.foldername(name))[2]
    ))
  )
);

drop policy if exists "progress owners can upload progress media" on storage.objects;
create policy "progress owners can upload progress media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'member-progress'
  and (
    (select private.has_workspace_role_by_text(
      (storage.foldername(name))[1],
      array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
    or (select private.is_member_profile_owner_by_text(
      (storage.foldername(name))[1],
      (storage.foldername(name))[2]
    ))
  )
);

drop policy if exists "progress owners and team can update progress media" on storage.objects;
create policy "progress owners and team can update progress media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'member-progress'
  and (
    (select private.has_workspace_role_by_text(
      (storage.foldername(name))[1],
      array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
    or (select private.is_member_profile_owner_by_text(
      (storage.foldername(name))[1],
      (storage.foldername(name))[2]
    ))
  )
)
with check (
  bucket_id = 'member-progress'
  and (
    (select private.has_workspace_role_by_text(
      (storage.foldername(name))[1],
      array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
    or (select private.is_member_profile_owner_by_text(
      (storage.foldername(name))[1],
      (storage.foldername(name))[2]
    ))
  )
);

drop policy if exists "progress owners and team can delete progress media" on storage.objects;
create policy "progress owners and team can delete progress media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'member-progress'
  and (
    (select private.has_workspace_role_by_text(
      (storage.foldername(name))[1],
      array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
    ))
    or (select private.is_member_profile_owner_by_text(
      (storage.foldername(name))[1],
      (storage.foldername(name))[2]
    ))
  )
);
