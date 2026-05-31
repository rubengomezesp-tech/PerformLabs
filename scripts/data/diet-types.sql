-- Diet types extension (base-library). Idempotent; NOT applied to prod yet.
-- Extends scripts/data/diet-matrix.sql (omnivora/vegetariana × 3 goals) with the
-- remaining diet types the onboarding quiz already offers:
--   STYLE     : pescetariana, vegana            (protein-source hierarchy)
--   EXCLUSION : sin gluten, sin lactosa, halal  (sin-<x> / halal tags)
--   MACRO     : keto                            (fat_ratio 0.70 + low carbs)
-- Model + sources: docs/diet-types.md. Matcher: lib/domain/diet-matcher.ts
--   (styleOk pescetarian rank, halalOk, ketoOk).
--
-- Requires migration 20260531090000_diet_templates_matching_tags.sql and the base
-- recipe/ingredient library (20260530110000_food_library + scripts/data/base-recipes.sql).
-- Re-running is safe: every insert is guarded by NOT EXISTS on stable slugs/names.
--
-- ORDER MATTERS: run a → b → c → d in one transaction. Keto/vegan templates (c) only
-- populate (d) once their recipes (b) and ingredients (a) exist.
--
-- Expected output (validated read-only against the live library; see the dry-run
-- report in the PR description):
--   a) ingredients inserted        : 6
--   b) recipes inserted            : 9    recipe_ingredients inserted : 39
--   c) diet_templates inserted     : 18   (6 styles/profiles × 3 goals)
--   d) diet_template_meals inserted: 126
--        pescetariana 3×8=24 · sin-gluten 3×8=24 · sin-lactosa 3×8=24 · halal 3×8=24
--        vegana 3×6=18 · keto 3×4=12  (keto/vegana have <2 recipes in some slots)

begin;

-- ============================================================================
-- a) New ingredients (per 100 g). Reuses the existing 40-item palette elsewhere;
--    these unblock keto fats + vegan plant proteins. Macros ~ USDA / label values.
-- ============================================================================
with v(name,slug,kcal,protein,carbs,fat,allergens,tags) as (values
  ('Salmón ahumado','salmon-ahumado',117,18.0,0.0,4.3,ARRAY['pescado']::text[],ARRAY['base']::text[]),
  ('Tofu firme','tofu-firme',144,17.0,2.8,9.0,ARRAY['soja']::text[],ARRAY['base']::text[]),
  ('Bebida de soja','bebida-de-soja',43,3.3,1.8,1.8,ARRAY['soja']::text[],ARRAY['base']::text[]),
  ('Proteína vegetal (polvo)','proteina-vegetal-polvo',375,78.0,6.0,5.0,ARRAY['soja']::text[],ARRAY['base']::text[]),
  ('Semillas de chía','semillas-de-chia',486,17.0,42.0,31.0,ARRAY[]::text[],ARRAY['base']::text[]),
  ('Aceite de coco','aceite-de-coco',862,0.0,0.0,100.0,ARRAY[]::text[],ARRAY['base']::text[])
)
insert into public.ingredients
  (name,slug,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,allergens,tags,is_base_library,workspace_id)
select v.name,v.slug,v.kcal,v.protein,v.carbs,v.fat,v.allergens,v.tags,true,null
from v
where not exists (select 1 from public.ingredients i where i.slug = v.slug);

