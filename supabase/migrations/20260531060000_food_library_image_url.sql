-- Media system: let food library items carry a curated/generated product photo.
-- Additive and nullable — existing rows keep working and fall back to the
-- on-brand placeholder. Coaches can set their own image (white-label), and the
-- platform can seed/generate matching photos into the same column.

alter table public.food_library_items
  add column if not exists image_url text;

comment on column public.food_library_items.image_url is
  'Curated or generated product photo URL. Null falls back to the on-brand placeholder.';
