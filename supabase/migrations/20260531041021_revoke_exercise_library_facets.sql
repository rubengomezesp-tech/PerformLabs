-- ===========================================================================
-- Revoke EXECUTE on public.exercise_library_facets from anon / authenticated.
-- ---------------------------------------------------------------------------
-- Rationale (Supabase advisors 0028/0029):
--   public.exercise_library_facets(p_workspace_id uuid) is declared
--   SECURITY DEFINER (see 20260530230000_exercise_library_facets_fn.sql). When
--   a SECURITY DEFINER function is EXECUTE-able by the anon / authenticated
--   roles, any client can run it with the definer's privileges, bypassing RLS.
--   This function is only ever called server-side via the service_role (which
--   retains its grant), so the anon / authenticated grants are unnecessary
--   attack surface.
--
--   PostgreSQL auto-grants EXECUTE on new functions to PUBLIC, and Supabase's
--   default privileges grant it to anon / authenticated. This migration revokes
--   those grants for every overload of the function. It does NOT change the
--   function body or its service_role grant.
--
-- Idempotent: REVOKE is a no-op if the grant is already absent.
-- ===========================================================================

revoke execute on function public.exercise_library_facets(uuid) from anon, authenticated;

-- Also strip the implicit PUBLIC grant, which would otherwise let any role
-- (including anon / authenticated) execute the function regardless of the
-- explicit revokes above.
revoke execute on function public.exercise_library_facets(uuid) from public;
