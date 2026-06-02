-- Tighten the coach_ai_messages INSERT policy so a member (anon-key / mobile)
-- can only post their OWN message with role='user'. Only workspace staff may
-- insert coach/assistant messages. The web writes AI replies via service_role,
-- which bypasses RLS, so this constrains only the mobile (authenticated anon)
-- path. Mirrors the prior mbr_insert_own_team check + adds the role gate.
-- Idempotent (drop ... if exists before create).

drop policy if exists "mbr_insert_own_team" on public.coach_ai_messages;

create policy "mbr_insert_own_team" on public.coach_ai_messages
for insert
with check (
  (
    private.is_member_profile_owner(workspace_id, member_profile_id)
    and role = 'user'
  )
  or private.has_workspace_role(
    workspace_id,
    array['platform_owner', 'agency_admin', 'coach_admin', 'coach_staff']::public.workspace_role[]
  )
);
