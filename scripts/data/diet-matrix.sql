-- Platform diet matrix (base-library). Idempotent; NOT applied to prod yet.
-- Sibling of scripts/data/program-matrix.sql. Generates base-library diet templates
--   = goal (definicion/volumen/recomp) × diet_style (omnivora/vegetariana)
-- tagged for lib/domain/diet-matcher.selectDietTemplate, with diet_template_meals
-- populated from the 24 base recipes (is_base_library) filtered by meal_slot AND a
-- style-compatible tag, ranked by goal affinity then protein.
--
-- Re-running is safe (NOT EXISTS guards on stable slug-like names + recipe ids).
-- Requires migration 20260531090000_diet_templates_matching_tags.sql
--   (workspace_id nullable + is_base_library + goal_tag + diet_style + meals_per_day).
--
-- VEGAN IS DELIBERATELY OMITTED: the 24 base recipes have 0 vegan desayuno and 0
-- vegan cena, so a vegan template cannot be fully populated. Seed vegan recipes
-- (>=1 per meal_slot) before adding ('vegana') to the styles list below.
--
-- Expected output (validated read-only against the live recipe library):
--   diet_templates inserted     : 6   (2 styles × 3 goals)
--   diet_template_meals inserted : 42  (omnivora 3×8=24, vegetariana 3×6=18)

-- 1) 6 base templates: goal × style. Macro ratios per goal feed calculateNutritionTargets
--    (protein_ratio*10 → proteinPerKg, fat_ratio → fatRatio in assignDietTemplateToMember).
insert into public.diet_templates
  (name, goal, goal_tag, diet_style, meals_per_day, tags, status, workspace_id, is_base_library,
   protein_ratio, carbs_ratio, fat_ratio)
select
  (case g.goal when 'fat_loss' then 'Definicion' when 'hypertrophy' then 'Volumen' else 'Recomp' end)
   ||' '|| (case st.style when 'omnivora' then 'Omnivora' else 'Vegetariana' end) ||' base',
  (case g.goal when 'fat_loss' then 'Definicion' when 'hypertrophy' then 'Volumen' else 'Recomposicion' end),
  g.goal,
  (case st.style when 'omnivora' then 'omnivore' else 'vegetarian' end),
  st.meals,
  (case g.goal when 'fat_loss' then array['definicion','alta-proteina']
               when 'hypertrophy' then array['volumen','alta-proteina']
               else array['recomp','alta-proteina'] end)
    || (case st.style when 'vegetariana' then array['vegetariana'] else array[]::text[] end),
  'active'::plan_status, null, true,
  (case g.goal when 'fat_loss' then 0.24 when 'hypertrophy' then 0.20 else 0.22 end),  -- protein_ratio*10 = g/kg
  null,
  (case g.goal when 'fat_loss' then 0.25 when 'hypertrophy' then 0.27 else 0.26 end)   -- fat ratio
from (values ('fat_loss'),('hypertrophy'),('recomposition')) g(goal)
cross join (values ('omnivora',4),('vegetariana',4)) st(style, meals)
where not exists (
  select 1 from public.diet_templates d
  where d.is_base_library
    and d.name = (case g.goal when 'fat_loss' then 'Definicion' when 'hypertrophy' then 'Volumen' else 'Recomp' end)
      ||' '|| (case st.style when 'omnivora' then 'Omnivora' else 'Vegetariana' end) ||' base'
);

-- 2) diet_template_meals: for each template, pick up to 2 recipes per meal_slot
--    (desayuno/comida/cena/snack), filtered by the template's style and ranked by
--    goal affinity → protein. day_number=1 (single-day template, materialised per
--    member by materializeMealPlan). serving_multiplier=1 (scaled at assignment time).
with tmpl as (
  select id, goal_tag, diet_style from public.diet_templates where is_base_library
),
base as (
  select id as recipe_id, slug, meal_slot, tags from public.recipes where is_base_library
),
elig as (
  select t.id as diet_template_id, b.meal_slot, b.recipe_id,
    row_number() over (
      partition by t.id, b.meal_slot
      order by
        -- goal affinity: recipe carrying the canonical goal tag first
        (case
           when t.goal_tag='fat_loss'    and 'definicion'=any(b.tags) then 0
           when t.goal_tag='hypertrophy' and 'volumen'=any(b.tags)    then 0
           when t.goal_tag='recomposition' and ('definicion'=any(b.tags) or 'volumen'=any(b.tags)) then 0
           else 1 end),
        (case when 'alta-proteina'=any(b.tags) then 0 else 1 end),
        b.slug
    ) as rn
  from tmpl t
  join base b on (
    -- style exclusion mirrors diet-matcher.styleOk (vegan ⊆ vegetarian ⊆ omnivore):
    -- omnivore templates accept any recipe; vegetarian accept vegetariana OR vegana.
    t.diet_style='omnivore'
    or (t.diet_style='vegetarian' and ('vegetariana'=any(b.tags) or 'vegana'=any(b.tags)))
  )
)
insert into public.diet_template_meals
  (diet_template_id, day_number, meal_slot, recipe_id, serving_multiplier, sort_order)
select e.diet_template_id, 1, e.meal_slot, e.recipe_id, 1,
  -- stable sort: slot order then in-slot rank
  array_position(array['desayuno','comida','cena','snack'], e.meal_slot) * 10 + e.rn
from elig e
where e.rn <= 2
  and not exists (
    select 1 from public.diet_template_meals m
    where m.diet_template_id = e.diet_template_id and m.recipe_id = e.recipe_id
  );

-- 3) Validation (run after applying): every referenced recipe must exist, be
--    base-library, and respect the template's style. Expect zero rows.
-- select dt.name, dt.diet_style, r.slug, r.tags
-- from diet_template_meals m
-- join diet_templates dt on dt.id = m.diet_template_id and dt.is_base_library
-- join recipes r on r.id = m.recipe_id
-- where r.is_base_library is not true
--    or (dt.diet_style='vegetarian' and not ('vegetariana'=any(r.tags) or 'vegana'=any(r.tags)))
--    or (dt.diet_style='vegan'      and not ('vegana'=any(r.tags)));
