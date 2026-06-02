-- White-label base library for workout templates: mirror recipes/exercises so the
-- platform program matrix is authored once (workspace_id null, is_base_library true)
-- and every brand inherits it. Reads are server-side (service client), so no RLS
-- change is required for the app; the column + nullable FK are the core.

alter table public.workout_templates alter column workspace_id drop not null;
alter table public.workout_templates add column if not exists is_base_library boolean not null default false;

comment on column public.workout_templates.is_base_library is
  'Platform-shared program (workspace_id null). Inherited by every brand via listManagedWorkoutTemplates.';

create index if not exists workout_templates_base_idx
  on public.workout_templates (is_base_library) where is_base_library;
