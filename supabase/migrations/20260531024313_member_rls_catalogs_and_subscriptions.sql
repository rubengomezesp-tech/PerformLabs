-- Reference catalogs (may have global rows with workspace_id NULL): members read
-- their workspace's rows + any global reference row; team writes.
do $cat_ref$
declare
  t text;
  tabs text[] := array['food_library_items','ingredients','recipes'];
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'catalog_select_member', t);
    execute format('drop policy if exists %I on public.%I', 'catalog_write_team', t);
    execute format('create policy %I on public.%I for select using (workspace_id is null or private.is_workspace_member(workspace_id))', 'catalog_select_member', t);
    execute format($q$create policy %I on public.%I for all using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])) with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))$q$, 'catalog_write_team', t);
  end loop;
end
$cat_ref$;

-- Tenant engagement content (always workspace-scoped): challenges, app_banners.
do $cat_ws$
declare
  t text;
  tabs text[] := array['challenges','app_banners'];
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'catalog_select_member', t);
    execute format('drop policy if exists %I on public.%I', 'catalog_write_team', t);
    execute format('create policy %I on public.%I for select using (private.is_workspace_member(workspace_id))', 'catalog_select_member', t);
    execute format($q$create policy %I on public.%I for all using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])) with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))$q$, 'catalog_write_team', t);
  end loop;
end
$cat_ws$;

-- recipe_ingredients: inherit access from its parent recipe (recipes.workspace_id).
drop policy if exists "recipe ingredients readable with recipe" on public.recipe_ingredients;
create policy "recipe ingredients readable with recipe" on public.recipe_ingredients for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and (r.workspace_id is null or private.is_workspace_member(r.workspace_id))
  ));
drop policy if exists "recipe ingredients managed by team" on public.recipe_ingredients;
create policy "recipe ingredients managed by team" on public.recipe_ingredients for all
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and private.has_workspace_role(r.workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  ))
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and private.has_workspace_role(r.workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  ));

-- member_subscriptions: member reads OWN; writes are server-side only (RevenueCat
-- webhook via service-role). Team can manage (comp/adjust).
drop policy if exists "member subscriptions visible to owner and team" on public.member_subscriptions;
create policy "member subscriptions visible to owner and team" on public.member_subscriptions for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  );
drop policy if exists "member subscriptions managed by team" on public.member_subscriptions;
create policy "member subscriptions managed by team" on public.member_subscriptions for all
  using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[]));

-- progress_photos: ownership derived through progress_entries -> member_profiles
-- (the table has no workspace_id/member_profile_id of its own).
do $pp$
declare
  expr text := '(exists (select 1 from public.progress_entries pe join public.member_profiles mp on mp.id = pe.member_profile_id where pe.id = progress_photos.progress_entry_id and (mp.user_id = (select auth.uid()) or private.has_workspace_role(mp.workspace_id, array[''platform_owner'',''agency_admin'',''coach_admin'',''coach_staff'']::public.workspace_role[]))))';
begin
  execute format('drop policy if exists %I on public.progress_photos', 'progress_photos_select');
  execute format('drop policy if exists %I on public.progress_photos', 'progress_photos_insert');
  execute format('drop policy if exists %I on public.progress_photos', 'progress_photos_update');
  execute format('drop policy if exists %I on public.progress_photos', 'progress_photos_delete');
  execute format('create policy %I on public.progress_photos for select using %s', 'progress_photos_select', expr);
  execute format('create policy %I on public.progress_photos for insert with check %s', 'progress_photos_insert', expr);
  execute format('create policy %I on public.progress_photos for update using %s with check %s', 'progress_photos_update', expr, expr);
  execute format('create policy %I on public.progress_photos for delete using %s', 'progress_photos_delete', expr);
end
$pp$;
