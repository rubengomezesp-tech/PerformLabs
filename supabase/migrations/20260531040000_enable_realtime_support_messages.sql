-- Enable Supabase Realtime for the member↔coach 1:1 chat.
--
-- NOTE: The web app currently keeps the chat "live" via lightweight polling
-- (router.refresh on an interval) because the member's JWT lives in an httpOnly
-- cookie that the browser JS can't read, so an authenticated Realtime socket is
-- not trivially available client-side. This migration is authored so that, the
-- moment a token is exposed to the browser for `supabase.realtime.setAuth(...)`,
-- the tables already publish row changes and carry the old-row data Realtime
-- needs for UPDATE/DELETE payloads. It is idempotent and safe to apply later.
-- DO NOT rely on it for security: row visibility is still governed by the RLS
-- policies on support_conversations / support_messages.

-- `replica identity full` makes UPDATE/DELETE realtime payloads include the full
-- previous row (needed for read_at / status changes to be observable).
alter table public.support_messages replica identity full;
alter table public.support_conversations replica identity full;

-- Add the tables to the realtime publication, guarding against duplicates so the
-- migration can run on databases where they were already added.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_conversations'
  ) then
    alter publication supabase_realtime add table public.support_conversations;
  end if;
end
$$;
