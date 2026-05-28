do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_domain_type') then
    create type public.workspace_domain_type as enum ('public_site', 'member_app', 'fallback', 'custom_app');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum ('pending', 'verified', 'failed', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('queued', 'sent', 'delivered', 'failed', 'cancelled');
  end if;
end $$;

create table if not exists public.workspace_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain text not null,
  domain_type public.workspace_domain_type not null,
  status public.verification_status not null default 'pending',
  is_primary boolean not null default false,
  verification_token text not null default replace(gen_random_uuid()::text, '-', ''),
  dns_target text,
  last_checked_at timestamptz,
  verified_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain),
  unique (workspace_id, domain_type, domain)
);

create unique index if not exists workspace_domains_one_primary_per_type_idx
  on public.workspace_domains (workspace_id, domain_type)
  where is_primary;

create table if not exists public.workspace_team_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null check (role in ('platform_owner', 'agency_admin', 'coach_admin', 'coach_staff')),
  status public.invitation_status not null default 'pending',
  token_hash text not null,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email, role, status)
);

create table if not exists public.member_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  email text not null,
  status public.invitation_status not null default 'pending',
  token_hash text not null,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email, status)
);

create table if not exists public.coach_member_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  note_type text not null default 'general' check (note_type in ('general', 'training', 'nutrition', 'support', 'risk', 'billing')),
  body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  event_type text not null,
  source text not null default 'member_app' check (source in ('member_app', 'coach_console', 'console', 'system')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.member_devices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  push_token text,
  endpoint text,
  subscription jsonb not null default '{}',
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, member_profile_id, platform, push_token),
  unique (workspace_id, member_profile_id, endpoint)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid references public.notification_templates(id) on delete set null,
  scheduled_notification_id uuid references public.scheduled_notifications(id) on delete set null,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  recipient text,
  subject text,
  payload jsonb not null default '{}',
  status public.delivery_status not null default 'queued',
  provider text,
  provider_message_id text,
  error_message text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz
);

create table if not exists public.app_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  body jsonb not null default '{}',
  target_route text,
  audience_filter jsonb not null default '{}',
  status public.plan_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_message_reads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  app_message_id uuid not null references public.app_messages(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (app_message_id, member_profile_id)
);

create table if not exists public.checkin_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  cadence text not null default 'weekly' check (cadence in ('daily', 'weekly', 'biweekly', 'monthly', 'manual')),
  status public.plan_status not null default 'draft',
  questions jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkin_answers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  checkin_id uuid not null references public.customer_checkins(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  question_key text not null,
  answer jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (checkin_id, question_key)
);

create index if not exists workspace_domains_workspace_idx on public.workspace_domains (workspace_id, domain_type, status);
create index if not exists workspace_team_invitations_workspace_idx on public.workspace_team_invitations (workspace_id, status, expires_at);
create index if not exists member_invitations_workspace_idx on public.member_invitations (workspace_id, status, expires_at);
create index if not exists coach_member_notes_member_idx on public.coach_member_notes (member_profile_id, created_at desc);
create index if not exists member_activity_events_member_idx on public.member_activity_events (member_profile_id, occurred_at desc);
create index if not exists member_activity_events_workspace_type_idx on public.member_activity_events (workspace_id, event_type, occurred_at desc);
create index if not exists member_devices_member_idx on public.member_devices (member_profile_id, is_active);
create index if not exists notification_deliveries_workspace_status_idx on public.notification_deliveries (workspace_id, status, queued_at desc);
create index if not exists notification_deliveries_member_idx on public.notification_deliveries (member_profile_id, queued_at desc);
create index if not exists app_messages_workspace_status_idx on public.app_messages (workspace_id, status, starts_at, ends_at);
create index if not exists app_message_reads_member_idx on public.app_message_reads (member_profile_id, read_at desc);
create index if not exists checkin_templates_workspace_idx on public.checkin_templates (workspace_id, status, cadence);
create index if not exists checkin_answers_checkin_idx on public.checkin_answers (checkin_id);

