-- Member-facing RLS policies so the mobile app (anon key + RLS) can read/write
-- the member's own data. Mirrors the existing safe pattern used by
-- assigned_workout_days: private.is_member_profile_owner(ws, mp) for the owner,
-- private.has_workspace_role(ws, roles[]) for staff, private.is_workspace_member(ws)
-- for workspace-wide reads. Non-breaking for the web app (service-role bypasses RLS).

-- ===== Group A: member-owned data (workspace_id + member_profile_id): owner CRUD + team manage =====
do $rls_a$
declare
  t text;
  tabs text[] := array[
    'food_diary_entries','member_meal_logs','member_nutrition_daily_logs','member_food_favorites',
    'member_habits','member_habit_logs','supplement_logs','customer_checkins',
    'coach_ai_messages','member_onboarding_responses','push_subscriptions','challenge_participants'
  ];
  expr text := '(private.is_member_profile_owner(workspace_id, member_profile_id) or private.has_workspace_role(workspace_id, array[''platform_owner'',''agency_admin'',''coach_admin'',''coach_staff'']::public.workspace_role[]))';
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'mbr_select_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_insert_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_update_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_delete_own_team', t);
    execute format('create policy %I on public.%I for select using %s', 'mbr_select_own_team', t, expr);
    execute format('create policy %I on public.%I for insert with check %s', 'mbr_insert_own_team', t, expr);
    execute format('create policy %I on public.%I for update using %s with check %s', 'mbr_update_own_team', t, expr, expr);
    execute format('create policy %I on public.%I for delete using %s', 'mbr_delete_own_team', t, expr);
  end loop;
end
$rls_a$;

-- ===== Group B: coach-assigned plans (member reads own, team writes) =====
do $rls_b$
declare
  t text;
  tabs text[] := array['assigned_workout_plans','assigned_meal_plans','assigned_meal_plan_days','assigned_meal_plan_items'];
  own_team text := '(private.is_member_profile_owner(workspace_id, member_profile_id) or private.has_workspace_role(workspace_id, array[''platform_owner'',''agency_admin'',''coach_admin'',''coach_staff'']::public.workspace_role[]))';
  team text := '(private.has_workspace_role(workspace_id, array[''platform_owner'',''agency_admin'',''coach_admin'',''coach_staff'']::public.workspace_role[]))';
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'asg_select_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'asg_insert_team', t);
    execute format('drop policy if exists %I on public.%I', 'asg_update_team', t);
    execute format('drop policy if exists %I on public.%I', 'asg_delete_team', t);
    execute format('create policy %I on public.%I for select using %s', 'asg_select_own_team', t, own_team);
    execute format('create policy %I on public.%I for insert with check %s', 'asg_insert_team', t, team);
    execute format('create policy %I on public.%I for update using %s with check %s', 'asg_update_team', t, team, team);
    execute format('create policy %I on public.%I for delete using %s', 'asg_delete_team', t, team);
  end loop;
end
$rls_b$;

-- ===== Group C: member-owned without workspace_id (derive workspace via member_profiles) =====
do $rls_c$
declare
  t text;
  tabs text[] := array['progress_entries','member_diet_preferences','member_fitness_preferences'];
  expr text := '(exists (select 1 from public.member_profiles mp where mp.id = member_profile_id and (mp.user_id = (select auth.uid()) or private.has_workspace_role(mp.workspace_id, array[''platform_owner'',''agency_admin'',''coach_admin'',''coach_staff'']::public.workspace_role[]))))';
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'mbr_select_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_insert_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_update_own_team', t);
    execute format('drop policy if exists %I on public.%I', 'mbr_delete_own_team', t);
    execute format('create policy %I on public.%I for select using %s', 'mbr_select_own_team', t, expr);
    execute format('create policy %I on public.%I for insert with check %s', 'mbr_insert_own_team', t, expr);
    execute format('create policy %I on public.%I for update using %s with check %s', 'mbr_update_own_team', t, expr, expr);
    execute format('create policy %I on public.%I for delete using %s', 'mbr_delete_own_team', t, expr);
  end loop;
end
$rls_c$;

-- ===== Group D: workspace-level catalogs =====
-- supplements: members read their workspace's protocol; team manages.
drop policy if exists "supplements visible to workspace" on public.supplements;
create policy "supplements visible to workspace" on public.supplements for select
  using (private.is_workspace_member(workspace_id));
drop policy if exists "supplements managed by team" on public.supplements;
create policy "supplements managed by team" on public.supplements for all
  using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

-- coach_ai_brains: coach IP (persona/rules) — team only, never exposed to members.
drop policy if exists "coach ai brains managed by team" on public.coach_ai_brains;
create policy "coach ai brains managed by team" on public.coach_ai_brains for all
  using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

-- ===== Group E: community (workspace feed: members read all, write own; team moderates) =====
drop policy if exists "community posts visible to workspace" on public.community_posts;
create policy "community posts visible to workspace" on public.community_posts for select
  using (private.is_workspace_member(workspace_id));
drop policy if exists "community posts created by owner" on public.community_posts;
create policy "community posts created by owner" on public.community_posts for insert
  with check (private.is_member_profile_owner(workspace_id, member_profile_id));
drop policy if exists "community posts updated by owner or team" on public.community_posts;
create policy "community posts updated by owner or team" on public.community_posts for update
  using (private.is_member_profile_owner(workspace_id, member_profile_id) or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  with check (private.is_member_profile_owner(workspace_id, member_profile_id) or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));
drop policy if exists "community posts deleted by owner or team" on public.community_posts;
create policy "community posts deleted by owner or team" on public.community_posts for delete
  using (private.is_member_profile_owner(workspace_id, member_profile_id) or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "community likes visible to workspace" on public.community_post_likes;
create policy "community likes visible to workspace" on public.community_post_likes for select
  using (private.is_workspace_member(workspace_id));
drop policy if exists "community likes created by owner" on public.community_post_likes;
create policy "community likes created by owner" on public.community_post_likes for insert
  with check (private.is_member_profile_owner(workspace_id, member_profile_id));
drop policy if exists "community likes deleted by owner" on public.community_post_likes;
create policy "community likes deleted by owner" on public.community_post_likes for delete
  using (private.is_member_profile_owner(workspace_id, member_profile_id));
