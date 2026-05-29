-- Member community: posts + likes (read/written via service client, RLS on).
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  author_name text not null default 'Miembro',
  body text not null,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create index if not exists community_posts_feed_idx on public.community_posts (workspace_id, created_at desc);

create table if not exists public.community_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, member_profile_id)
);

create index if not exists community_post_likes_post_idx on public.community_post_likes (post_id);

alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
