-- Turn the original contact-message inbox into a workspace-scoped coaching CRM.
-- Existing rows remain valid: every new qualification/attribution field is nullable
-- (or has a safe default), and the public API keeps a legacy-schema fallback while
-- this migration and the application deployment converge.

alter table public.coach_inquiries
  add column if not exists phone text,
  add column if not exists preferred_contact text not null default 'email',
  add column if not exists locale text not null default 'es',
  add column if not exists goal text,
  add column if not exists service_mode text,
  add column if not exists zone text,
  add column if not exists sessions_per_week smallint,
  add column if not exists schedule text,
  add column if not exists training_level text,
  add column if not exists obstacle text,
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'new',
  add column if not exists priority text not null default 'normal',
  add column if not exists qualification_notes text,
  add column if not exists next_action_at timestamptz,
  add column if not exists contacted_at timestamptz,
  add column if not exists source text not null default 'website',
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists landing_path text,
  add column if not exists referrer_host text,
  add column if not exists submission_id text,
  add column if not exists elapsed_ms integer,
  add column if not exists contact_consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_kind_check
    check (kind in ('contact', 'coaching', 'diagnostic'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_preferred_contact_check
    check (preferred_contact in ('email', 'whatsapp', 'phone'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_locale_check
    check (locale in ('es', 'en'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_goal_check
    check (goal is null or goal in ('fatloss', 'muscle', 'recomp', 'stage'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_service_mode_check
    check (service_mode is null or service_mode in ('condo', 'gym', 'outdoor', 'online'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_zone_check
    check (zone is null or zone in ('wynwood', 'brickell', 'midtown', 'edgewater', 'online'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_sessions_check
    check (sessions_per_week is null or sessions_per_week between 2 and 5);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_schedule_check
    check (schedule is null or schedule in ('morning', 'midday', 'evening', 'flexible'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_training_level_check
    check (training_level is null or training_level in ('start', 'middle', 'advanced'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_obstacle_check
    check (obstacle is null or obstacle in ('consistency', 'clarity', 'time', 'progress'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_status_check
    check (status in ('new', 'contacted', 'qualified', 'booked', 'won', 'nurture', 'lost'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_priority_check
    check (priority in ('low', 'normal', 'high'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.coach_inquiries
    add constraint coach_inquiries_elapsed_ms_check
    check (elapsed_ms is null or elapsed_ms between 0 and 86400000);
exception when duplicate_object then null;
end $$;

-- Hydrate any diagnostic accepted by the six-column compatibility path before
-- this migration landed. The message is deliberately line-based and durable.
-- Only the earliest duplicate receives submission_id so the unique index can be
-- added without deleting historical rows; application lookups also use the
-- marker, making all later retries idempotent.
with parsed as (
  select
    id,
    workspace_id,
    created_at,
    nullif(btrim(split_part(split_part(message, 'RG_SUBMISSION_ID: ', 2), E'\n', 1)), '') as parsed_submission_id,
    nullif(btrim(split_part(split_part(message, E'\nphone: ', 2), E'\n', 1)), '') as parsed_phone,
    nullif(btrim(split_part(split_part(message, E'\ngoal: ', 2), E'\n', 1)), '') as parsed_goal,
    nullif(btrim(split_part(split_part(message, E'\nplace: ', 2), E'\n', 1)), '') as parsed_place,
    nullif(btrim(split_part(split_part(message, E'\narea: ', 2), E'\n', 1)), '') as parsed_area,
    nullif(btrim(split_part(split_part(message, E'\nsessions: ', 2), E'\n', 1)), '') as parsed_sessions,
    nullif(btrim(split_part(split_part(message, E'\nschedule: ', 2), E'\n', 1)), '') as parsed_schedule,
    nullif(btrim(split_part(split_part(message, E'\nlevel: ', 2), E'\n', 1)), '') as parsed_level,
    nullif(btrim(split_part(split_part(message, E'\nobstacle: ', 2), E'\n', 1)), '') as parsed_obstacle,
    nullif(btrim(split_part(split_part(message, E'\nlocale: ', 2), E'\n', 1)), '') as parsed_locale,
    nullif(btrim(split_part(split_part(message, E'\nelapsed_ms: ', 2), E'\n', 1)), '') as parsed_elapsed_ms,
    nullif(btrim(split_part(split_part(message, E'\nconsent_version: ', 2), E'\n', 1)), '') as parsed_consent_version,
    nullif(btrim(split_part(split_part(message, E'\nutm_source: ', 2), E'\n', 1)), '') as parsed_utm_source,
    nullif(btrim(split_part(split_part(message, E'\nutm_medium: ', 2), E'\n', 1)), '') as parsed_utm_medium,
    nullif(btrim(split_part(split_part(message, E'\nutm_campaign: ', 2), E'\n', 1)), '') as parsed_utm_campaign,
    nullif(btrim(split_part(split_part(message, E'\nutm_content: ', 2), E'\n', 1)), '') as parsed_utm_content,
    nullif(btrim(split_part(split_part(message, E'\nutm_term: ', 2), E'\n', 1)), '') as parsed_utm_term,
    nullif(btrim(split_part(split_part(message, E'\nlanding_path: ', 2), E'\n', 1)), '') as parsed_landing_path,
    nullif(btrim(split_part(split_part(message, E'\nreferrer_host: ', 2), E'\n', 1)), '') as parsed_referrer_host
  from public.coach_inquiries
  where message like E'RG_DIAGNOSTIC_V1\n%'
), ranked as (
  select
    parsed.*,
    row_number() over (
      partition by workspace_id, parsed_submission_id
      order by created_at asc, id asc
    ) as submission_rank
  from parsed
)
update public.coach_inquiries as inquiry
set
  submission_id = coalesce(
    inquiry.submission_id,
    case
      when ranked.submission_rank = 1
        and ranked.parsed_submission_id ~* '^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|rg-[0-9]{10,}-[0-9a-f]+)$'
      then ranked.parsed_submission_id
    end
  ),
  phone = coalesce(inquiry.phone, ranked.parsed_phone),
  preferred_contact = case when coalesce(inquiry.phone, ranked.parsed_phone) is not null then 'whatsapp' else inquiry.preferred_contact end,
  locale = case when ranked.parsed_locale in ('es', 'en') then ranked.parsed_locale else inquiry.locale end,
  goal = coalesce(inquiry.goal, case when ranked.parsed_goal in ('fatloss', 'muscle', 'recomp', 'stage') then ranked.parsed_goal end),
  service_mode = coalesce(inquiry.service_mode, case when ranked.parsed_place in ('condo', 'gym', 'outdoor', 'online') then ranked.parsed_place end),
  zone = coalesce(
    inquiry.zone,
    case
      when ranked.parsed_place = 'online' then 'online'
      when lower(ranked.parsed_area) in ('wynwood', 'brickell', 'midtown', 'edgewater') then lower(ranked.parsed_area)
    end
  ),
  sessions_per_week = coalesce(
    inquiry.sessions_per_week,
    case when ranked.parsed_sessions in ('2', '3', '4', '5') then ranked.parsed_sessions::smallint end
  ),
  schedule = coalesce(inquiry.schedule, case when ranked.parsed_schedule in ('morning', 'midday', 'evening', 'flexible') then ranked.parsed_schedule end),
  training_level = coalesce(inquiry.training_level, case when ranked.parsed_level in ('start', 'middle', 'advanced') then ranked.parsed_level end),
  obstacle = coalesce(inquiry.obstacle, case when ranked.parsed_obstacle in ('consistency', 'clarity', 'time', 'progress') then ranked.parsed_obstacle end),
  answers = case
    when inquiry.answers = '{}'::jsonb
      and ranked.parsed_goal in ('fatloss', 'muscle', 'recomp', 'stage')
      and ranked.parsed_place in ('condo', 'gym', 'outdoor', 'online')
      and (ranked.parsed_place = 'online' or ranked.parsed_area in ('Wynwood', 'Brickell', 'Midtown', 'Edgewater'))
      and ranked.parsed_sessions in ('2', '3', '4', '5')
      and ranked.parsed_schedule in ('morning', 'midday', 'evening', 'flexible')
      and ranked.parsed_level in ('start', 'middle', 'advanced')
      and ranked.parsed_obstacle in ('consistency', 'clarity', 'time', 'progress')
    then jsonb_build_object(
      'goal', ranked.parsed_goal,
      'place', ranked.parsed_place,
      'area', case when ranked.parsed_place = 'online' then '' else ranked.parsed_area end,
      'sessions', ranked.parsed_sessions,
      'schedule', ranked.parsed_schedule,
      'level', ranked.parsed_level,
      'obstacle', ranked.parsed_obstacle
    )
    else inquiry.answers
  end,
  utm_source = coalesce(inquiry.utm_source, ranked.parsed_utm_source),
  utm_medium = coalesce(inquiry.utm_medium, ranked.parsed_utm_medium),
  utm_campaign = coalesce(inquiry.utm_campaign, ranked.parsed_utm_campaign),
  utm_content = coalesce(inquiry.utm_content, ranked.parsed_utm_content),
  utm_term = coalesce(inquiry.utm_term, ranked.parsed_utm_term),
  landing_path = coalesce(inquiry.landing_path, ranked.parsed_landing_path),
  referrer_host = coalesce(inquiry.referrer_host, ranked.parsed_referrer_host),
  source = case
    when inquiry.source = 'website'
    then coalesce(ranked.parsed_utm_source, ranked.parsed_referrer_host, 'direct')
    else inquiry.source
  end,
  elapsed_ms = coalesce(
    inquiry.elapsed_ms,
    case
      when ranked.parsed_elapsed_ms ~ '^[0-9]{1,8}$'
        and ranked.parsed_elapsed_ms::bigint between 0 and 86400000
      then ranked.parsed_elapsed_ms::integer
    end
  ),
  contact_consent_at = coalesce(inquiry.contact_consent_at, inquiry.created_at),
  consent_version = coalesce(inquiry.consent_version, ranked.parsed_consent_version, 'rg-diagnostic-contact-v1')
from ranked
where inquiry.id = ranked.id;

create unique index if not exists coach_inquiries_workspace_submission_uidx
  on public.coach_inquiries (workspace_id, submission_id)
  where submission_id is not null;

create index if not exists coach_inquiries_workspace_status_created_idx
  on public.coach_inquiries (workspace_id, status, created_at desc);

create index if not exists coach_inquiries_workspace_email_idx
  on public.coach_inquiries (workspace_id, lower(email));

create index if not exists coach_inquiries_workspace_phone_idx
  on public.coach_inquiries (workspace_id, phone)
  where phone is not null;

create index if not exists coach_inquiries_workspace_source_idx
  on public.coach_inquiries (workspace_id, source, created_at desc);

-- Preserve the server-only posture. Public capture continues through the API;
-- browsers never receive direct table privileges or an RLS INSERT policy.
alter table public.coach_inquiries enable row level security;

-- The shared limiter migration intentionally revoked PUBLIC/anon/authenticated,
-- but service-role calls also need an explicit grant after that revoke.
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
