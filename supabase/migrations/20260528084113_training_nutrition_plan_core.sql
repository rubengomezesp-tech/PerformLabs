do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_generation_status') then
    create type public.plan_generation_status as enum ('draft', 'generated', 'reviewed', 'published', 'archived');
  end if;
end $$;

alter table public.workout_templates
  add column if not exists duration_weeks int not null default 12,
  add column if not exists phase_structure jsonb not null default '[]',
  add column if not exists rotation_rules jsonb not null default '{}';

alter table public.workout_template_days
  add column if not exists month_number int generated always as (((week_number - 1) / 4) + 1) stored,
  add column if not exists phase_title text,
  add column if not exists focus text,
  add column if not exists intensity text,
  add column if not exists estimated_minutes int;

alter table public.workout_template_exercises
  add column if not exists block_type text not null default 'main',
  add column if not exists target_rir text,
  add column if not exists load_guidance text,
  add column if not exists video_required boolean not null default false;

alter table public.assigned_workout_plans
  add column if not exists generation_status public.plan_generation_status not null default 'published',
  add column if not exists current_week int not null default 1,
  add column if not exists current_month int not null default 1,
  add column if not exists days_per_week int,
  add column if not exists assignment_goal text,
  add column if not exists coach_notes text,
  add column if not exists member_notes text,
  add column if not exists next_review_on date,
  add column if not exists review_status text not null default 'pending',
  add column if not exists algorithm_snapshot jsonb not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table public.assigned_meal_plans
  add column if not exists generation_status public.plan_generation_status not null default 'published',
  add column if not exists meals_per_day int,
  add column if not exists water_target_ml int,
  add column if not exists fiber_target_g int,
  add column if not exists sodium_target_mg int,
  add column if not exists hide_macros boolean not null default false,
  add column if not exists coach_notes text,
  add column if not exists member_notes text,
  add column if not exists next_review_on date,
  add column if not exists review_status text not null default 'pending',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.workout_template_blocks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_day_id uuid not null references public.workout_template_days(id) on delete cascade,
  block_type text not null default 'main' check (block_type in ('warmup', 'main', 'accessory', 'conditioning', 'mobility', 'cooldown')),
  title text not null,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercise_alternatives (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alternative_exercise_id uuid not null references public.exercises(id) on delete cascade,
  reason text,
  injury_tags text[] not null default '{}',
  equipment_tags text[] not null default '{}',
  priority int not null default 100,
  created_at timestamptz not null default now(),
  unique (workspace_id, exercise_id, alternative_exercise_id)
);

create table if not exists public.assigned_workout_days (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_workout_plan_id uuid not null references public.assigned_workout_plans(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  source_template_day_id uuid references public.workout_template_days(id) on delete set null,
  week_number int not null,
  month_number int not null,
  day_number int not null,
  scheduled_on date,
  title text not null,
  focus text,
  instructions text,
  estimated_minutes int,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped', 'rescheduled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assigned_workout_plan_id, week_number, day_number)
);

create table if not exists public.assigned_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_workout_day_id uuid not null references public.assigned_workout_days(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  source_template_exercise_id uuid references public.workout_template_exercises(id) on delete set null,
  block_type text not null default 'main',
  title text not null,
  sort_order int not null default 0,
  sets int,
  reps text,
  tempo text,
  rest_seconds int,
  target_rir text,
  load_guidance text,
  notes text,
  video_url text,
  swap_options jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_calculation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  assigned_meal_plan_id uuid references public.assigned_meal_plans(id) on delete set null,
  formula_id uuid references public.nutrition_formulas(id) on delete set null,
  goal text not null,
  input_snapshot jsonb not null default '{}',
  output_snapshot jsonb not null default '{}',
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  confidence_score numeric(5,2),
  status public.plan_generation_status not null default 'generated',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.assigned_meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_meal_plan_id uuid not null references public.assigned_meal_plans(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  day_number int not null,
  title text,
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assigned_meal_plan_id, day_number)
);

