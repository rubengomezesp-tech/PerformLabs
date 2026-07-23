-- Lote A del plan "aula de clientes": notificación instantánea de check-ins.
-- 1) member_notifications: bandeja in-app del miembro (web y app nativa vía RLS).
-- 2) coach_checkin_email_deliveries: ledger de entregas del email inmediato al coach.
-- 3) Índice único anti doble-submit de check-ins (por miembro y minuto).
-- 4) Seed de plantilla push "checkin.reviewed" por workspace.

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  kind text not null check (kind in ('checkin_reviewed', 'plan_published', 'consent_request', 'general')),
  title text not null,
  body text not null default '',
  url text not null default '/app',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists member_notifications_member_unread_idx
  on public.member_notifications (member_profile_id, created_at desc)
  where read_at is null;

alter table public.member_notifications enable row level security;

-- El miembro (app nativa con anon+RLS y web) lee sus propias filas; el equipo del
-- workspace también puede verlas. Los inserts llegan solo por service-role.
drop policy if exists "member notifications visible to owner and team" on public.member_notifications;
create policy "member notifications visible to owner and team" on public.member_notifications for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  );

-- read_at se marca por RPC (no policy de UPDATE abierta): el dueño solo puede
-- marcar como leídas sus propias notificaciones, nada más.
create or replace function public.mark_member_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public, private
as $$
  update public.member_notifications
  set read_at = now()
  where id = p_notification_id
    and read_at is null
    and private.is_member_profile_owner(workspace_id, member_profile_id);
$$;

revoke all on function public.mark_member_notification_read(uuid) from public;
grant execute on function public.mark_member_notification_read(uuid) to authenticated;
grant execute on function public.mark_member_notification_read(uuid) to service_role;

-- Ledger de emails inmediatos de check-in (patrón coach_agenda_digest_deliveries):
-- permite backfill por el digest, reintentos y contador de fallos consultable.
create table if not exists public.coach_checkin_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  checkin_id uuid not null references public.customer_checkins(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_code text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checkin_id)
);

alter table public.coach_checkin_email_deliveries enable row level security;
-- Deny-all intencional (RLS on, sin policies = solo service-role): es un artefacto
-- operacional del backend, ni miembros ni coaches lo leen directamente.
comment on table public.coach_checkin_email_deliveries is
  'Ledger de entregas del email inmediato de check-in al coach. Service-role only (deny-all).';

-- Anti doble-submit: un miembro no puede tener dos check-ins en el mismo minuto.
-- timezone(text, timestamptz) es immutable, por eso es indexable.
create unique index if not exists customer_checkins_member_minute_uniq
  on public.customer_checkins (member_profile_id, date_trunc('minute', timezone('UTC', submitted_at)))
  where submitted_at is not null;

-- Plantilla push "checkin.reviewed" por workspace (sin fila la notificación nace
-- muerta: getEnabledPushTemplate devuelve null). Idempotente.
insert into public.notification_templates (workspace_id, event_key, channel, subject, body, is_enabled)
select w.id, 'checkin.reviewed', 'push', 'Check-in revisado',
       jsonb_build_object('message', 'Tu coach ha revisado tu check-in y te ha dejado feedback. Entra a verlo.'),
       true
from public.workspaces w
where not exists (
  select 1 from public.notification_templates t
  where t.workspace_id = w.id and t.event_key = 'checkin.reviewed' and t.channel = 'push'
);
