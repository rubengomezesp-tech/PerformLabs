-- Lote D del plan "aula de clientes": reevaluaciones + antes/después consentido.

-- 1) Histórico de reevaluaciones: la unique (member, kind) solo permitía UNA
--    reevaluación por miembro. La inicial sigue siendo única; las reevaluaciones
--    son un histórico ordenado por fecha de entrevista.
alter table public.coach_member_assessments
  drop constraint if exists coach_member_assessments_member_profile_id_assessment_kind_key;
create unique index if not exists coach_member_assessments_initial_uniq
  on public.coach_member_assessments (member_profile_id)
  where assessment_kind = 'initial';
create index if not exists coach_member_assessments_member_hist_idx
  on public.coach_member_assessments (member_profile_id, interview_at desc);

-- 2) Consentimiento de fotos antes/después (D-7): el cliente consiente una
--    TARJETA concreta (par de check-ins), no una abstracción. Estados en ambos
--    lados; la exportación solo existe mientras status='granted'.
create table if not exists public.member_photo_consents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  before_checkin_id uuid not null references public.customer_checkins(id) on delete cascade,
  after_checkin_id uuid not null references public.customer_checkins(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'granted', 'denied', 'revoked')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists member_photo_consents_member_idx
  on public.member_photo_consents (member_profile_id, status);

alter table public.member_photo_consents enable row level security;
drop policy if exists "photo consents visible to owner and team" on public.member_photo_consents;
create policy "photo consents visible to owner and team" on public.member_photo_consents for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  );
comment on table public.member_photo_consents is
  'Consentimiento por-uso para tarjetas antes/después. Escrituras solo por service-role (server actions con guard de sesión).';
