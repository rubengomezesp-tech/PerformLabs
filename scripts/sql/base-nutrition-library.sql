-- ============================================================
-- PerformLabs · Librería base de nutrición (pegar en Supabase → SQL Editor)
-- Crea: ~40 alimentos con sus macros (por 100 g), 6 recetas de ejemplo
-- (compuestas con esos alimentos) y 1 plan de dieta de ejemplo de un día.
--
-- Es idempotente: puedes ejecutarlo más de una vez sin duplicar.
-- Los alimentos y recetas se crean como "librería base" (compartida con
-- todas tus marcas). El plan de ejemplo se crea en tu marca "Marca Blanca
-- Fitness" (se busca por nombre; cambia el nombre abajo si tu marca es otra).
-- ============================================================

-- 1) ALIMENTOS (ingredientes base, macros por 100 g)
insert into ingredients (name, slug, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, tags, is_base_library, workspace_id)
select v.name, v.slug, v.kcal, v.protein, v.carbs, v.fat, array['base']::text[], true, null
from (values
  ('Pechuga de pollo','pechuga-de-pollo',165,31,0,3.6),
  ('Pavo (pechuga)','pavo-pechuga',135,29,0,1),
  ('Ternera magra','ternera-magra',175,26,0,8),
  ('Salmón','salmon',208,20,0,13),
  ('Atún al natural','atun-al-natural',116,26,0,1),
  ('Merluza','merluza',90,18,0,2),
  ('Huevo entero','huevo-entero',155,13,1.1,11),
  ('Clara de huevo','clara-de-huevo',52,11,0.7,0.2),
  ('Gambas','gambas',99,24,0.2,0.3),
  ('Arroz blanco cocido','arroz-blanco-cocido',130,2.7,28,0.3),
  ('Arroz integral cocido','arroz-integral-cocido',112,2.6,23,0.9),
  ('Pasta cocida','pasta-cocida',158,6,31,0.9),
  ('Patata cocida','patata-cocida',87,2,20,0.1),
  ('Boniato','boniato',86,1.6,20,0.1),
  ('Avena','avena',389,17,66,7),
  ('Pan integral','pan-integral',247,13,41,3.4),
  ('Quinoa cocida','quinoa-cocida',120,4.4,21,1.9),
  ('Lentejas cocidas','lentejas-cocidas',116,9,20,0.4),
  ('Garbanzos cocidos','garbanzos-cocidos',164,9,27,2.6),
  ('Brócoli','brocoli',34,2.8,7,0.4),
  ('Espinacas','espinacas',23,2.9,3.6,0.4),
  ('Tomate','tomate',18,0.9,3.9,0.2),
  ('Pimiento','pimiento',31,1,6,0.3),
  ('Calabacín','calabacin',17,1.2,3.1,0.3),
  ('Lechuga','lechuga',15,1.4,2.9,0.2),
  ('Aguacate','aguacate',160,2,9,15),
  ('Plátano','platano',89,1.1,23,0.3),
  ('Manzana','manzana',52,0.3,14,0.2),
  ('Frutos rojos','frutos-rojos',43,1,10,0.3),
  ('Naranja','naranja',47,0.9,12,0.1),
  ('Leche desnatada','leche-desnatada',35,3.4,5,0.1),
  ('Yogur griego natural','yogur-griego-natural',59,10,3.6,0.4),
  ('Queso fresco batido 0%','queso-fresco-batido-0',47,8,4,0.2),
  ('Requesón','requeson',98,11,3.4,4.3),
  ('Almendras','almendras',579,21,22,50),
  ('Nueces','nueces',654,15,14,65),
  ('Mantequilla de cacahuete','mantequilla-de-cacahuete',588,25,20,50),
  ('Aceite de oliva','aceite-de-oliva',884,0,0,100),
  ('Miel','miel',304,0.3,82,0),
  ('Proteína whey (polvo)','proteina-whey-polvo',380,80,8,6)
) as v(name, slug, kcal, protein, carbs, fat)
where not exists (
  select 1 from ingredients i where i.slug = v.slug and i.is_base_library = true
);

-- 2) RECETAS de ejemplo + 3) PLAN de dieta de ejemplo
do $$
declare
  ws uuid;
  r_desayuno uuid;
  r_comida uuid;
  r_cena uuid;
  r_snack uuid;
  t_id uuid;