-- ============================================================================
-- b) New recipes (9) + their ingredients. Mirrors scripts/data/base-recipes.json /
--    extra-recipes.json. Keto carbs verified <=9% (docs/diet-types.md).
-- ============================================================================
with v(name,slug,meal_slot,instructions,tags,image_url) as (values
  ('Huevos revueltos con aguacate y salmón ahumado','huevos-revueltos-aguacate-salmon-ahumado','desayuno','Bate los huevos con una pizca de sal y cuájalos a fuego suave con la mitad del aceite, removiendo para dejarlos cremosos. Lamina el aguacate y disponlo al lado. Acompaña con el salmón ahumado y termina con el aceite de oliva restante y pimienta.',ARRAY['keto','alta-proteina','sin-gluten','sin-lactosa','halal']::text[],'/seed/recipes/huevos-revueltos-aguacate-salmon-ahumado.webp'),
  ('Salmón con aguacate y espinacas salteadas','salmon-aguacate-espinacas-salteadas','comida','Salpimienta el salmón y márcalo en una sartén con la mitad del aceite, 3-4 minutos por lado. Saltea las espinacas con el aceite restante hasta que reduzcan. Emplata el salmón sobre las espinacas y acompaña con el aguacate en láminas.',ARRAY['keto','alta-proteina','sin-gluten','sin-lactosa','halal','omega-3']::text[],'/seed/recipes/salmon-aguacate-espinacas-salteadas.webp'),
  ('Pollo al horno con brócoli y aceite de oliva','pollo-horno-brocoli-aceite-oliva','cena','Salpimienta la pechuga de pollo y hornéala a 200C durante 18-20 minutos con la mitad del aceite. Cuece el brócoli al vapor 6-8 minutos y saltéalo con el aceite restante. Sirve el pollo con el brócoli y un chorrito de aceite de oliva por encima.',ARRAY['keto','alta-proteina','sin-gluten','sin-lactosa','halal']::text[],'/seed/recipes/pollo-horno-brocoli-aceite-oliva.webp'),
  ('Huevos cocidos con aguacate y nueces','huevos-cocidos-aguacate-nueces','snack','Cuece los huevos 9-10 minutos, enfríalos y pélalos. Córtalos por la mitad y disponlos junto al aguacate en láminas. Espolvorea las nueces troceadas, riega con el aceite de oliva y sazona al gusto.',ARRAY['keto','vegetariana','sin-gluten','sin-lactosa','halal']::text[],'/seed/recipes/huevos-cocidos-aguacate-nueces.webp'),
  ('Porridge vegano de avena, soja y plátano','porridge-vegano-avena-soja-platano','desayuno','Cuece la avena con la bebida de soja a fuego medio removiendo hasta espesar. Retira del fuego e incorpora la proteína vegetal hasta integrar. Corona con el plátano en rodajas y las semillas de chía por encima.',ARRAY['vegana','vegetariana','sin-lactosa','alta-proteina']::text[],'/seed/recipes/porridge-vegano-avena-soja-platano.webp'),
  ('Tofu salteado con quinoa y verduras','tofu-salteado-quinoa-verduras','cena','Escurre y corta el tofu en dados, y dóralo en una sartén con la mitad del aceite hasta que esté crujiente. Añade el calabacín y el pimiento en dados y saltea 4-5 minutos. Incorpora la quinoa cocida, mezcla bien con el aceite restante y sirve caliente.',ARRAY['vegana','vegetariana','sin-gluten','sin-lactosa','alta-proteina']::text[],'/seed/recipes/tofu-salteado-quinoa-verduras.webp'),
  ('Bowl de yogur griego con frutos rojos y semillas','bowl-yogur-griego-frutos-rojos-semillas','desayuno','Pon el yogur griego en un bol y alisa la superficie. Reparte por encima los frutos rojos y las almendras laminadas. Espolvorea las semillas de chía y termina con un hilo de miel. Sin cereales con gluten.',ARRAY['alta-proteina','vegetariana','sin-gluten','definicion']::text[],'/seed/recipes/bowl-yogur-griego-frutos-rojos-semillas.webp'),
  ('Revuelto de tofu con espinacas y tomate','revuelto-tofu-espinacas-tomate','desayuno','Desmenuza el tofu firme y saltéalo en una sartén con la mitad del aceite hasta que se dore, con una pizca de cúrcuma y sal. Añade las espinacas y el tomate troceado y cocina 3-4 minutos hasta que reduzcan. Termina con el aceite restante.',ARRAY['vegana','vegetariana','sin-lactosa','sin-gluten','alta-proteina']::text[],'/seed/recipes/revuelto-tofu-espinacas-tomate.webp'),
  ('Batido vegano de proteína, plátano y soja','batido-vegano-proteina-platano-soja','snack','Pela el plátano y trocéalo. Añade la bebida de soja, la proteína vegetal y la mantequilla de cacahuete. Tritura hasta obtener una textura cremosa y sirve al momento.',ARRAY['vegana','vegetariana','sin-lactosa','sin-gluten','alta-proteina','volumen']::text[],'/seed/recipes/batido-vegano-proteina-platano-soja.webp')
)
insert into public.recipes (name,slug,meal_slot,instructions,tags,image_url,is_base_library,workspace_id)
select v.name,v.slug,v.meal_slot,v.instructions,v.tags,v.image_url,true,null
from v
where not exists (select 1 from public.recipes r where r.slug = v.slug);

