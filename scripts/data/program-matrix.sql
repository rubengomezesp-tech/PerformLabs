-- Platform program matrix (base-library). Idempotent; applied to prod via the
-- Supabase MCP. Generates 96 programs × 3 months × days × exercises (6480 rows)
-- from the live exercise library, tagged for lib/domain/program-matcher.selectProgram.
-- Re-running is safe (NOT EXISTS guards). Requires migration
-- 20260531080000_workout_templates_base_library.sql (workspace_id nullable + is_base_library).

-- 1) 96 base programs: goal × sex × place × days(3-6) × minutes(30/60)
insert into workout_templates
  (name, goal, level, days_per_week, status, duration_weeks, workspace_id, is_base_library, goal_tag, target_sex, location, session_minutes, required_equipment)
select
  (case g.goal when 'hypertrophy' then 'Hipertrofia' when 'fat_loss' then 'Perder grasa' else 'Recomp' end)
   ||' '|| (case s.sex when 'male' then 'Hombre' else 'Mujer' end)
   ||' '|| (case p.place when 'gym' then 'Gym' else 'Casa' end)
   ||' '|| d.days||'D/'||mi.min,
  g.goal, 'intermediate', d.days, 'active'::plan_status, 12, null, true,
  g.goal, s.sex, p.place, mi.min, '{}'::text[]
from (values ('hypertrophy'),('fat_loss'),('recomposition')) g(goal)
cross join (values ('male'),('female')) s(sex)
cross join (values ('gym'),('home')) p(place)
cross join (values (3),(4),(5),(6)) d(days)
cross join (values (30),(60)) mi(min)
where not exists (
  select 1 from workout_templates w where w.is_base_library and w.name =
    (case g.goal when 'hypertrophy' then 'Hipertrofia' when 'fat_loss' then 'Perder grasa' else 'Recomp' end)
     ||' '|| (case s.sex when 'male' then 'Hombre' else 'Mujer' end)
     ||' '|| (case p.place when 'gym' then 'Gym' else 'Casa' end)
     ||' '|| d.days||'D/'||mi.min
);

-- 2) Days: 3 months (M1/M2/M3, week 2/6/10 → month_number generated) × the day-split.
insert into workout_template_days
  (template_id, week_number, day_number, phase_title, focus, intensity, estimated_minutes, title, notes)
select w.id, mo.month*4-2, s.day_number, mo.phase, s.focus, mo.intensity, w.session_minutes,
  (case w.target_sex when 'male' then 'Hombre' else 'Mujer' end)||' '||
  (case w.goal_tag when 'hypertrophy' then 'Hipertrofia' when 'fat_loss' then 'Perder grasa' else 'Recomp' end)||
  ' M'||mo.month||'/'||w.days_per_week||'D/'||w.session_minutes||'/D'||s.day_number||' · '||s.focus,
  mo.phase
from workout_templates w
join (values
  (3,1,'Push'),(3,2,'Pull'),(3,3,'Legs'),
  (4,1,'Upper'),(4,2,'Lower'),(4,3,'Upper'),(4,4,'Lower'),
  (5,1,'Push'),(5,2,'Pull'),(5,3,'Legs'),(5,4,'Upper'),(5,5,'Lower'),
  (6,1,'Push'),(6,2,'Pull'),(6,3,'Legs'),(6,4,'Push'),(6,5,'Pull'),(6,6,'Legs')
) s(days, day_number, focus) on s.days = w.days_per_week
cross join (values (1,'Base tecnica','moderada'),(2,'Progresion','alta'),(3,'Especializacion','alta')) mo(month, phase, intensity)
where w.is_base_library
  and not exists (select 1 from workout_template_days d where d.template_id=w.id and d.week_number=mo.month*4-2 and d.day_number=s.day_number);

-- 3) Exercises: per (template, day) pool ranked strength-first, sliced by month so
--    M1/M2/M3 use different lifts. 4 exercises for 30-min days, 6 for 60-min. Mains
--    (sort_order<=2) are never stretch/plyometrics/cardio.
with
fm(focus, muscle) as (values
  ('Push','chest'),('Push','pecho'),('Push','shoulders'),('Push','hombros'),('Push','triceps'),('Push','tríceps'),
  ('Pull','lats'),('Pull','middle back'),('Pull','espalda'),('Pull','biceps'),('Pull','bíceps'),('Pull','traps'),('Pull','trapecio'),
  ('Legs','quadriceps'),('Legs','cuádriceps'),('Legs','hamstrings'),('Legs','isquios'),('Legs','femoral'),('Legs','glutes'),('Legs','glúteos'),('Legs','calves'),('Legs','gemelos'),
  ('Upper','chest'),('Upper','pecho'),('Upper','lats'),('Upper','espalda'),('Upper','shoulders'),('Upper','hombros'),('Upper','triceps'),('Upper','tríceps'),('Upper','biceps'),('Upper','bíceps'),
  ('Lower','quadriceps'),('Lower','cuádriceps'),('Lower','hamstrings'),('Lower','isquios'),('Lower','femoral'),('Lower','glutes'),('Lower','glúteos'),('Lower','calves'),('Lower','gemelos')
),
slots as (
  select distinct w.id as template_id, d.day_number, d.focus, w.location as place,
    (case when w.session_minutes=30 then 4 else 6 end) as per_day
  from workout_templates w
  join workout_template_days d on d.template_id=w.id
  where w.is_base_library
),
pool as (
  select sl.template_id, sl.day_number, sl.per_day, e.id as exercise_id,
    row_number() over (
      partition by sl.template_id, sl.day_number
      order by
        (case when (e.movement_category is null or lower(e.movement_category) not in ('stretching','plyometrics','cardio'))
              and e.name !~* '(jump|stretch|flutter|plyo|burpee|hop|skip|mountain climber|wall sit|jumping|salto)' then 0 else 1 end),
        (case when e.mechanic='compound' then 0 else 1 end),
        md5(sl.template_id::text||sl.day_number::text||e.id::text)
    ) as rn
  from slots sl
  join exercises e
    on exists (select 1 from fm where fm.focus=sl.focus and exists (select 1 from unnest(e.muscle_groups) mg where lower(mg)=fm.muscle))
   and exists (select 1 from unnest(e.locations) lo where lower(lo)=sl.place)
   and (sl.place<>'home' or e.equipment is null or not exists (
         select 1 from unnest(e.equipment) eq where lower(eq) in ('barbell','cable','machine','máquina','barra','polea','e-z curl bar')
       ))
  group by sl.template_id, sl.day_number, sl.per_day, e.id, e.name, e.movement_category, e.mechanic
)
insert into workout_template_exercises (day_id, exercise_id, sort_order, block_type, sets, reps, rest_seconds, target_rir)
select d.id, p.exercise_id,
  (p.rn - (d.week_number/4)*p.per_day),
  case when (p.rn - (d.week_number/4)*p.per_day) <= 2 then 'main' else 'accessory' end,
  4,
  case w.goal_tag when 'fat_loss' then '10-15' when 'hypertrophy' then '8-12' else '8-12' end,
  case w.goal_tag when 'fat_loss' then 75 else 120 end,
  '1-3'
from pool p
join workout_templates w on w.id = p.template_id
join workout_template_days d on d.template_id = p.template_id and d.day_number = p.day_number
where p.rn > (d.week_number/4)*p.per_day
  and p.rn <= (d.week_number/4 + 1)*p.per_day
  and not exists (select 1 from workout_template_exercises x where x.day_id=d.id and x.exercise_id=p.exercise_id);
