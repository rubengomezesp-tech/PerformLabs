create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  subject text not null,
  category text not null default 'general' check (category in ('general', 'training', 'nutrition', 'progress', 'billing', 'technical')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'waiting_coach', 'waiting_member', 'resolved', 'archived')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('member', 'coach', 'system')),
  body text not null,
  attachments jsonb not null default '[]',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_conversations_workspace_status_idx
  on public.support_conversations (workspace_id, status, last_message_at desc);

create index if not exists support_conversations_member_idx
  on public.support_conversations (member_profile_id, last_message_at desc);

create index if not exists support_messages_conversation_idx
  on public.support_messages (conversation_id, created_at asc);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "workspace team can manage support conversations" on public.support_conversations;
create policy "workspace team can manage support conversations"
on public.support_conversations for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "members can read own support conversations" on public.support_conversations;
create policy "members can read own support conversations"
on public.support_conversations for select
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = support_conversations.member_profile_id
      and profile.user_id = (select auth.uid())
  )
);

drop policy if exists "members can create own support conversations" on public.support_conversations;
create policy "members can create own support conversations"
on public.support_conversations for insert
with check (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = support_conversations.member_profile_id
      and profile.workspace_id = support_conversations.workspace_id
      and profile.user_id = (select auth.uid())
  )
);

drop policy if exists "workspace team can manage support messages" on public.support_messages;
create policy "workspace team can manage support messages"
on public.support_messages for all
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));

drop policy if exists "members can read own support messages" on public.support_messages;
create policy "members can read own support messages"
on public.support_messages for select
using (
  exists (
    select 1
    from public.support_conversations conversation
    join public.member_profiles profile on profile.id = conversation.member_profile_id
    where conversation.id = support_messages.conversation_id
      and profile.user_id = (select auth.uid())
  )
);

drop policy if exists "members can create own support messages" on public.support_messages;
create policy "members can create own support messages"
on public.support_messages for insert
with check (
  sender_role = 'member'
  and exists (
    select 1
    from public.support_conversations conversation
    join public.member_profiles profile on profile.id = conversation.member_profile_id
    where conversation.id = support_messages.conversation_id
      and conversation.workspace_id = support_messages.workspace_id
      and profile.user_id = (select auth.uid())
  )
);
