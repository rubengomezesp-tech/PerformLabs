-- PerformLabs · Migración 0001 — Estado de receta (Publicado/Borrador) + tiempo de prep
-- Cómo aplicar: Supabase → SQL Editor → pega esto → Run.
-- Es idempotente: puedes ejecutarlo más de una vez sin romper nada.

-- 1) Estado de publicación de la receta (reusa el enum existente plan_status: draft|active|archived).
--    Default 'active' => las recetas actuales quedan publicadas.
alter table public.recipes
  add column if not exists status public.plan_status not null default 'active';

-- 2) Tiempo de preparación en minutos (la columna "Tiempo" de Macroactive). Opcional.
alter table public.recipes
  add column if not exists prep_minutes integer;

-- 3) Índice para filtrar por estado rápido en la librería.
create index if not exists recipes_status_idx on public.recipes (status);
