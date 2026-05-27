-- CoachOS bootstrap.
-- Run this after supabase/migrations/0001_initial_schema.sql.

insert into public.workspaces (
  name,
  slug,
  custom_domain,
  support_email,
  app_name,
  accent_color
) values (
  'CoachOS Mother Platform',
  'mother',
  null,
  'support@coachos.local',
  'CoachOS',
  '#d8bd6b'
) on conflict (slug) do nothing;

insert into public.workspaces (
  name,
  slug,
  custom_domain,
  support_email,
  app_name,
  accent_color
) values (
  'Ruben Gomez Elite',
  'rge',
  'rubengomezelite.com',
  'soporte@rubengomezelite.com',
  'RGE',
  '#d8bd6b'
) on conflict (slug) do nothing;

insert into public.diet_categories (workspace_id, name, slug, description)
select null, name, slug, description
from (
  values
    ('Sin gluten', 'sin-gluten', 'Excluye recetas e ingredientes con gluten.'),
    ('Sin lactosa', 'sin-lactosa', 'Evita lácteos o usa alternativas sin lactosa.'),
    ('Alta proteína', 'alta-proteina', 'Plantillas orientadas a proteína alta.'),
    ('Definición', 'definicion', 'Déficit calórico con alta saciedad.'),
    ('Volumen', 'volumen', 'Superávit calórico controlado.'),
    ('Vegana', 'vegana', 'Recetas sin productos animales.'),
    ('Vegetariana', 'vegetariana', 'Recetas sin carne ni pescado.')
) as seed(name, slug, description)
on conflict (workspace_id, slug) do nothing;

insert into public.exercise_categories (workspace_id, name, slug)
select null, name, slug
from (
  values
    ('Pecho', 'pecho'),
    ('Espalda', 'espalda'),
    ('Pierna', 'pierna'),
    ('Hombro', 'hombro'),
    ('Brazos', 'brazos'),
    ('Core', 'core'),
    ('Cardio', 'cardio')
) as seed(name, slug)
on conflict (workspace_id, slug) do nothing;

insert into public.nutrition_formulas (
  workspace_id,
  name,
  slug,
  formula_type,
  config,
  is_default
) values (
  null,
  'Mifflin St Jeor Base',
  'mifflin-st-jeor-base',
  'calorie_macro_generator',
  '{
    "bmr": "mifflin_st_jeor",
    "activityMultiplierSource": "member.activity_level",
    "goals": {
      "cut": { "calorieDeltaPercent": -0.18 },
      "maintenance": { "calorieDeltaPercent": 0 },
      "lean_bulk": { "calorieDeltaPercent": 0.10 }
    },
    "proteinGramsPerKg": 2.0,
    "fatCaloriesRatio": 0.25
  }'::jsonb,
  true
) on conflict (workspace_id, slug) do nothing;
