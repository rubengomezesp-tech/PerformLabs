-- ===========================================================================
-- seed-demo-content.sql
-- ---------------------------------------------------------------------------
-- Rich demo content for the "Alex Demo" member so the demo app renders full
-- training and nutrition pages instead of empty states.
--
-- What it seeds (all scoped strictly to the demo member profile
-- d33d0000-0000-4000-8000-000000000002 in the demo workspace resolved via
-- fallback_subdomain = 'demo.performlabs.app'):
--   * 1 active, published assigned_workout_plan (4-day upper/lower split,
--     current_week = 1) with 4 assigned_workout_days at week_number = 1, each
--     populated with 5-6 assigned_workout_exercises (sets / reps / rest / RIR).
--     Exercises reference real public.exercises rows from the base library
--     (workspace_id IS NULL, is_base_library = true) looked up by stable slug.
--   * 1 active, published assigned_meal_plan starting today with 1
--     assigned_meal_plan_day and 4 assigned_meal_plan_items
--     (desayuno / comida / merienda / cena) with titles, calories and macros.
--
-- Why these shapes surface as "today / active" (verified against the repos):
--   * lib/repositories/member-onboarding.ts -> getMemberTrainingContext picks
--     the latest status='active' assigned_workout_plan, then the first day with
--     status != 'completed' AND week_number === current_week (default 1). All
--     seeded days are status='scheduled' at week_number=1, so the first one
--     surfaces as the active day.
--   * lib/repositories/nutrition-tracking.ts -> getMemberMealPlanForToday picks
--     the latest status='active' assigned_meal_plan, then day index
--     daysBetween(starts_on) % dayCount. starts_on = CURRENT_DATE and a single
--     day => index 0 => today's day is always selected.
--
-- Idempotent + demo-scoped: re-runnable. It DELETEs only the demo member's own
-- assigned plans/days/items (member_profile_id = d33d0000-...0002) and inserts
-- fresh rows with deterministic fixed UUIDs (prefix d33d0001-...). It touches
-- NOTHING else (no other member, no templates, no base exercise library).
-- Run AFTER scripts/seed-demo-member.sql (the demo member must already exist).
-- ===========================================================================

do $$
declare
  v_workspace_id uuid;
  v_member_id    uuid := 'd33d0000-0000-4000-8000-000000000002';  -- Alex Demo member_profile
  v_today        date := current_date;

  -- Deterministic fixed UUIDs (prefix d33d0001) so re-runs are stable.
  v_plan_id      uuid := 'd33d0001-0000-4000-8000-000000000001';  -- assigned_workout_plan
  v_meal_plan_id uuid := 'd33d0001-0000-4000-8000-000000000010';  -- assigned_meal_plan
  v_meal_day_id  uuid := 'd33d0001-0000-4000-8000-000000000011';  -- assigned_meal_plan_day

  -- Workout day UUIDs (week 1).
  v_day1 uuid := 'd33d0001-0000-4000-8000-000000000101';  -- Empuje (Upper Push)
  v_day2 uuid := 'd33d0001-0000-4000-8000-000000000102';  -- Tracción (Upper Pull)
  v_day3 uuid := 'd33d0001-0000-4000-8000-000000000103';  -- Pierna (Lower)
  v_day4 uuid := 'd33d0001-0000-4000-8000-000000000104';  -- Full body / metabólico