begin
  -- ---- Receta: Tortilla de avena con frutos rojos (desayuno) ----
  select id into r_desayuno from recipes where slug = 'tortilla-avena-frutos-rojos' and is_base_library = true;
  if r_desayuno is null then
    insert into recipes (name, slug, meal_slot, instructions, tags, is_base_library, workspace_id)
    values ('Tortilla de avena con frutos rojos','tortilla-avena-frutos-rojos','desayuno',
            'Bate claras + huevo con la avena, cuaja en sartén y acompaña con frutos rojos.',
            array['base','desayuno','alta proteina']::text[], true, null)
    returning id into r_desayuno;
    insert into recipe_ingredients (recipe_id, ingredient_id, grams, sort_order)
    select r_desayuno, i.id, x.grams, x.ord
    from (values ('clara-de-huevo',200,0),('huevo-entero',50,1),('avena',60,2),('frutos-rojos',80,3)) as x(slug,grams,ord)
    join ingredients i on i.slug = x.slug and i.is_base_library = true;
  end if;

  -- ---- Receta: Bowl de pollo y arroz (comida) ----
  select id into r_comida from recipes where slug = 'bowl-pollo-arroz' and is_base_library = true;
  if r_comida is null then
    insert into recipes (name, slug, meal_slot, instructions, tags, is_base_library, workspace_id)
    values ('Bowl de pollo y arroz','bowl-pollo-arroz','comida',
            'Cocina el arroz, saltea el pollo y el brócoli, alina con aceite de oliva.',
            array['base','comida','alta proteina']::text[], true, null)
    returning id into r_comida;
    insert into recipe_ingredients (recipe_id, ingredient_id, grams, sort_order)
    select r_comida, i.id, x.grams, x.ord
    from (values ('pechuga-de-pollo',180,0),('arroz-blanco-cocido',200,1),('brocoli',150,2),('aceite-de-oliva',10,3)) as x(slug,grams,ord)
    join ingredients i on i.slug = x.slug and i.is_base_library = true;
  end if;

  -- ---- Receta: Salmón con boniato y espinacas (cena) ----
  select id into r_cena from recipes where slug = 'salmon-boniato-espinacas' and is_base_library = true;
  if r_cena is null then
    insert into recipes (name, slug, meal_slot, instructions, tags, is_base_library, workspace_id)
    values ('Salmón con boniato y espinacas','salmon-boniato-espinacas','cena',
            'Hornea el salmón y el boniato, saltea las espinacas con un poco de aceite.',
            array['base','cena','omega-3']::text[], true, null)
    returning id into r_cena;
    insert into recipe_ingredients (recipe_id, ingredient_id, grams, sort_order)
    select r_cena, i.id, x.grams, x.ord
    from (values ('salmon',160,0),('boniato',200,1),('espinacas',100,2),('aceite-de-oliva',8,3)) as x(slug,grams,ord)
    join ingredients i on i.slug = x.slug and i.is_base_library = true;
  end if;

  -- ---- Receta: Yogur griego con nueces y miel (snack) ----
  select id into r_snack from recipes where slug = 'yogur-griego-nueces-miel' and is_base_library = true;
  if r_snack is null then
    insert into recipes (name, slug, meal_slot, instructions, tags, is_base_library, workspace_id)
    values ('Yogur griego con nueces y miel','yogur-griego-nueces-miel','snack',
            'Mezcla el yogur con las nueces troceadas y un hilo de miel.',
            array['base','snack']::text[], true, null)
    returning id into r_snack;
    insert into recipe_ingredients (recipe_id, ingredient_id, grams, sort_order)
    select r_snack, i.id, x.grams, x.ord
    from (values ('yogur-griego-natural',200,0),('nueces',20,1),('miel',15,2)) as x(slug,grams,ord)
    join ingredients i on i.slug = x.slug and i.is_base_library = true;
  end if;

  -- ---- PLAN DE EJEMPLO en tu marca ----
  select id into ws from workspaces where name ilike 'Marca Blanca Fitness' order by created_at limit 1;
  if ws is null then
    raise notice 'No encontré la marca "Marca Blanca Fitness"; omito el plan de ejemplo. Edita el nombre en el SQL.';
  else
    select id into t_id from diet_templates where workspace_id = ws and name = 'Definición 2000 kcal (ejemplo)';
    if t_id is null then
      insert into diet_templates (workspace_id, name, goal, calories_min, calories_max, protein_ratio, status, tags)
      values (ws, 'Definición 2000 kcal (ejemplo)', 'Definición', 1900, 2100, 0.35, 'draft', array['ejemplo','base']::text[])
      returning id into t_id;
      insert into diet_template_meals (diet_template_id, recipe_id, day_number, meal_slot, serving_multiplier, sort_order) values
        (t_id, r_desayuno, 1, 'desayuno', 1, 1),
        (t_id, r_comida,   1, 'comida',   1, 2),
        (t_id, r_cena,     1, 'cena',     1, 3),
        (t_id, r_snack,    1, 'snack',    1, 4);
    end if;
  end if;
end $$;
