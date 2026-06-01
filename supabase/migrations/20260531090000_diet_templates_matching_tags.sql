-- Diet-matching engine: tag diet_templates across the matrix dimensions so
-- selectDietTemplate() (lib/domain/diet-matcher.ts) can hard-filter + score, and
-- open the table to a white-label base library (mirror of workout_templates in
-- 20260531070000 + 20260531080000). Additive and backward-compatible: existing
-- goal/tags/ratios are untouched; null goal_tag/diet_style/meals_per_day act as
-- wildcards in the matcher. Reads are server-side (service client), so no RLS
-- change is required; the column + nullable FK are the core.

-- 1) Matching tags + base-library flag.
alter table public.diet_templates
  add column if not exists goal_tag text,
  add column if not exists diet_style text not null default 'omnivore',
  add column if not exists meals_per_day int,
  add column if not exists is_base_library boolean not null default false;

-- 2) White-label base library: authored once (workspace_id null, is_base_library
--    true) and inherited by every brand, exactly like recipes/exercises.
alter table public.diet_templates alter column workspace_id drop not null;

comment on column public.diet_templates.goal_tag is 'Canonical goal: fat_loss|hypertrophy|recomposition (null = wildcard).';
comment on column public.diet_templates.diet_style is 'omnivore|vegetarian|vegan (default omnivore). Hard exclusion in the matcher.';
comment on column public.diet_templates.meals_per_day is 'Meals the template materialises (3|4|5). null = wildcard.';
comment on column public.diet_templates.is_base_library is
  'Platform-shared diet template (workspace_id null). Inherited by every brand via the base-library matrix.';

-- 3) Best-effort backfill of goal_tag from the existing free-text goal/name/tags,
--    matching lib/domain/diet-matcher.normalizeGoal conventions.
update public.diet_templates set goal_tag = case
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'') || ' ' || array_to_string(tags,' ')) ~ 'defin|fat|perder|deficit|adelgaz|loss|grasa' then 'fat_loss'
  when lower(coalesce(goal,'') || ' ' || coalesce(name,'') || ' ' || array_to_string(tags,' ')) ~ 'hipertrof|volumen|masa|muscle|bulk|gain|superavit' then 'hypertrophy'
  else 'recomposition' end
where goal_tag is null;

-- 4) Infer diet_style from existing tags where explicit (vegan wins over vegetarian).
update public.diet_templates set diet_style = case
  when lower(array_to_string(tags,' ')) ~ 'vegan|vegana' then 'vegan'
  when lower(array_to_string(tags,' ')) ~ 'vegetarian|vegetariana' then 'vegetarian'
  else diet_style end;

create index if not exists diet_templates_match_idx
  on public.diet_templates (workspace_id, goal_tag, diet_style, meals_per_day);
create index if not exists diet_templates_base_idx
  on public.diet_templates (is_base_library) where is_base_library;
