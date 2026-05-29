-- Coach participation in the community: official announcements + pinned posts.
alter table public.community_posts
  add column if not exists is_coach boolean not null default false;

alter table public.community_posts
  add column if not exists pinned boolean not null default false;

-- Pinned + coach posts surface first in the member feed.
create index if not exists community_posts_pinned_idx
  on public.community_posts (workspace_id, pinned desc, created_at desc);
