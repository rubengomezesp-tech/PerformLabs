-- Consolidate "multiple permissive policies" flagged by the Supabase performance
-- advisor (lint 0006). For a given (role, action), Postgres already ORs all
-- permissive policies together, so collapsing the overlapping pairs into a single
-- policy per action whose USING/WITH CHECK is the verbatim OR of the originals is
-- semantics-preserving by construction (no access is added or removed).
--
-- Pattern: a `FOR ALL` team-management policy overlapped a `FOR SELECT` read
-- policy on the SELECT action (and, for cardio_session_logs, on every action).
-- We split each team `FOR ALL` policy into per-write-action policies (insert/
-- update/delete) and fold the team read-branch into one merged SELECT policy.
--
-- NOTE: not auto-applied to production by tooling — intended to ship through this
-- PR so the RLS change is reviewed/tested before reaching the live multi-tenant DB.

-- ───────────────────────── Catalog tables (read = workspace member; write = team)
-- app_banners, challenges, supplements share: member SELECT = is_workspace_member.
do $$
declare t text;
begin
  foreach t in array array['app_banners','challenges'] loop
    execute format('drop policy if exists catalog_select_member on public.%I', t);
    execute format('drop policy if exists catalog_write_team on public.%I', t);
    execute format($f$create policy catalog_read on public.%I for select
      using (private.is_workspace_member(workspace_id)
             or private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_insert on public.%I for insert
      with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_update on public.%I for update
      using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))
      with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_delete on public.%I for delete
      using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
  end loop;
end $$;

-- food_library_items, ingredients, recipes share: member SELECT = (workspace_id is null OR is_workspace_member).
do $$
declare t text;
begin
  foreach t in array array['food_library_items','ingredients','recipes'] loop
    execute format('drop policy if exists catalog_select_member on public.%I', t);
    execute format('drop policy if exists catalog_write_team on public.%I', t);
    execute format($f$create policy catalog_read on public.%I for select
      using (((workspace_id is null) or private.is_workspace_member(workspace_id))
             or private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_insert on public.%I for insert
      with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_update on public.%I for update
      using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))
      with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
    execute format($f$create policy catalog_write_team_delete on public.%I for delete
      using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))$f$, t);
  end loop;
end $$;

-- supplements: same shape but original policy names differ.
drop policy if exists "supplements visible to workspace" on public.supplements;
drop policy if exists "supplements managed by team" on public.supplements;
create policy "supplements readable by workspace" on public.supplements for select
  using (private.is_workspace_member(workspace_id)
         or private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "supplements team insert" on public.supplements for insert
  with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "supplements team update" on public.supplements for update
  using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "supplements team delete" on public.supplements for delete
  using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));

-- ───────────────────────── member_subscriptions (read = owner OR team; write = team)
drop policy if exists "member subscriptions visible to owner and team" on public.member_subscriptions;
drop policy if exists "member subscriptions managed by team" on public.member_subscriptions;
create policy "member subscriptions readable by owner and team" on public.member_subscriptions for select
  using (private.is_member_profile_owner(workspace_id, member_profile_id)
         or private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "member subscriptions team insert" on public.member_subscriptions for insert
  with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "member subscriptions team update" on public.member_subscriptions for update
  using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));
create policy "member subscriptions team delete" on public.member_subscriptions for delete
  using (private.has_workspace_role(workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]));

-- ───────────────────────── recipe_ingredients (read with recipe; write = recipe's team)
drop policy if exists "recipe ingredients readable with recipe" on public.recipe_ingredients;
drop policy if exists "recipe ingredients managed by team" on public.recipe_ingredients;
create policy "recipe ingredients read" on public.recipe_ingredients for select
  using (
    exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and ((r.workspace_id is null) or private.is_workspace_member(r.workspace_id)))
    or exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and private.has_workspace_role(r.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role]))
  );
create policy "recipe ingredients team insert" on public.recipe_ingredients for insert
  with check (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and private.has_workspace_role(r.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
create policy "recipe ingredients team update" on public.recipe_ingredients for update
  using (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and private.has_workspace_role(r.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])))
  with check (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and private.has_workspace_role(r.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
create policy "recipe ingredients team delete" on public.recipe_ingredients for delete
  using (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and private.has_workspace_role(r.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));

-- ───────────────────────── cardio_session_logs (authenticated; read/write = owner OR team)
-- Original team policy was FOR ALL, member policies were per-action, so every
-- action overlapped. Merge into one policy per action: (owner OR team).
drop policy if exists "workspace team can manage cardio session logs" on public.cardio_session_logs;
drop policy if exists "members can read own cardio session logs" on public.cardio_session_logs;
drop policy if exists "members can create own cardio session logs" on public.cardio_session_logs;
drop policy if exists "members can update own cardio session logs" on public.cardio_session_logs;
drop policy if exists "members can delete own cardio session logs" on public.cardio_session_logs;
create policy "cardio session logs read" on public.cardio_session_logs for select to authenticated
  using ((select private.is_member_profile_owner(cardio_session_logs.workspace_id, cardio_session_logs.member_profile_id))
         or (select private.has_workspace_role(cardio_session_logs.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
create policy "cardio session logs insert" on public.cardio_session_logs for insert to authenticated
  with check ((select private.is_member_profile_owner(cardio_session_logs.workspace_id, cardio_session_logs.member_profile_id))
         or (select private.has_workspace_role(cardio_session_logs.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
create policy "cardio session logs update" on public.cardio_session_logs for update to authenticated
  using ((select private.is_member_profile_owner(cardio_session_logs.workspace_id, cardio_session_logs.member_profile_id))
         or (select private.has_workspace_role(cardio_session_logs.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])))
  with check ((select private.is_member_profile_owner(cardio_session_logs.workspace_id, cardio_session_logs.member_profile_id))
         or (select private.has_workspace_role(cardio_session_logs.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
create policy "cardio session logs delete" on public.cardio_session_logs for delete to authenticated
  using ((select private.is_member_profile_owner(cardio_session_logs.workspace_id, cardio_session_logs.member_profile_id))
         or (select private.has_workspace_role(cardio_session_logs.workspace_id, array['platform_owner'::workspace_role,'agency_admin'::workspace_role,'coach_admin'::workspace_role,'coach_staff'::workspace_role])));