with ri(recipe_slug,ingredient_slug,grams,sort_order) as (values
  ('huevos-revueltos-aguacate-salmon-ahumado','huevo-entero',150,0),
  ('huevos-revueltos-aguacate-salmon-ahumado','aguacate',80,1),
  ('huevos-revueltos-aguacate-salmon-ahumado','salmon-ahumado',60,2),
  ('huevos-revueltos-aguacate-salmon-ahumado','aceite-de-oliva',8,3),
  ('salmon-aguacate-espinacas-salteadas','salmon',170,0),
  ('salmon-aguacate-espinacas-salteadas','aguacate',90,1),
  ('salmon-aguacate-espinacas-salteadas','espinacas',120,2),
  ('salmon-aguacate-espinacas-salteadas','aceite-de-oliva',10,3),
  ('pollo-horno-brocoli-aceite-oliva','pechuga-de-pollo',200,0),
  ('pollo-horno-brocoli-aceite-oliva','brocoli',150,1),
  ('pollo-horno-brocoli-aceite-oliva','aceite-de-oliva',20,2),
  ('pollo-horno-brocoli-aceite-oliva','almendras',15,3),
  ('huevos-cocidos-aguacate-nueces','huevo-entero',120,0),
  ('huevos-cocidos-aguacate-nueces','aguacate',80,1),
  ('huevos-cocidos-aguacate-nueces','nueces',15,2),
  ('huevos-cocidos-aguacate-nueces','aceite-de-oliva',5,3),
  ('porridge-vegano-avena-soja-platano','avena',50,0),
  ('porridge-vegano-avena-soja-platano','bebida-de-soja',220,1),
  ('porridge-vegano-avena-soja-platano','proteina-vegetal-polvo',30,2),
  ('porridge-vegano-avena-soja-platano','platano',80,3),
  ('porridge-vegano-avena-soja-platano','semillas-de-chia',10,4),
  ('tofu-salteado-quinoa-verduras','tofu-firme',200,0),
  ('tofu-salteado-quinoa-verduras','quinoa-cocida',120,1),
  ('tofu-salteado-quinoa-verduras','calabacin',120,2),
  ('tofu-salteado-quinoa-verduras','pimiento',80,3),
  ('tofu-salteado-quinoa-verduras','aceite-de-oliva',10,4),
  ('bowl-yogur-griego-frutos-rojos-semillas','yogur-griego-natural',220,0),
  ('bowl-yogur-griego-frutos-rojos-semillas','frutos-rojos',80,1),
  ('bowl-yogur-griego-frutos-rojos-semillas','almendras',15,2),
  ('bowl-yogur-griego-frutos-rojos-semillas','semillas-de-chia',10,3),
  ('bowl-yogur-griego-frutos-rojos-semillas','miel',8,4),
  ('revuelto-tofu-espinacas-tomate','tofu-firme',180,0),
  ('revuelto-tofu-espinacas-tomate','espinacas',80,1),
  ('revuelto-tofu-espinacas-tomate','tomate',80,2),
  ('revuelto-tofu-espinacas-tomate','aceite-de-oliva',8,3),
  ('batido-vegano-proteina-platano-soja','bebida-de-soja',250,0),
  ('batido-vegano-proteina-platano-soja','proteina-vegetal-polvo',30,1),
  ('batido-vegano-proteina-platano-soja','platano',100,2),
  ('batido-vegano-proteina-platano-soja','mantequilla-de-cacahuete',15,3)
)
insert into public.recipe_ingredients (recipe_id,ingredient_id,grams,sort_order)
select r.id, i.id, ri.grams, ri.sort_order
from ri
join public.recipes r on r.slug = ri.recipe_slug
join public.ingredients i on i.slug = ri.ingredient_slug
where not exists (
  select 1 from public.recipe_ingredients x where x.recipe_id = r.id and x.ingredient_id = i.id
);

