import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

// Member -> Coach subscriptions (Phase 1 monetization). Mirrors the style of
// stripe-billing.ts: a getSupabaseServiceEnv() guard so every write no-ops
// cleanly without Supabase env, snake_case payloads, and `(supabase as any)`
// casts because these columns/tables post-date the generated database.types.

/** The subscription status enum on member_profiles (0001_initial_schema.sql). */
export type MemberSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired";

const MEMBER_STATUSES: ReadonlySet<MemberSubscriptionStatus> = new Set([
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
]);

/** Clamp any Stripe/free-text status to a valid member_profiles enum value. */
export function clampMemberStatus(status: string | null | undefined): MemberSubscriptionStatus {
  return status && MEMBER_STATUSES.has(status as MemberSubscriptionStatus)
    ? (status as MemberSubscriptionStatus)
    : "active";
}

export type MemberSubscription = {
  id: string;
  workspaceId: string | null;
  memberProfileId: string | null;
  coachClientPlanId: string | null;
  stripeAccountId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  applicationFeePercent: number | null;
  amount: number | null;
  currency: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type MemberSubscriptionRow = {
  id: string;
  workspace_id: string | null;
  member_profile_id: string | null;
  coach_client_plan_id: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  application_fee_percent: number | null;
  amount: number | null;
  currency: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

function mapSubscription(row: MemberSubscriptionRow): MemberSubscription {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    memberProfileId: row.member_profile_id,
    coachClientPlanId: row.coach_client_plan_id,
    stripeAccountId: row.stripe_account_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    applicationFeePercent: row.application_fee_percent,
    amount: row.amount,
    currency: row.currency,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  };
}

/**
 * Upsert a member subscription, keyed by stripe_subscription_id (the partial
 * unique index added in 20260531230000_member_billing_connect.sql). Only fields
 * that are provided are written, so a later event can patch a row created by an
 * earlier one without clobbering known values with nulls.
 */
export async function upsertMemberSubscription(record: {
  workspaceId?: string | null;
  memberProfileId?: string | null;
  coachClientPlanId?: string | null;
  stripeAccountId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId: string;
  stripePriceId?: string | null;
  status: string;
  applicationFeePercent?: number | null;
  amount?: number | null;
  currency?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !record.stripeSubscriptionId) return;
  // Tables/columns post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;

  const payload: Record<string, unknown> = {
    stripe_subscription_id: record.stripeSubscriptionId,
    status: record.status,
    updated_at: new Date().toISOString(),
  };
  if (record.workspaceId !== undefined) payload.workspace_id = record.workspaceId;
  if (record.memberProfileId !== undefined) payload.member_profile_id = record.memberProfileId;
  if (record.coachClientPlanId !== undefined) payload.coach_client_plan_id = record.coachClientPlanId;
  if (record.stripeAccountId !== undefined) payload.stripe_account_id = record.stripeAccountId;
  if (record.stripeCustomerId !== undefined) payload.stripe_customer_id = record.stripeCustomerId;
  if (record.stripePriceId !== undefined) payload.stripe_price_id = record.stripePriceId;
  if (record.applicationFeePercent !== undefined) payload.application_fee_percent = record.applicationFeePercent;
  if (record.amount !== undefined) payload.amount = record.amount;
  if (record.currency !== undefined) payload.currency = record.currency;
  if (record.currentPeriodStart !== undefined) payload.current_period_start = record.currentPeriodStart;
  if (record.currentPeriodEnd !== undefined) payload.current_period_end = record.currentPeriodEnd;
  if (record.cancelAtPeriodEnd !== undefined) payload.cancel_at_period_end = record.cancelAtPeriodEnd;

  await supabase.from("member_subscriptions").upsert(payload, { onConflict: "stripe_subscription_id" });
}

/** The most recent member subscription for a member profile, if any. */
export async function getMemberSubscriptionByMember(memberProfileId: string): Promise<MemberSubscription | null> {
  if (!getSupabaseServiceEnv().ok || !memberProfileId) return null;
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase
    .from("member_subscriptions")
    .select("*")
    .eq("member_profile_id", memberProfileId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapSubscription(data as MemberSubscriptionRow) : null;
}

/** Store the member's Stripe customer id (on the coach's connected account). */
export async function setMemberStripeCustomer(memberProfileId: string, stripeCustomerId: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !memberProfileId || !stripeCustomerId) return;
  const supabase = createServiceSupabaseClient() as any;
  await supabase
    .from("member_profiles")
    .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
    .eq("id", memberProfileId);
}

/**
 * Update the member's gating status on member_profiles. The value is clamped to
 * the subscription_status enum so an unexpected Stripe status can never violate
 * the column constraint.
 */
export async function setMemberSubscriptionStatus(memberProfileId: string, status: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !memberProfileId) return;
  const supabase = createServiceSupabaseClient() as any;
  await supabase
    .from("member_profiles")
    .update({ subscription_status: clampMemberStatus(status), updated_at: new Date().toISOString() })
    .eq("id", memberProfileId);
}

/**
 * Record a platform fee event (earnings ledger). Idempotent on `id` (the Stripe
 * invoice id): a duplicate id is a no-op and returns false, mirroring
 * recordWebhookEvent.
 */
export async function recordPlatformFeeEvent(record: {
  id: string;
  workspaceId?: string | null;
  memberProfileId?: string | null;
  stripeAccountId?: string | null;
  stripeSubscriptionId?: string | null;
  amountTotal?: number | null;
  applicationFeeAmount?: number | null;
  currency?: string | null;
  status?: string | null;
}): Promise<boolean> {
  if (!getSupabaseServiceEnv().ok) return true;
  if (!record.id) return false;
  const supabase = createServiceSupabaseClient() as any;
  const { error } = await supabase.from("platform_fee_events").insert({
    id: record.id,
    workspace_id: record.workspaceId ?? null,
    member_profile_id: record.memberProfileId ?? null,
    stripe_account_id: record.stripeAccountId ?? null,
    stripe_subscription_id: record.stripeSubscriptionId ?? null,
    amount_total: record.amountTotal ?? null,
    application_fee_amount: record.applicationFeeAmount ?? null,
    currency: record.currency ?? null,
    status: record.status ?? null,
  });
  // A unique-violation on the primary key means we have seen this invoice before.
  return !error;
}
