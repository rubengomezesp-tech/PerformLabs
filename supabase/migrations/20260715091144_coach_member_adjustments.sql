-- Immutable coach decision log. Member-facing applications deliberately have no
-- policy on this table: published values are copied into the existing plan and
-- preference tables, while the private rationale and source snapshot stay here.

create table public.coach_member_adjustments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  goal text not null default 'fat_loss'
    check (goal in ('fat_loss', 'maintenance', 'lean_gain', 'gain')),
  effective_on date not null default current_date,
  target_calories integer check (target_calories between 800 and 8000),
  target_protein_g integer check (target_protein_g between 0 and 600),
  target_carbs_g integer check (target_carbs_g between 0 and 1200),
  target_fat_g integer check (target_fat_g between 0 and 400),
  water_target_ml integer check (water_target_ml between 0 and 10000),
  fiber_target_g integer check (fiber_target_g between 0 and 150),
  daily_steps_target integer check (daily_steps_target between 0 and 100000),
  training_days_per_week integer check (training_days_per_week between 1 and 7),
  current_training_week integer check (current_training_week between 1 and 52),
  next_review_on date,
  source_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_snapshot) = 'object'),
  calculation_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(calculation_snapshot) = 'object'),
  rationale text,
  member_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_profile_id, version)
);

comment on table public.coach_member_adjustments is
  'Append-only private coach decisions. Published targets are projected into operational member plans.';

create index coach_member_adjustments_workspace_created_idx
  on public.coach_member_adjustments (workspace_id, created_at desc);

create index coach_member_adjustments_member_version_idx
  on public.coach_member_adjustments (member_profile_id, version desc);

alter table public.coach_member_adjustments enable row level security;

create policy "coach adjustments visible to team"
  on public.coach_member_adjustments
  for select
  to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "coach adjustments created by team"
  on public.coach_member_adjustments
  for insert
  to authenticated
  with check ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )) and exists (
    select 1
    from public.member_profiles member
    where member.id = member_profile_id
      and member.workspace_id = workspace_id
  ));

-- No UPDATE or DELETE policies/grants: every save creates a new version.
grant select, insert on table public.coach_member_adjustments to authenticated;
grant select, insert, update, delete on table public.coach_member_adjustments to service_role;

