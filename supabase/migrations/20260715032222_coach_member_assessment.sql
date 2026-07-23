-- Private, coach-authored assessment. This is intentionally separate from the
-- member onboarding response: the member owns their answers, while this record
-- contains the coach's observations, risk triage and professional rationale.

create table public.coach_member_assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  assessment_kind text not null default 'initial'
    check (assessment_kind in ('initial', 'reassessment')),
  status text not null default 'draft'
    check (status in ('draft', 'complete', 'medical_clearance_required')),
  locale text not null default 'es'
    check (locale in ('es', 'en')),
  interview_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object'),
  risk_flags text[] not null default '{}'::text[],
  completion_percent smallint not null default 0
    check (completion_percent between 0 and 100),
  coach_summary text,
  training_priorities text,
  nutrition_strategy text,
  next_review_on date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_profile_id, assessment_kind)
);

comment on table public.coach_member_assessments is
  'Private coach assessment, observations and decision rationale. Never exposed to member accounts.';

create index coach_member_assessments_workspace_updated_idx
  on public.coach_member_assessments (workspace_id, updated_at desc);

create index coach_member_assessments_member_idx
  on public.coach_member_assessments (member_profile_id);

create or replace function private.set_coach_assessment_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger coach_member_assessments_set_updated_at
before update on public.coach_member_assessments
for each row execute function private.set_coach_assessment_updated_at();

alter table public.coach_member_assessments enable row level security;

create policy "coach assessments visible to team"
  on public.coach_member_assessments
  for select
  to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )));

create policy "coach assessments created by team"
  on public.coach_member_assessments
  for insert
  to authenticated
  with check ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )) and exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id and member.workspace_id = workspace_id
  ));

create policy "coach assessments updated by team"
  on public.coach_member_assessments
  for update
  to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )))
  with check ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )) and exists (
    select 1 from public.member_profiles member
    where member.id = member_profile_id and member.workspace_id = workspace_id
  ));

create policy "coach assessments deleted by admins"
  on public.coach_member_assessments
  for delete
  to authenticated
  using ((select private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin']::public.workspace_role[]
  )));

grant select, insert, update, delete on table public.coach_member_assessments to authenticated;
grant select, insert, update, delete on table public.coach_member_assessments to service_role;
