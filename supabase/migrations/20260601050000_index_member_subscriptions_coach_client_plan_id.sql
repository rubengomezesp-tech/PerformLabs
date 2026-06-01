-- Index the member_subscriptions.coach_client_plan_id foreign key.
-- This was applied directly to production (schema_migrations version
-- 20260601182744) during the audit-remediation session but the migration file
-- was never committed, leaving a reproducibility gap: a fresh `db reset` from the
-- repo would not recreate the index. This backfills the file. Idempotent so the
-- replay is safe against the live DB that already has it.
create index if not exists member_subscriptions_coach_client_plan_id_idx
  on public.member_subscriptions using btree (coach_client_plan_id);
