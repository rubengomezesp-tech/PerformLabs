-- Audit H1: close the last RLS gaps for the mobile app (anon key + RLS, decided
-- 2026-06-19). Several tables were RLS-enabled with ZERO policies (deny-all),
-- which is correct for the service-role web app but returns empty rows for a
-- member reading directly with the anon key. This grants member SELECT (+ team
-- write) on the reference catalogs and member SELECT on their own check-ins.
-- Coach-authoring artifacts (raw templates) and billing (coupons) intentionally
-- STAY service-role only and are now documented as such (the agent flagged them
-- as undocumented deny-all). Idempotent: every policy is dropped before create.

-- Reference catalogs (workspace_id NULL = global reference row, like
-- food_library_items): members read their workspace's rows + any global row; the
-- coach team writes. Global rows are seeded server-side (service-role).
do $cat_ref$
declare
  t text;
  tabs text[] := array['diet_categories', 'exercise_categories', 'nutrition_formulas'];
begin
  foreach t in array tabs loop
    execute format('drop policy if exists %I on public.%I', 'catalog_select_member', t);
    execute format('drop policy if exists %I on public.%I', 'catalog_write_team', t);
    execute format(
      'create policy %I on public.%I for select using (workspace_id is null or private.is_workspace_member(workspace_id))',
      'catalog_select_member', t
    );
    execute format(
      $q$create policy %I on public.%I for all using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])) with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))$q$,
      'catalog_write_team', t
    );
  end loop;
end
$cat_ref$;

-- customer_checkins: a member reads their OWN check-ins; the coach team reads and
-- manages. Member WRITES (submitting a check-in) intentionally stay server-side
-- for now — add a member INSERT policy (with check is_member_profile_owner) here
-- if/when the mobile app submits check-ins directly with the anon key.
drop policy if exists "checkins visible to owner and team" on public.customer_checkins;
create policy "checkins visible to owner and team" on public.customer_checkins for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  );

drop policy if exists "checkins managed by team" on public.customer_checkins;
create policy "checkins managed by team" on public.customer_checkins for all
  using (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

-- Document the intentional deny-all (RLS on, no policies = service-role only).
-- These are coach-authoring artifacts: members never read them directly — they
-- read the materialized assigned plans (assigned_workout_days/exercises,
-- assigned_meal_plan_days/items), which already carry member RLS and are written
-- from the templates at assignment time via the service-role client.
comment on table public.workout_templates is 'Coach-authoring artifact. RLS deny-all (service-role only); members read the materialized assigned plans, not templates.';
comment on table public.diet_templates is 'Coach-authoring artifact. RLS deny-all (service-role only); members read the materialized assigned meal plans, not templates.';
comment on table public.workout_template_days is 'Coach-authoring artifact. RLS deny-all (service-role only).';
comment on table public.workout_template_exercises is 'Coach-authoring artifact. RLS deny-all (service-role only).';
comment on table public.diet_template_meals is 'Coach-authoring artifact. RLS deny-all (service-role only).';
comment on table public.coupons is 'Billing. RLS deny-all (service-role only); never read by members.';
