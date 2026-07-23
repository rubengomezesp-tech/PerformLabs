-- One permissive SELECT policy per authenticated role avoids evaluating two
-- policies for every wallet/agenda read while preserving owner-or-team access.

drop policy if exists "members read own session packs" on public.member_session_packs;
drop policy if exists "team reads session packs" on public.member_session_packs;
create policy "session packs readable by owner or team"
  on public.member_session_packs for select to authenticated
  using (
    exists (
      select 1 from public.member_profiles member
      where member.id = member_profile_id
        and member.workspace_id = workspace_id
        and member.user_id = (select auth.uid())
    )
    or (select private.has_workspace_role(
      workspace_id,
      array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
    ))
  );

drop policy if exists "members read own session ledger" on public.member_session_ledger;
drop policy if exists "team reads session ledger" on public.member_session_ledger;
create policy "session ledger readable by owner or team"
  on public.member_session_ledger for select to authenticated
  using (
    exists (
      select 1 from public.member_profiles member
      where member.id = member_profile_id
        and member.workspace_id = workspace_id
        and member.user_id = (select auth.uid())
    )
    or (select private.has_workspace_role(
      workspace_id,
      array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
    ))
  );

drop policy if exists "members read own personal training sessions" on public.personal_training_sessions;
drop policy if exists "team reads personal training sessions" on public.personal_training_sessions;
create policy "personal training sessions readable by owner or team"
  on public.personal_training_sessions for select to authenticated
  using (
    exists (
      select 1 from public.member_profiles member
      where member.id = member_profile_id
        and member.workspace_id = workspace_id
        and member.user_id = (select auth.uid())
    )
    or (select private.has_workspace_role(
      workspace_id,
      array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
    ))
  );

drop policy if exists "members read own personal training session events" on public.personal_training_session_events;
drop policy if exists "team reads personal training session events" on public.personal_training_session_events;
create policy "personal training events readable by owner or team"
  on public.personal_training_session_events for select to authenticated
  using (
    exists (
      select 1 from public.member_profiles member
      where member.id = member_profile_id
        and member.workspace_id = workspace_id
        and member.user_id = (select auth.uid())
    )
    or (select private.has_workspace_role(
      workspace_id,
      array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
    ))
  );
