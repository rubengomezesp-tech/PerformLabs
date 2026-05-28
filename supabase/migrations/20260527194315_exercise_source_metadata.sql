alter table public.exercises
  add column if not exists source_dataset text,
  add column if not exists source_id text,
  add column if not exists source_license text,
  add column if not exists source_url text,
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists secondary_muscle_groups text[] not null default '{}',
  add column if not exists force_type text,
  add column if not exists mechanic text,
  add column if not exists movement_category text;

create unique index if not exists exercises_source_dataset_source_id_idx
  on public.exercises (source_dataset, source_id)
  where source_dataset is not null and source_id is not null;
