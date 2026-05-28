drop index if exists public.exercises_source_dataset_source_id_idx;

create unique index if not exists exercises_source_dataset_source_id_idx
  on public.exercises (source_dataset, source_id);
