-- Lote B del plan "aula de clientes": evaluación inicial obligatoria.
-- 1) intake_gate_exempt: grandfathering (todos los miembros existentes exentos)
--    + override del coach por miembro. Los miembros nuevos nacen gated.
-- 2) member_onboarding_drafts: guardado por-paso del quiz (retomable).
-- 3) Seed de plantilla push "plan.published" por workspace.

alter table public.member_profiles
  add column if not exists intake_gate_exempt boolean not null default false;

-- Grandfathering: nadie que ya exista queda bloqueado el día del deploy.
update public.member_profiles set intake_gate_exempt = true where intake_gate_exempt = false;

comment on column public.member_profiles.intake_gate_exempt is
  'Exención del gate de valoración inicial: true = entra al aula sin completar el quiz. Backfill=true para miembros previos al gate (2026-07-23); el coach puede alternarlo por miembro.';

create table if not exists public.member_onboarding_drafts (
  member_profile_id uuid primary key references public.member_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  step integer not null default 0,
  answers jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.member_onboarding_drafts enable row level security;
-- Deny-all intencional (service-role only): el quiz corre en server actions web;
-- contiene respuestas de salud sensibles y nunca se lee desde clientes anon.
comment on table public.member_onboarding_drafts is
  'Borrador por-paso del quiz de valoración inicial. Service-role only (deny-all).';

insert into public.notification_templates (workspace_id, event_key, channel, subject, body, is_enabled)
select w.id, 'plan.published', 'push', '¡Tu plan está listo!',
       jsonb_build_object('message', 'Tu coach ha publicado tu plan. Entra y empieza por la ruta de hoy.'),
       true
from public.workspaces w
where not exists (
  select 1 from public.notification_templates t
  where t.workspace_id = w.id and t.event_key = 'plan.published' and t.channel = 'push'
);