alter table public.workspace_domains enable row level security;
alter table public.workspace_team_invitations enable row level security;
alter table public.member_invitations enable row level security;
alter table public.coach_member_notes enable row level security;
alter table public.member_activity_events enable row level security;
alter table public.member_devices enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.app_messages enable row level security;
alter table public.app_message_reads enable row level security;
alter table public.checkin_templates enable row level security;
alter table public.checkin_answers enable row level security;

create policy "workspace domains visible to team"
on public.workspace_domains for select
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "workspace domains created by admins"
on public.workspace_domains for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])));

create policy "workspace domains updated by admins"
on public.workspace_domains for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])));

create policy "workspace domains deleted by admins"
on public.workspace_domains for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])));

create policy "team invitations managed by admins"
on public.workspace_team_invitations for all
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin']::public.workspace_role[])));

create policy "member invitations managed by team"
on public.member_invitations for all
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "coach notes visible to team"
on public.coach_member_notes for select
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "coach notes created by team"
on public.coach_member_notes for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "coach notes updated by team"
on public.coach_member_notes for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "coach notes deleted by team"
on public.coach_member_notes for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "activity visible to owner and team"
on public.member_activity_events for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "activity created by owner or team"
on public.member_activity_events for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "activity deleted by team"
on public.member_activity_events for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "devices visible to owner and team"
on public.member_devices for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "devices upserted by owner or team"
on public.member_devices for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "devices updated by owner or team"
on public.member_devices for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "notification deliveries visible to owner and team"
on public.notification_deliveries for select
to authenticated
using (
  member_profile_id is null
  and (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  or member_profile_id is not null
  and (
    (select private.is_member_profile_owner(workspace_id, member_profile_id))
    or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
  )
);

create policy "notification deliveries created by team"
on public.notification_deliveries for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "notification deliveries updated by team"
on public.notification_deliveries for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "notification deliveries deleted by team"
on public.notification_deliveries for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "app messages visible to workspace members"
on public.app_messages for select
to authenticated
using (
  (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()) and (select private.is_workspace_member(workspace_id)))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "app messages created by team"
on public.app_messages for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "app messages updated by team"
on public.app_messages for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "app messages deleted by team"
on public.app_messages for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "message reads visible to owner and team"
on public.app_message_reads for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "message reads created by owner"
on public.app_message_reads for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

create policy "message reads deleted by team"
on public.app_message_reads for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "checkin templates visible to workspace members"
on public.checkin_templates for select
to authenticated
using (
  (status = 'active' and (select private.is_workspace_member(workspace_id)))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "checkin templates created by team"
on public.checkin_templates for insert
to authenticated
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "checkin templates updated by team"
on public.checkin_templates for update
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])))
with check ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "checkin templates deleted by team"
on public.checkin_templates for delete
to authenticated
using ((select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])));

create policy "checkin answers visible to owner and team"
on public.checkin_answers for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]))
);

create policy "checkin answers created by owner"
on public.checkin_answers for insert
to authenticated
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

create policy "checkin answers updated by owner"
on public.checkin_answers for update
to authenticated
using ((select private.is_member_profile_owner(workspace_id, member_profile_id)))
with check ((select private.is_member_profile_owner(workspace_id, member_profile_id)));

grant select on table public.workspace_domains, public.workspace_team_invitations, public.member_invitations,
  public.coach_member_notes, public.member_activity_events, public.member_devices, public.notification_deliveries,
  public.app_messages, public.app_message_reads, public.checkin_templates, public.checkin_answers
to authenticated;

grant insert, update, delete on table public.workspace_domains, public.workspace_team_invitations, public.member_invitations,
  public.coach_member_notes, public.member_activity_events, public.member_devices, public.notification_deliveries,
  public.app_messages, public.app_message_reads, public.checkin_templates, public.checkin_answers
to authenticated;

grant all privileges on table public.workspace_domains, public.workspace_team_invitations, public.member_invitations,
  public.coach_member_notes, public.member_activity_events, public.member_devices, public.notification_deliveries,
  public.app_messages, public.app_message_reads, public.checkin_templates, public.checkin_answers
to service_role;
