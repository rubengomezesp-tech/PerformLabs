alter table public.workspace_team_invitations
  drop constraint if exists workspace_team_invitations_workspace_id_email_role_status_key;

create unique index if not exists workspace_team_invitations_one_pending_per_role_idx
  on public.workspace_team_invitations (workspace_id, email, role)
  where status = 'pending';