-- One transaction records the immutable decision and projects only the selected
-- fields into the active operational plans. Client-authored preference columns
-- that the coach did not touch are preserved.
create or replace function public.save_coach_member_adjustment(
  p_workspace_id uuid,
  p_member_profile_id uuid,
  p_status text,
  p_goal text,
  p_effective_on date,
  p_target_calories integer,
  p_target_protein_g integer,
  p_target_carbs_g integer,
  p_target_fat_g integer,
  p_water_target_ml integer,
  p_fiber_target_g integer,
  p_daily_steps_target integer,
  p_training_days_per_week integer,
  p_current_training_week integer,
  p_next_review_on date,
  p_source_snapshot jsonb,
  p_calculation_snapshot jsonb,
  p_rationale text,
  p_member_message text,
  p_created_by uuid
)
returns table (
  adjustment_id uuid,
  adjustment_version integer,
  meal_plan_updated boolean,
  workout_plan_updated boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_adjustment_id uuid;
  v_version integer;
  v_meal_plan_id uuid;
  v_workout_plan_id uuid;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'Invalid adjustment status';
  end if;

  if not exists (
    select 1
    from public.member_profiles member
    where member.id = p_member_profile_id
      and member.workspace_id = p_workspace_id
  ) then
    raise exception 'Member does not belong to workspace';
  end if;

  -- Serialise versions per member so two open tabs cannot create the same one.
  perform pg_advisory_xact_lock(hashtextextended(p_member_profile_id::text, 0));
  select coalesce(max(adjustment.version), 0) + 1
    into v_version
  from public.coach_member_adjustments adjustment
  where adjustment.member_profile_id = p_member_profile_id;

  insert into public.coach_member_adjustments (
    workspace_id, member_profile_id, version, status, goal, effective_on,
    target_calories, target_protein_g, target_carbs_g, target_fat_g,
    water_target_ml, fiber_target_g, daily_steps_target,
    training_days_per_week, current_training_week, next_review_on,
    source_snapshot, calculation_snapshot, rationale, member_message, created_by
  ) values (
    p_workspace_id, p_member_profile_id, v_version, p_status, p_goal, coalesce(p_effective_on, current_date),
    p_target_calories, p_target_protein_g, p_target_carbs_g, p_target_fat_g,
    p_water_target_ml, p_fiber_target_g, p_daily_steps_target,
    p_training_days_per_week, p_current_training_week, p_next_review_on,
    coalesce(p_source_snapshot, '{}'::jsonb), coalesce(p_calculation_snapshot, '{}'::jsonb),
    nullif(trim(p_rationale), ''), nullif(trim(p_member_message), ''), p_created_by
  )
  returning id into v_adjustment_id;

  if p_status = 'published' then
    select plan.id
      into v_meal_plan_id
    from public.assigned_meal_plans plan
    where plan.workspace_id = p_workspace_id
      and plan.member_profile_id = p_member_profile_id
      and plan.status = 'active'
    order by plan.created_at desc
    limit 1
    for update;

    if v_meal_plan_id is not null then
      update public.assigned_meal_plans plan
      set target_calories = p_target_calories,
          target_protein_g = p_target_protein_g,
          target_carbs_g = p_target_carbs_g,
          target_fat_g = p_target_fat_g,
          water_target_ml = p_water_target_ml,
          fiber_target_g = p_fiber_target_g,
          next_review_on = p_next_review_on,
          member_notes = coalesce(nullif(trim(p_member_message), ''), plan.member_notes),
          formula_snapshot = plan.formula_snapshot || jsonb_build_object(
            'coachingControl', jsonb_build_object(
              'adjustmentId', v_adjustment_id,
              'version', v_version,
              'publishedAt', now(),
              'calculation', coalesce(p_calculation_snapshot, '{}'::jsonb)
            )
          ),
          version = plan.version + 1,
          updated_at = now()
      where plan.id = v_meal_plan_id;

      -- Today's meal view prefers day targets over plan targets, so keep the
      -- materialised days aligned with the newly published plan targets.
      update public.assigned_meal_plan_days day
      set target_calories = p_target_calories,
          target_protein_g = p_target_protein_g,
          target_carbs_g = p_target_carbs_g,
          target_fat_g = p_target_fat_g,
          updated_at = now()
      where day.assigned_meal_plan_id = v_meal_plan_id;
    end if;

    select plan.id
      into v_workout_plan_id
    from public.assigned_workout_plans plan
    where plan.workspace_id = p_workspace_id
      and plan.member_profile_id = p_member_profile_id
      and plan.status = 'active'
    order by plan.created_at desc
    limit 1
    for update;

    if v_workout_plan_id is not null then
      update public.assigned_workout_plans plan
      set days_per_week = coalesce(p_training_days_per_week, plan.days_per_week),
          current_week = coalesce(p_current_training_week, plan.current_week),
          current_month = greatest(1, least(3, ((coalesce(p_current_training_week, plan.current_week) - 1) / 4) + 1)),
          next_review_on = p_next_review_on,
          member_notes = coalesce(nullif(trim(p_member_message), ''), plan.member_notes),
          algorithm_snapshot = plan.algorithm_snapshot || jsonb_build_object(
            'coachingControl', jsonb_build_object(
              'adjustmentId', v_adjustment_id,
              'version', v_version,
              'publishedAt', now()
            )
          ),
          version = plan.version + 1,
          updated_at = now()
      where plan.id = v_workout_plan_id;
    end if;

    insert into public.member_fitness_preferences (
      member_profile_id, days_per_week, daily_steps_target, updated_at
    ) values (
      p_member_profile_id, p_training_days_per_week, p_daily_steps_target, now()
    )
    on conflict (member_profile_id) do update
      set days_per_week = coalesce(excluded.days_per_week, member_fitness_preferences.days_per_week),
          daily_steps_target = coalesce(excluded.daily_steps_target, member_fitness_preferences.daily_steps_target),
          updated_at = now();

    insert into public.member_activity_events (
      workspace_id, member_profile_id, event_type, source, metadata
    ) values (
      p_workspace_id,
      p_member_profile_id,
      'coach_adjustment_published',
      'coach_control',
      jsonb_build_object('adjustmentId', v_adjustment_id, 'version', v_version)
    );
  end if;

  return query select v_adjustment_id, v_version, v_meal_plan_id is not null, v_workout_plan_id is not null;
end;
$$;

revoke all on function public.save_coach_member_adjustment(
  uuid, uuid, text, text, date, integer, integer, integer, integer, integer,
  integer, integer, integer, integer, date, jsonb, jsonb, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.save_coach_member_adjustment(
  uuid, uuid, text, text, date, integer, integer, integer, integer, integer,
  integer, integer, integer, integer, date, jsonb, jsonb, text, text, uuid
) to service_role;
