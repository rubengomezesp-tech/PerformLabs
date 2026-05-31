-- White-label base library for food_library_items: mirror workout_templates /
-- recipes / exercises so a large generic food database is imported ONCE
-- (workspace_id null, is_base_library true) and every brand inherits it. Reads are
-- server-side (service client), so no RLS change is required for the app; the
-- nullable FK + flag are the core. Mirrors 20260531080000_workout_templates_base_library.sql.

alter table public.food_library_items alter column workspace_id drop not null;
alter table public.food_library_items add column if not exists is_base_library boolean not null default false;

comment on column public.food_library_items.is_base_library is
  'Platform-shared food (workspace_id null). Inherited by every brand via listFoodLibrary.';

-- Partial index: base-library reads (workspace_id is null) and the .or(...) merge.
create index if not exists food_library_items_base_idx
  on public.food_library_items (is_base_library) where is_base_library;

-- Helps the .or(workspace_id.eq.X,workspace_id.is.null) merge + name ordering.
create index if not exists food_library_items_base_name_idx
  on public.food_library_items (name) where workspace_id is null;

-- Stable natural key for base-library imports so the OFF / USDA / curated seeds can
-- upsert idempotently (re-running never duplicates). Scoped to base rows only, so it
-- never constrains a workspace's own editable copies. serving_label is part of the
-- key so a food can have both a "per 100 g" and a "per portion" base entry
-- (e.g. Plátano 100 g vs Plátano 1 unidad). Imported rows are all "100 g", so they
-- still dedupe by name+brand in practice.
create unique index if not exists food_library_items_base_identity_idx
  on public.food_library_items (lower(name), lower(coalesce(brand, '')), lower(serving_label))
  where workspace_id is null;
