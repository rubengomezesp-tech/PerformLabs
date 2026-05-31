-- Seed a demo member ("Alex Demo") in the demo workspace so the owner's
-- comp-preview of /app shows populated content (habits, streak, progress)
-- instead of empty states. Idempotent and strictly scoped to the demo member
-- profile — it touches no other workspace or member data.
--
-- The demo brand is resolved by its fallback_subdomain, so this works even if
-- the workspace id changes. The placeholder auth user has no password and
-- cannot log in; it only anchors member_profiles.user_id (NOT NULL).
--
-- Apply with the Supabase SQL editor / MCP execute_sql against the project.
do $$
declare
  v_ws uuid;
  v_user uuid := 'd33d0000-0000-4000-8000-000000000001';
  v_mp   uuid := 'd33d0000-0000-4000-8000-000000000002';
  v_h_water uuid := 'd33d0000-0000-4000-8000-0000000000a1';
  v_h_steps uuid := 'd33d0000-0000-4000-8000-0000000000a2';
  v_h_sleep uuid := 'd33d0000-0000-4000-8000-0000000000a3';
  v_h_prot  uuid := 'd33d0000-0000-4000-8000-0000000000a4';
begin
  select id into v_ws from public.workspaces where fallback_subdomain = 'demo.performlabs.app' limit 1;
  if v_ws is null then raise exception 'demo workspace not found'; end if;

  -- 1) placeholder auth user (no password; FK anchor only, no login)
  insert into auth.users (id, email, aud, role, created_at, updated_at, is_sso_user, is_anonymous)
  values (v_user, 'alex.demo@performlabs.app', 'authenticated', 'authenticated', now(), now(), false, false)
  on conflict (id) do nothing;

  -- 2) demo member profile (cloned by the owner comp-preview)
  insert into public.member_profiles
    (id, workspace_id, user_id, full_name, sex, birth_date, height_cm, starting_weight_kg,
     goal, activity_level, subscription_status, onboarding_status, timezone)
  values
    (v_mp, v_ws, v_user, 'Alex Demo', 'male', date '1994-03-12', 178, 82,
     'Recomposición corporal', 1.55, 'active', 'completed', 'Europe/Madrid')
  on conflict (id) do update set
     subscription_status = excluded.subscription_status,
     onboarding_status   = excluded.onboarding_status,
     full_name           = excluded.full_name,
     updated_at          = now();

  -- 3) habits (idempotent: replace the demo profile's habits)
  delete from public.member_habit_logs where member_profile_id = v_mp;
  delete from public.member_habits where member_profile_id = v_mp;
  insert into public.member_habits (id, workspace_id, member_profile_id, name, icon, cadence, target_per_day, sort_order, is_suggested)
  values
    (v_h_water, v_ws, v_mp, 'Beber 2L de agua', 'droplets',  'daily', 8, 0, true),
    (v_h_steps, v_ws, v_mp, '8.000 pasos',      'footprints','daily', 1, 1, true),
    (v_h_sleep, v_ws, v_mp, 'Dormir 7-8h',      'moon',      'daily', 1, 2, true),
    (v_h_prot,  v_ws, v_mp, 'Proteína en cada comida', 'drumstick', 'daily', 1, 3, true);

  -- logs: 6-day streak; today only water+steps done (sleep/protein pending → 2/4)
  insert into public.member_habit_logs (habit_id, member_profile_id, workspace_id, logged_on, count)
  select h, v_mp, v_ws, (current_date - g.n), 1
  from (values (v_h_water),(v_h_steps),(v_h_sleep)) as habits(h)
  cross join generate_series(1,5) as g(n);
  insert into public.member_habit_logs (habit_id, member_profile_id, workspace_id, logged_on, count)
  values
    (v_h_water, v_mp, v_ws, current_date, 1),
    (v_h_steps, v_mp, v_ws, current_date, 1);

  -- 4) progress: 5 weekly weigh-ins, gentle downward trend
  delete from public.progress_entries where member_profile_id = v_mp;
  insert into public.progress_entries (member_profile_id, logged_on, weight_kg, waist_cm, notes)
  values
    (v_mp, current_date - 28, 82.0, 86,   'Inicio del bloque'),
    (v_mp, current_date - 21, 81.4, 85,   null),
    (v_mp, current_date - 14, 80.9, 84.5, 'Buena adherencia'),
    (v_mp, current_date - 7,  80.3, 84,   null),
    (v_mp, current_date,      79.8, 83.5, 'Sensaciones altas');
end $$;
