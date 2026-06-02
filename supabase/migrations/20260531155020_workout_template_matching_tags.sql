-- Program-matching engine: tag workout_templates across the matrix dimensions so
-- selectProgram() (lib/domain/program-matcher.ts) can hard-filter + score.
-- Additive and backward-compatible: existing goal/level/days_per_week/duration_weeks
-- are untouched; null location/sex/minutes act as wildcards in the matcher.

alter table public.workout_templates
  add column if not exists goal_tag text,
  add column if not exists target_sex text not null default 'any',
  add column if not exists location text,
  add column if not exists session_minutes int,
  add column if not exists required_equipment text[] not null default '{}';

comment on column public.workout_templates.goal_tag is 'Canonical goal: fat_loss|hypertrophy|strength|recomposition|mobility.';
comment on column public.workout_templates.target_sex is 'male|female|any (default any = wildcard).';
comment on column public.workout_templates.location is 'gym|home|outdoor (null = wildcard).';
comment on column public.workout_templates.session_minutes is 'Matrix bucket 30|60 (null = wildcard).';

-- Best-effort backfill of goal_tag from the existing free-text goal/name.
update public.workout_templates set goal_tag = case
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'')) ~ 'defin|fat|perder|deficit|adelgaz' then 'fat_loss'
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'')) ~ 'hipertrof|volumen|masa|muscle|bulk' then 'hypertrophy'
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'')) ~ 'fuerza|strength|rendimiento|performance' then 'strength'
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'')) ~ 'movilidad|salud|mobility|health' then 'mobility'
  else 'recomposition' end
where goal_tag is null;

-- Infer sex from the template name where it is explicit (MacroActive-style naming).
update public.workout_templates set target_sex = case
  when lower(name) ~ 'mujer|female|femenino' then 'female'
  when lower(name) ~ 'hombre|male|masculino' then 'male'
  else target_sex end;

create index if not exists workout_templates_match_idx
  on public.workout_templates (workspace_id, days_per_week, target_sex, location, session_minutes);
