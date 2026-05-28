drop policy if exists "workspace team can manage member onboarding responses" on public.member_onboarding_responses;
drop policy if exists "members can read own onboarding responses" on public.member_onboarding_responses;
drop policy if exists "members can submit own onboarding responses" on public.member_onboarding_responses;
drop policy if exists "members can update own onboarding responses" on public.member_onboarding_responses;

create policy "authenticated can read member onboarding responses"
on public.member_onboarding_responses
for select
to authenticated
using (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  or exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.user_id = (select auth.uid())
  )
);

create policy "authenticated can submit member onboarding responses"
on public.member_onboarding_responses
for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  or exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.workspace_id = member_onboarding_responses.workspace_id
      and profile.user_id = (select auth.uid())
  )
);

create policy "authenticated can update member onboarding responses"
on public.member_onboarding_responses
for update
to authenticated
using (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  or exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.user_id = (select auth.uid())
  )
)
with check (
  public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[])
  or exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_onboarding_responses.member_profile_id
      and profile.workspace_id = member_onboarding_responses.workspace_id
      and profile.user_id = (select auth.uid())
  )
);

create policy "workspace team can delete member onboarding responses"
on public.member_onboarding_responses
for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]));
