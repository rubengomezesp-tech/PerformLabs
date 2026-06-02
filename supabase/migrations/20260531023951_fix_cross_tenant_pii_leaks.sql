-- P0: member_profiles SELECT leaked every profile in the workspace (email, phone,
-- health data) to any member via is_workspace_member. Restrict to own row + staff.
drop policy if exists "members can read profiles in workspace" on public.member_profiles;
create policy "members read own profile, staff read workspace" on public.member_profiles for select
  using (
    user_id = (select auth.uid())
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  );

-- P1: member_training_reviews SELECT matched member_profile by user_id without
-- tying workspace_id -> cross-tenant read for users with profiles in >1 workspace.
drop policy if exists "training reviews visible to owner and team" on public.member_training_reviews;
create policy "training reviews visible to owner and team" on public.member_training_reviews for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  );

-- P1: support_conversations SELECT — same unscoped pattern. Its own INSERT policy
-- already ties workspace_id; mirror that on SELECT.
drop policy if exists "support conversations visible to owner and team" on public.support_conversations;
create policy "support conversations visible to owner and team" on public.support_conversations for select
  using (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    or private.has_workspace_role(workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  );

-- P1: support_messages SELECT — join through conversation without comparing
-- conversation.workspace_id = support_messages.workspace_id (the INSERT does).
drop policy if exists "support messages visible to owner and team" on public.support_messages;
create policy "support messages visible to owner and team" on public.support_messages for select
  using (
    (exists (
      select 1 from public.support_conversations conversation
      join public.member_profiles profile on profile.id = conversation.member_profile_id
      where conversation.id = support_messages.conversation_id
        and conversation.workspace_id = support_messages.workspace_id
        and profile.user_id = (select auth.uid())
    ))
    or private.has_workspace_role(support_messages.workspace_id, array['platform_owner','agency_admin','coach_admin','coach_staff']::workspace_role[])
  );

-- P1: member_onboarding_responses legacy policies use unschema'd has_workspace_role
-- and an unscoped SELECT/UPDATE-USING (cross-tenant). The new mbr_* policies (applied
-- in member_rls_policies_for_mobile) are correct and scoped; drop the legacy ones.
drop policy if exists "authenticated can read member onboarding responses" on public.member_onboarding_responses;
drop policy if exists "authenticated can submit member onboarding responses" on public.member_onboarding_responses;
drop policy if exists "authenticated can update member onboarding responses" on public.member_onboarding_responses;
drop policy if exists "workspace team can delete member onboarding responses" on public.member_onboarding_responses;
