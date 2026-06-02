-- Referential-integrity + value constraints flagged by the data-model audit.
-- All target tables are empty in production at time of writing (0 member_subscriptions,
-- 0 customer_checkins, 0 orphan plan refs), so these add cleanly. Idempotent guards
-- so a replay / fresh `db reset` is safe.
--
-- NOTE: ships through the PR for review before being applied to the live DB.

-- M2: member_subscriptions.coach_client_plan_id was a bare nullable uuid with no FK,
-- so it could point at a non-existent plan. Add the FK (null on plan delete).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'member_subscriptions_coach_client_plan_id_fkey'
  ) then
    alter table public.member_subscriptions
      add constraint member_subscriptions_coach_client_plan_id_fkey
      foreign key (coach_client_plan_id) references public.coach_client_plans (id) on delete set null;
  end if;
end $$;

-- M3 / A7: the platform application fee must be a real percentage. Defense in depth
-- behind the code-side clamp in getStripeEnv. NULL stays allowed (unset).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'member_subscriptions_application_fee_percent_range'
  ) then
    alter table public.member_subscriptions
      add constraint member_subscriptions_application_fee_percent_range
      check (application_fee_percent is null or (application_fee_percent >= 0 and application_fee_percent <= 100));
  end if;
end $$;

-- L1: customer_checkins.status was free text with no CHECK (most other status
-- columns are constrained). Pin it to the values the app actually writes
-- (createMemberCheckin -> 'submitted', reviewMemberCheckin -> 'reviewed').
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_checkins_status_check'
  ) then
    alter table public.customer_checkins
      add constraint customer_checkins_status_check
      check (status in ('submitted', 'reviewed'));
  end if;
end $$;
