-- Expose public schema tables to Supabase Data API roles.
-- RLS remains enabled and policies still decide row visibility.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to service_role;

alter default privileges in schema public
grant select on tables to anon, authenticated;

alter default privileges in schema public
grant insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to anon, authenticated;

alter default privileges in schema public
grant all privileges on sequences to service_role;
