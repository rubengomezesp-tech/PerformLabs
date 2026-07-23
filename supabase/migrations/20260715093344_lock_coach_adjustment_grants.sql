-- Supabase projects created with legacy Data API defaults can automatically
-- grant CRUD on new public tables. RLS already denies rows, but the immutable
-- decision log also removes the unnecessary table privileges as defence in depth.
revoke all on table public.coach_member_adjustments from anon;
revoke update, delete on table public.coach_member_adjustments from authenticated;

grant select, insert on table public.coach_member_adjustments to authenticated;
