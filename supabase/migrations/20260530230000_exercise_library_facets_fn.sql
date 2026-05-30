-- DB-side facet aggregation for the exercise library so the console no longer
-- re-reads ~1000 rows (+ their videos) per request to compute filter chips.
-- Idempotent (create or replace); safe to re-run.
create or replace function public.exercise_library_facets(p_workspace_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $func$
  with scoped as (
    select id, muscle_groups, equipment, difficulty, image_urls, default_video_url, is_base_library
    from public.exercises
    where workspace_id is null or workspace_id = p_workspace_id
  ),
  vids as (
    select distinct exercise_id from public.exercise_videos where workspace_id = p_workspace_id
  )
  select jsonb_build_object(
    'muscles', coalesce((select jsonb_agg(v order by v) from (select distinct trim(m) v from scoped, unnest(muscle_groups) m where coalesce(trim(m), '') <> '') t), '[]'::jsonb),
    'equipment', coalesce((select jsonb_agg(v order by v) from (select distinct trim(e) v from scoped, unnest(equipment) e where coalesce(trim(e), '') <> '') t), '[]'::jsonb),
    'levels', coalesce((select jsonb_agg(v order by v) from (select distinct difficulty v from scoped where coalesce(difficulty, '') <> '') t), '[]'::jsonb),
    'total', (select count(*) from scoped),
    'with_images', (select count(*) from scoped where jsonb_array_length(coalesce(image_urls, '[]'::jsonb)) > 0),
    'with_video', (select count(*) from scoped s where coalesce(s.default_video_url, '') <> '' or s.id in (select exercise_id from vids)),
    'brand_only', (select count(*) from scoped where is_base_library = false)
  );
$func$;

grant execute on function public.exercise_library_facets(uuid) to service_role;