-- ============================================================================
-- c) 18 base templates: 6 styles/profiles × 3 goals. Ratios feed
--    calculateNutritionTargets (protein_ratio*10 → proteinPerKg, fat_ratio → fatRatio;
--    carbs = remainder). Keto uses fat_ratio 0.70. diet_style + tags drive the matcher.
--    Each profile row defines: key, label, diet_style, extra tag(s), and per-goal
--    protein/fat ratio overrides (keto overrides both; others reuse the goal defaults).
-- ============================================================================
with profile(key, label, diet_style, extra_tags, p_ratio, f_ratio_override) as (values
  -- STYLE dimension
  ('pescetariana','Pescetariana','pescetarian',ARRAY[]::text[],null::numeric,null::numeric),
  ('vegana','Vegana','vegan',ARRAY['vegana']::text[],null,null),
  -- EXCLUSION dimension (omnivore base + a tag the matcher requires)
  ('singluten','Sin gluten','omnivore',ARRAY['sin-gluten']::text[],null,null),
  ('sinlactosa','Sin lactosa','omnivore',ARRAY['sin-lactosa']::text[],null,null),
  ('halal','Halal','omnivore',ARRAY['halal']::text[],null,null),
  -- MACRO dimension (keto: high fat, low carb, independent of goal)
  ('keto','Keto','omnivore',ARRAY['keto','sin-gluten','sin-lactosa']::text[],0.18,0.70)
),
g(goal, goal_label, goal_es, def_p, def_f, goal_tag_es) as (values
  ('fat_loss','Definicion','Definicion',0.24,0.25,'definicion'),
  ('hypertrophy','Volumen','Volumen',0.20,0.27,'volumen'),
  ('recomposition','Recomp','Recomposicion',0.22,0.26,'recomp')
)
insert into public.diet_templates
  (name, goal, goal_tag, diet_style, meals_per_day, tags, status, workspace_id, is_base_library,
   protein_ratio, carbs_ratio, fat_ratio)
select
  g.goal_label ||' '|| p.label ||' base',
  g.goal_es,
  g.goal,
  p.diet_style,
  4,
  -- canonical goal tag + alta-proteina + the profile's distinguishing tag(s)
  ARRAY[g.goal_tag_es,'alta-proteina'] || p.extra_tags,
  'active'::plan_status, null, true,
  coalesce(p.p_ratio, g.def_p),           -- protein_ratio*10 = g/kg (keto = 0.18 → 1.8 g/kg)
  null,                                    -- carbs = remainder in calculateNutritionTargets
  coalesce(p.f_ratio_override, g.def_f)    -- keto = 0.70; others reuse the goal default
from profile p
cross join g
where not exists (
  select 1 from public.diet_templates d
  where d.is_base_library and d.name = g.goal_label ||' '|| p.label ||' base'
);

