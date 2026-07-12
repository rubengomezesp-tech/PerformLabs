-- Workspace domain columns are written by the trusted backend with the
-- Supabase service role. The normalization trigger runs with invoker rights
-- and calls this helper, so the backend needs this one narrow permission.
-- Browser-facing roles remain unable to call any of the trigger helpers.
grant execute on function public.canonical_workspace_domain(text)
  to service_role;