begin
  -- Resolve the demo workspace robustly (do NOT hardcode the id).
  select w.id
    into v_workspace_id
    from public.workspaces w
   where w.fallback_subdomain = 'demo.performlabs.app'
   limit 1;

  if v_workspace_id is null then
    raise notice 'Demo workspace (fallback_subdomain = demo.performlabs.app) not found; nothing seeded.';
    return;
  end if;

  -- Safety: make sure the demo member profile actually exists in that workspace.
  if not exists (
    select 1 from public.member_profiles mp
     where mp.id = v_member_id and mp.workspace_id = v_workspace_id
  ) then
    raise notice 'Demo member profile % not found in demo workspace %; nothing seeded.', v_member_id, v_workspace_id;
    return;
  end if;

  -- -----------------------------------------------------------------------
  -- 1) Clean slate for THIS demo member only. Child rows (days, exercises,
  --    items) cascade from the parent plan via ON DELETE CASCADE, but we also
  --    delete explicitly by member_profile_id to be exhaustive and scoped.
  -- -----------------------------------------------------------------------
  delete from public.assigned_workout_exercises where member_profile_id = v_member_id;
  delete from public.assigned_workout_days       where member_profile_id = v_member_id;
  delete from public.assigned_workout_plans      where member_profile_id = v_member_id;

  delete from public.assigned_meal_plan_items    where member_profile_id = v_member_id;
  delete from public.assigned_meal_plan_days     where member_profile_id = v_member_id;
  delete from public.assigned_meal_plans         where member_profile_id = v_member_id;

  -- =======================================================================
  -- 2) ASSIGNED WORKOUT PLAN (active, published, week 1)
  -- =======================================================================
  insert into public.assigned_workout_plans
    (id, workspace_id, member_profile_id, source_template_id, name,
     starts_on, ends_on, version, status,
     generation_status, current_week, current_month, days_per_week,
     assignment_goal, assignment_notes, review_status)
  values
    (v_plan_id, v_workspace_id, v_member_id, null,
     'Plan Hipertrofia 4 días',
     v_today, v_today + 84, 1, 'active',
     'published', 1, 1, 4,
     'Ganar masa muscular manteniendo técnica sólida',
     'Progresa el peso cuando completes el rango de reps con 1-2 RIR. Descansa lo pautado entre series.',
     'pending');

  -- --- Day 1: Empuje (pecho / hombro / tríceps) --------------------------
  insert into public.assigned_workout_days
    (id, workspace_id, assigned_workout_plan_id, member_profile_id,
     week_number, month_number, day_number, scheduled_on, title, focus,
     instructions, estimated_minutes, status)
  values
    (v_day1, v_workspace_id, v_plan_id, v_member_id,
     1, 1, 1, v_today, 'Día 1 · Empuje', 'Pecho, hombro y tríceps',
     'Calienta 5-8 min y haz una serie de aproximación en el primer ejercicio.', 60, 'scheduled');

  insert into public.assigned_workout_exercises
    (workspace_id, assigned_workout_day_id, member_profile_id, exercise_id,
     block_type, title, sort_order, sets, reps, tempo, rest_seconds, target_rir, notes)
  values
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'press-banca' and is_base_library = true limit 1),
       'main', 'Press de banca', 1, 4, '6-8', '2-0-1', 150, '1-2', 'Codos a 45°, baja al esternón.'),
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'press-inclinado-mancuernas' and is_base_library = true limit 1),
       'main', 'Press inclinado con mancuernas', 2, 4, '8-10', '2-0-1', 120, '1-2', 'Banco a 30°.'),
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'press-hombros-mancuernas' and is_base_library = true limit 1),
       'main', 'Press de hombros con mancuernas', 3, 3, '10-12', '2-0-1', 90, '1-2', 'Controla la bajada.'),
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'elevaciones-laterales' and is_base_library = true limit 1),
       'accessory', 'Elevaciones laterales', 4, 3, '12-15', '2-0-1', 60, '0-1', 'Sin balanceo.'),
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'extension-triceps-cuerda' and is_base_library = true limit 1),
       'accessory', 'Extensión con cuerda en polea', 5, 3, '12-15', '2-0-1', 60, '0-1', 'Abre la cuerda al final.'),
    (v_workspace_id, v_day1, v_member_id,
       (select id from public.exercises where slug = 'press-frances' and is_base_library = true limit 1),
       'accessory', 'Press francés', 6, 3, '10-12', '2-0-1', 75, '1-2', 'Codos quietos.');

  -- --- Day 2: Tracción (espalda / bíceps) --------------------------------
  insert into public.assigned_workout_days
    (id, workspace_id, assigned_workout_plan_id, member_profile_id,
     week_number, month_number, day_number, scheduled_on, title, focus,
     instructions, estimated_minutes, status)
  values
    (v_day2, v_workspace_id, v_plan_id, v_member_id,
     1, 1, 2, v_today + 1, 'Día 2 · Tracción', 'Espalda y bíceps',
     'Prioriza apretar las escápulas en cada repetición.', 60, 'scheduled');

  insert into public.assigned_workout_exercises
    (workspace_id, assigned_workout_day_id, member_profile_id, exercise_id,
     block_type, title, sort_order, sets, reps, tempo, rest_seconds, target_rir, notes)
  values
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'dominadas' and is_base_library = true limit 1),
       'main', 'Dominadas', 1, 4, '6-8', '2-0-1', 150, '1-2', 'Pecho a la barra; usa asistencia si hace falta.'),
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'remo-barra' and is_base_library = true limit 1),
       'main', 'Remo con barra', 2, 4, '8-10', '2-0-1', 120, '1-2', 'Torso a 45°, barra al abdomen.'),
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'jalon-pecho' and is_base_library = true limit 1),
       'main', 'Jalón al pecho', 3, 3, '10-12', '2-0-1', 90, '1-2', 'Baja las escápulas, sin balanceo.'),
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'face-pull' and is_base_library = true limit 1),
       'accessory', 'Face pull', 4, 3, '15-20', '2-0-1', 60, '0-1', 'Aprieta el deltoide posterior.'),
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'curl-barra' and is_base_library = true limit 1),
       'accessory', 'Curl con barra', 5, 3, '10-12', '2-0-1', 75, '1-2', 'Codos pegados, sin impulso.'),
    (v_workspace_id, v_day2, v_member_id,
       (select id from public.exercises where slug = 'curl-martillo' and is_base_library = true limit 1),
       'accessory', 'Curl martillo', 6, 3, '12-15', '2-0-1', 60, '0-1', 'Palmas enfrentadas.');

  -- --- Day 3: Pierna -----------------------------------------------------
  insert into public.assigned_workout_days
    (id, workspace_id, assigned_workout_plan_id, member_profile_id,
     week_number, month_number, day_number, scheduled_on, title, focus,
     instructions, estimated_minutes, status)
  values
    (v_day3, v_workspace_id, v_plan_id, v_member_id,
     1, 1, 3, v_today + 3, 'Día 3 · Pierna', 'Cuádriceps, femoral y glúteo',
     'Calienta bien la cadera y la rodilla antes de cargar.', 65, 'scheduled');

  insert into public.assigned_workout_exercises
    (workspace_id, assigned_workout_day_id, member_profile_id, exercise_id,
     block_type, title, sort_order, sets, reps, tempo, rest_seconds, target_rir, notes)
  values
    (v_workspace_id, v_day3, v_member_id,
       (select id from public.exercises where slug = 'sentadilla-barra' and is_base_library = true limit 1),
       'main', 'Sentadilla con barra', 1, 4, '6-8', '2-0-1', 180, '1-2', 'Rompe paralela con el pecho alto.'),
    (v_workspace_id, v_day3, v_member_id,
       (select id from public.exercises where slug = 'peso-muerto-rumano' and is_base_library = true limit 1),
       'main', 'Peso muerto rumano', 2, 4, '8-10', '3-0-1', 150, '1-2', 'Cadera atrás, estira el femoral.'),
    (v_workspace_id, v_day3, v_member_id,
       (select id from public.exercises where slug = 'prensa-piernas' and is_base_library = true limit 1),
       'main', 'Prensa de piernas', 3, 3, '10-12', '2-0-1', 120, '1-2', 'No bloquees rodillas arriba.'),
    (v_workspace_id, v_day3, v_member_id,
       (select id from public.exercises where slug = 'curl-femoral-tumbado' and is_base_library = true limit 1),
       'accessory', 'Curl femoral tumbado', 4, 3, '12-15', '2-0-1', 75, '0-1', 'Lleva el talón al glúteo.'),
    (v_workspace_id, v_day3, v_member_id,
       (select id from public.exercises where slug = 'elevacion-gemelos-pie' and is_base_library = true limit 1),
       'accessory', 'Elevación de gemelos de pie', 5, 4, '12-15', '2-1-1', 60, '0-1', 'Pausa arriba un segundo.');

  -- --- Day 4: Full body / metabólico ------------------------------------
  insert into public.assigned_workout_days
    (id, workspace_id, assigned_workout_plan_id, member_profile_id,
     week_number, month_number, day_number, scheduled_on, title, focus,
     instructions, estimated_minutes, status)
  values
    (v_day4, v_workspace_id, v_plan_id, v_member_id,
     1, 1, 4, v_today + 5, 'Día 4 · Cuerpo completo', 'Fuerza y core',
     'Ritmo continuo; cuida la técnica al final del entreno.', 55, 'scheduled');

  insert into public.assigned_workout_exercises
    (workspace_id, assigned_workout_day_id, member_profile_id, exercise_id,
     block_type, title, sort_order, sets, reps, tempo, rest_seconds, target_rir, notes)
  values
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'hip-thrust' and is_base_library = true limit 1),
       'main', 'Hip thrust', 1, 4, '8-10', '2-1-1', 120, '1-2', 'Aprieta glúteo arriba.'),
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'press-hombros-mancuernas' and is_base_library = true limit 1),
       'main', 'Press de hombros con mancuernas', 2, 3, '10-12', '2-0-1', 90, '1-2', 'Controla la bajada.'),
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'remo-mancuerna' and is_base_library = true limit 1),
       'main', 'Remo con mancuerna', 3, 3, '10-12', '2-0-1', 90, '1-2', 'Lleva el codo atrás.'),
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'zancadas' and is_base_library = true limit 1),
       'accessory', 'Zancadas', 4, 3, '10-12', '2-0-1', 75, '1-2', 'Por pierna; empuja con el talón.'),
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'plancha' and is_base_library = true limit 1),
       'accessory', 'Plancha', 5, 3, '40-60 s', null, 45, '0-1', 'Cuerpo en línea, abdomen firme.'),
    (v_workspace_id, v_day4, v_member_id,
       (select id from public.exercises where slug = 'rueda-abdominal' and is_base_library = true limit 1),
       'accessory', 'Rueda abdominal', 6, 3, '8-12', '3-0-1', 60, '1-2', 'Sin arquear la lumbar.');

  -- =======================================================================
  -- 3) ASSIGNED MEAL PLAN (active, published, starts today)
  -- =======================================================================
  insert into public.assigned_meal_plans
    (id, workspace_id, member_profile_id, source_template_id, name,
     starts_on, ends_on, target_calories, target_protein_g, target_carbs_g, target_fat_g,
     version, status,
     generation_status, meals_per_day, water_target_ml, fiber_target_g, hide_macros, review_status)
  values
    (v_meal_plan_id, v_workspace_id, v_member_id, null,
     'Plan Nutrición · Volumen limpio',
     v_today, v_today + 28, 2400, 180, 250, 70,
     1, 'active',
     'published', 4, 2500, 35, false, 'pending');

  insert into public.assigned_meal_plan_days
    (id, workspace_id, assigned_meal_plan_id, member_profile_id,
     day_number, title, target_calories, target_protein_g, target_carbs_g, target_fat_g, notes)
  values
    (v_meal_day_id, v_workspace_id, v_meal_plan_id, v_member_id,
     1, 'Día de entreno', 2400, 180, 250, 70,
     'Reparte la proteína entre las 4 comidas; bebe ~2,5 L de agua.');

  insert into public.assigned_meal_plan_items
    (workspace_id, assigned_meal_plan_day_id, member_profile_id, recipe_id,
     meal_slot, title, serving_multiplier, calories, protein_g, carbs_g, fat_g, instructions, sort_order)
  values
    (v_workspace_id, v_meal_day_id, v_member_id, null,
     'desayuno', 'Avena con claras, plátano y mantequilla de cacahuete', 1,
     560, 38, 70, 16, 'Cuece 80 g de avena, añade 4 claras, medio plátano y 15 g de mantequilla de cacahuete.', 1),
    (v_workspace_id, v_meal_day_id, v_member_id, null,
     'comida', 'Pollo a la plancha con arroz y verduras', 1,
     720, 55, 85, 16, '180 g de pechuga, 90 g de arroz en seco y ensalada o verduras al gusto.', 2),
    (v_workspace_id, v_meal_day_id, v_member_id, null,
     'merienda', 'Yogur griego con frutos rojos y nueces', 1,
     360, 27, 30, 14, '200 g de yogur griego, un puñado de frutos rojos y 15 g de nueces.', 3),
    (v_workspace_id, v_meal_day_id, v_member_id, null,
     'cena', 'Salmón al horno con patata y espárragos', 1,
     760, 48, 60, 28, '170 g de salmón, 250 g de patata y espárragos a la plancha con aceite de oliva.', 4);

  raise notice 'Demo content seeded for member % in workspace %.', v_member_id, v_workspace_id;
end $$;
