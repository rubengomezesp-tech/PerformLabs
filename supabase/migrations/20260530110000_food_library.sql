-- Coach-curated food library + member favorites (self-contained, no external food DB).
-- Read/written through the service client (RLS enabled, no public policies).
-- Quick-add copies the computed macros into food_diary_entries, so a logged food
-- needs no foreign key back to the library and the diary keeps working unchanged.

create table if not exists public.food_library_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  brand text,
  serving_label text not null default '100 g',
  category text not null default 'other',
  protein_g numeric not null default 0,
  fat_g numeric not null default 0,
  carbs_g numeric not null default 0,
  calories numeric not null default 0,
  verified boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_library_items_workspace_idx
  on public.food_library_items (workspace_id, sort_order);

create index if not exists food_library_items_name_idx
  on public.food_library_items (workspace_id, name);

create table if not exists public.member_food_favorites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  food_item_id uuid not null references public.food_library_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_profile_id, food_item_id)
);

create index if not exists member_food_favorites_member_idx
  on public.member_food_favorites (member_profile_id);

alter table public.food_library_items enable row level security;
alter table public.member_food_favorites enable row level security;