create table if not exists public.assigned_meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_meal_plan_day_id uuid not null references public.assigned_meal_plan_days(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  meal_slot text not null,
  title text not null,
  serving_multiplier numeric(8,4) not null default 1,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  instructions text,
  swap_options jsonb not null default '[]',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_alternatives (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  alternative_recipe_id uuid not null references public.recipes(id) on delete cascade,
  reason text,
  tags text[] not null default '{}',
  priority int not null default 100,
  created_at timestamptz not null default now(),
  unique (workspace_id, recipe_id, alternative_recipe_id)
);

create table if not exists public.ingredient_substitutions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  substitute_ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  conversion_ratio numeric(8,4) not null default 1,
  reason text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (workspace_id, ingredient_id, substitute_ingredient_id)
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  assigned_meal_plan_id uuid references public.assigned_meal_plans(id) on delete cascade,
  title text not null,
  starts_on date,
  ends_on date,
  items jsonb not null default '[]',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_template_blocks_day_idx on public.workout_template_blocks (template_day_id, sort_order);
create index if not exists workout_alternatives_exercise_idx on public.workout_exercise_alternatives (exercise_id, priority);
create index if not exists assigned_workout_days_plan_idx on public.assigned_workout_days (assigned_workout_plan_id, week_number, day_number);
create index if not exists assigned_workout_days_member_idx on public.assigned_workout_days (member_profile_id, scheduled_on, status);
create index if not exists assigned_workout_exercises_day_idx on public.assigned_workout_exercises (assigned_workout_day_id, sort_order);
create index if not exists nutrition_calculation_runs_member_idx on public.nutrition_calculation_runs (member_profile_id, created_at desc);
create index if not exists assigned_meal_plan_days_plan_idx on public.assigned_meal_plan_days (assigned_meal_plan_id, day_number);
create index if not exists assigned_meal_plan_items_day_idx on public.assigned_meal_plan_items (assigned_meal_plan_day_id, sort_order);
create index if not exists recipe_alternatives_recipe_idx on public.recipe_alternatives (recipe_id, priority);
create index if not exists ingredient_substitutions_ingredient_idx on public.ingredient_substitutions (ingredient_id);
create index if not exists shopping_lists_member_idx on public.shopping_lists (member_profile_id, starts_on desc);

alter table public.workout_template_blocks enable row level security;
alter table public.workout_exercise_alternatives enable row level security;
alter table public.assigned_workout_days enable row level security;
alter table public.assigned_workout_exercises enable row level security;
alter table public.nutrition_calculation_runs enable row level security;
alter table public.assigned_meal_plan_days enable row level security;
alter table public.assigned_meal_plan_items enable row level security;
alter table public.recipe_alternatives enable row level security;
alter table public.ingredient_substitutions enable row level security;
alter table public.shopping_lists enable row level security;

create policy "template blocks visible to workspace members"
on public.workout_template_blocks for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "template blocks created by team"
on public.workout_template_blocks for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "template blocks updated by team"
on public.workout_template_blocks for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "template blocks deleted by team"
on public.workout_template_blocks for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "exercise alternatives visible to workspace members"
on public.workout_exercise_alternatives for select
to authenticated
using (workspace_id is null or (select private.is_workspace_member(workspace_id)));

create policy "exercise alternatives created by team"
on public.workout_exercise_alternatives for insert
to authenticated
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "exercise alternatives updated by team"
on public.workout_exercise_alternatives for update
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "exercise alternatives deleted by team"
on public.workout_exercise_alternatives for delete
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned workout days visible to owner and team"
on public.assigned_workout_days for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned workout days created by team"
on public.assigned_workout_days for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned workout days updated by owner or team"
on public.assigned_workout_days for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned workout days deleted by team"
on public.assigned_workout_days for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned workout exercises visible to owner and team"
on public.assigned_workout_exercises for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned workout exercises created by team"
on public.assigned_workout_exercises for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned workout exercises updated by owner or team"
on public.assigned_workout_exercises for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned workout exercises deleted by team"
on public.assigned_workout_exercises for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "nutrition runs visible to owner and team"
on public.nutrition_calculation_runs for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "nutrition runs created by team"
on public.nutrition_calculation_runs for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal days visible to owner and team"
on public.assigned_meal_plan_days for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned meal days created by team"
on public.assigned_meal_plan_days for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal days updated by team"
on public.assigned_meal_plan_days for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal days deleted by team"
on public.assigned_meal_plan_days for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal items visible to owner and team"
on public.assigned_meal_plan_items for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "assigned meal items created by team"
on public.assigned_meal_plan_items for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal items updated by team"
on public.assigned_meal_plan_items for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "assigned meal items deleted by team"
on public.assigned_meal_plan_items for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "recipe alternatives visible to workspace members"
on public.recipe_alternatives for select
to authenticated
using (workspace_id is null or (select private.is_workspace_member(workspace_id)));

create policy "recipe alternatives created by team"
on public.recipe_alternatives for insert
to authenticated
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "recipe alternatives updated by team"
on public.recipe_alternatives for update
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "recipe alternatives deleted by team"
on public.recipe_alternatives for delete
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "ingredient substitutions visible to workspace members"
on public.ingredient_substitutions for select
to authenticated
using (workspace_id is null or (select private.is_workspace_member(workspace_id)));

create policy "ingredient substitutions created by team"
on public.ingredient_substitutions for insert
to authenticated
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "ingredient substitutions updated by team"
on public.ingredient_substitutions for update
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "ingredient substitutions deleted by team"
on public.ingredient_substitutions for delete
to authenticated
using (workspace_id is null or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "shopping lists visible to owner and team"
on public.shopping_lists for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "shopping lists created by owner or team"
on public.shopping_lists for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "shopping lists updated by owner or team"
on public.shopping_lists for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

grant select on table public.workout_template_blocks, public.workout_exercise_alternatives,
  public.assigned_workout_days, public.assigned_workout_exercises, public.nutrition_calculation_runs,
  public.assigned_meal_plan_days, public.assigned_meal_plan_items, public.recipe_alternatives,
  public.ingredient_substitutions, public.shopping_lists
to authenticated;

grant insert, update, delete on table public.workout_template_blocks, public.workout_exercise_alternatives,
  public.assigned_workout_days, public.assigned_workout_exercises, public.nutrition_calculation_runs,
  public.assigned_meal_plan_days, public.assigned_meal_plan_items, public.recipe_alternatives,
  public.ingredient_substitutions, public.shopping_lists
to authenticated;

grant all privileges on table public.workout_template_blocks, public.workout_exercise_alternatives,
  public.assigned_workout_days, public.assigned_workout_exercises, public.nutrition_calculation_runs,
  public.assigned_meal_plan_days, public.assigned_meal_plan_items, public.recipe_alternatives,
  public.ingredient_substitutions, public.shopping_lists
to service_role;