-- ============================================================================
-- d) diet_template_meals: up to 2 recipes per meal_slot per template, filtered by the
--    template's style + exclusion/keto tags and ranked by goal affinity → protein.
--    Mirrors scripts/data/diet-matrix.sql but extends the style rule (pescetarian) and
--    adds tag gates (sin-gluten / sin-lactosa / halal / keto). day_number=1.
-- ============================================================================
with tmpl as (
  -- only the templates this script adds (the new styles/profiles), identified by tag
  select id, goal_tag, diet_style, tags
  from public.diet_templates
  where is_base_library
    and (
      diet_style in ('pescetarian','vegan')
      or 'sin-gluten' = any(tags) or 'sin-lactosa' = any(tags)
      or 'halal' = any(tags) or 'keto' = any(tags)
    )
),
base as (
  -- every base-library recipe + whether it is pork/alcohol-free (halal-safe as a recipe)
  select r.id as recipe_id, r.slug, r.meal_slot, r.tags,
    not exists (
      select 1 from public.recipe_ingredients ri join public.ingredients i on i.id = ri.ingredient_id
      where ri.recipe_id = r.id
        and (i.slug ~ 'cerdo|bacon|jamon|chorizo|salchich|panceta|tocino'
             or 'cerdo' = any(i.tags) or 'alcohol' = any(i.tags))
    ) as halal_safe
  from public.recipes r
  where r.is_base_library
),
elig as (
  select t.id as diet_template_id, b.meal_slot, b.recipe_id,
    row_number() over (
      partition by t.id, b.meal_slot
      order by
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
    -- STYLE gate (mirror diet-matcher.styleOk; pescetarian accepts veg/vegan + fish):
    (
      t.diet_style='omnivore'
      or (t.diet_style='pescetarian' and (
            'vegetariana'=any(b.tags) or 'vegana'=any(b.tags)
            or exists (select 1 from public.recipe_ingredients ri join public.ingredients i on i.id=ri.ingredient_id
                       where ri.recipe_id=b.recipe_id and i.slug in ('salmon','salmon-ahumado','atun-al-natural','merluza','gambas'))
         ))
      or (t.diet_style='vegetarian' and ('vegetariana'=any(b.tags) or 'vegana'=any(b.tags)))
      or (t.diet_style='vegan'      and 'vegana'=any(b.tags))
    )
    -- EXCLUSION / MACRO tag gates: every tag the template requires must be on the recipe.
    and (not ('sin-gluten'  = any(t.tags)) or 'sin-gluten'  = any(b.tags))
    and (not ('sin-lactosa' = any(t.tags)) or 'sin-lactosa' = any(b.tags))
    and (not ('keto'        = any(t.tags)) or 'keto'        = any(b.tags))
    and (not ('halal'       = any(t.tags)) or b.halal_safe)
  )
)
insert into public.diet_template_meals
  (diet_template_id, day_number, meal_slot, recipe_id, serving_multiplier, sort_order)
select e.diet_template_id, 1, e.meal_slot, e.recipe_id, 1,
  array_position(array['desayuno','comida','cena','snack'], e.meal_slot) * 10 + e.rn
from elig e
where e.rn <= 2
  and not exists (
    select 1 from public.diet_template_meals m
    where m.diet_template_id = e.diet_template_id and m.recipe_id = e.recipe_id
  );

commit;

-- ============================================================================
-- Validation (run after applying; expect zero rows). Every referenced recipe must be
-- base-library and respect the template's style + required tags.
-- ============================================================================
-- select dt.name, dt.diet_style, dt.tags as tmpl_tags, r.slug, r.tags as recipe_tags
-- from diet_template_meals m
-- join diet_templates dt on dt.id = m.diet_template_id and dt.is_base_library
-- join recipes r on r.id = m.recipe_id
-- where (dt.diet_style='vegan'        and not ('vegana'=any(r.tags)))
--    or (dt.diet_style='vegetarian'   and not ('vegetariana'=any(r.tags) or 'vegana'=any(r.tags)))
--    or ('sin-gluten'  = any(dt.tags) and not ('sin-gluten'  = any(r.tags)))
--    or ('sin-lactosa' = any(dt.tags) and not ('sin-lactosa' = any(r.tags)))
--    or ('keto'        = any(dt.tags) and not ('keto'        = any(r.tags)));
