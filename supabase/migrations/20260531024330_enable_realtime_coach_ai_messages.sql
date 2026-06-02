-- Realtime for the coach<->member chat. RLS (applied earlier) is enforced on
-- postgres_changes, so each side only receives its own thread's events.
alter publication supabase_realtime add table public.coach_ai_messages;
-- Full row in UPDATE/DELETE payloads (otherwise only the PK is sent).
alter table public.coach_ai_messages replica identity full;
