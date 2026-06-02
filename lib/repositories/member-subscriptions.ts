import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";
import { isUuid } from "@/lib/utils/uuid";

// Member -> Coach subscriptions (Phase 1 monetization). Mirrors the style of
// stripe-billing.ts: a getSupabaseServiceEnv() guard so every write no-ops
// cleanly without Supabase env, and snake_case payloads.

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
  const value = (status || "").toLowerCase();
  if (MEMBER_STATUSES.has(value as MemberSubscriptionStatus)) return value as MemberSubscriptionStatus;
  // Map Stripe statuses that aren't 1:1 with our enum, and NEVER silently grant
  // access: an unknown / non-paying status defaults to a non-entitling value so a
  // member without a cleared payment (canceled / unpaid / incomplete) can't slip
  // into /app, which gates on {active, trialing}.
  if (value === "canceled") return "cancelled";
  if (value === "incomplete") return "past_due";
  if (value === "unpaid" || value === "incomplete_expired") return "expired";
  return "expired";
}

/**
 * Defense in depth for the connected-webhook path. member_profile_id and
 * coach_client_plan_id arrive in coach-controllable Stripe metadata (a coach owns
 * their connected account and can craft events), so before we mirror status onto
 * a member or attach a plan we confirm the id actually belongs to the workspace
 * that owns the account. A foreign/forged id is treated as absent — never written
 * across tenants.
 */
export async function isMemberInWorkspace(memberProfileId: string | null | undefined, workspaceId: string): Promise<boolean> {
  if (!isUuid(memberProfileId) || !isUuid(workspaceId)) return false;
  if (!getSupabaseServiceEnv().ok) return false;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("id", memberProfileId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function isCoachPlanInWorkspace(coachClientPlanId: string | null | undefined, workspaceId: string): Promise<boolean> {
  if (!isUuid(coachClientPlanId) || !isUuid(workspaceId)) return false;
  if (!getSupabaseServiceEnv().ok) return false;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("coach_client_plans")
    .select("id")
    .eq("id", coachClientPlanId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return Boolean(data?.id);
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
  const supabase = createServiceSupabaseClient();

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

  // Partial upsert: only provided fields are written (a later event patches an
  // earlier row), so the dynamic payload is asserted to the table's Insert type.
  await supabase
    .from("member_subscriptions")
    .upsert(payload as TablesInsert<"member_subscriptions">, { onConflict: "stripe_subscription_id" });
}

/** The most recent member subscription for a member profile, if any. */
export async function getMemberSubscriptionByMember(memberProfileId: string): Promise<MemberSubscription | null> {
  if (!getSupabaseServiceEnv().ok || !memberProfileId) return null;
  const supabase = createServiceSupabaseClient();
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
  const supabase = createServiceSupabaseClient();
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
  const supabase = createServiceSupabaseClient();
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
  const supabase = createServiceSupabaseClient();
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
  if (!error) return true;
  // A unique-violation (23505) means we already recorded this invoice — benign.
  if ((error as { code?: string }).code === "23505") return true;
  // Any other error is transient (pool/timeout): throw so the webhook route
  // returns 500 and Stripe re-delivers, instead of silently dropping a fee event.
  throw new Error(`platform_fee_events insert failed: ${error.message ?? "unknown"}`);
}

export type WorkspaceBillingSummary = {
  total: number;
  active: number;
  trialing: number;
  pastDue: number;
  /** paused / cancelled / expired — no longer billing. */
  inactive: number;
  /** Sum of the recurring charge (cents) across active subscriptions. */
  mrrCents: number;
  /** Average recurring revenue per active member (cents). */
  arpuCents: number;
  /** Upper-cased dominant currency code (defaults to EUR). */
  currency: string;
};

/**
 * Workspace-level billing read for the coach analytics page. member_subscriptions
 * is service-role only, so this uses the service client like the rest of this
 * module. `amount` is the recurring price unit_amount in cents (see the Stripe
 * webhook); MRR sums it across active subscriptions only.
 */
/** Row shape the workspace billing summary reads from member_subscriptions. */
export type WorkspaceBillingRow = { status: string | null; amount: number | null; currency: string | null };

/**
 * Pure aggregation behind getWorkspaceBillingSummary: counts by clamped status,
 * sums active MRR, derives ARPU and the dominant currency. Extracted so the money
 * math is unit-tested without a DB.
 */
export function summarizeWorkspaceBilling(rows: WorkspaceBillingRow[]): WorkspaceBillingSummary {
  const empty: WorkspaceBillingSummary = {
    total: 0,
    active: 0,
    trialing: 0,
    pastDue: 0,
    inactive: 0,
    mrrCents: 0,
    arpuCents: 0,
    currency: "EUR",
  };
  if (!rows.length) return empty;

  const summary: WorkspaceBillingSummary = { ...empty, total: rows.length };
  const currencyCounts = new Map<string, number>();
  for (const row of rows) {
    const status = clampMemberStatus(row.status);
    if (status === "active") {
      summary.active += 1;
      summary.mrrCents += row.amount ?? 0;
    } else if (status === "trialing") {
      summary.trialing += 1;
    } else if (status === "past_due") {
      summary.pastDue += 1;
    } else {
      summary.inactive += 1;
    }
    const currency = (row.currency || "").toUpperCase();
    if (currency) currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1);
  }

  summary.arpuCents = summary.active ? Math.round(summary.mrrCents / summary.active) : 0;
  const dominant = [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  summary.currency = dominant || "EUR";
  return summary;
}

export async function getWorkspaceBillingSummary(workspaceId?: string): Promise<WorkspaceBillingSummary> {
  if (!getSupabaseServiceEnv().ok || !isUuid(workspaceId)) return summarizeWorkspaceBilling([]);

  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_subscriptions")
    .select("status,amount,currency")
    .eq("workspace_id", workspaceId);

  return summarizeWorkspaceBilling((data ?? []) as WorkspaceBillingRow[]);
}

export type PlatformRevenueSummary = {
  activeSubscriptions: number;
  /** Gross recurring revenue members pay across all coaches (cents). */
  grossMrrCents: number;
  /** PerformLabs' recurring share via application_fee_percent (cents). */
  platformMrrCents: number;
  /** All-time platform fees actually collected, from the invoice ledger (cents). */
  feesCollectedCents: number;
  feesThisMonthCents: number;
  /** All-time gross member-payment volume processed (cents). */
  grossVolumeCents: number;
  currency: string;
};

/**
 * Platform-wide revenue read for the operator console: gross member MRR, the
 * PerformLabs 25% share, and fees actually collected from the platform_fee_events
 * ledger. Service-role only, like the rest of this module.
 */
/** Row shapes the platform revenue read aggregates. */
export type PlatformRevenueSubRow = { amount: number | null; status: string | null; application_fee_percent: number | null; currency: string | null };
export type PlatformRevenueFeeRow = { amount_total: number | null; application_fee_amount: number | null; currency: string | null; created_at: string };

/**
 * Pure aggregation behind getPlatformRevenueSummary: gross member MRR, the platform
 * share via application_fee_percent (default 25), and fees from the ledger (all-time
 * + this calendar month, UTC). `now` is injectable so the month split is deterministic
 * in tests.
 */
export function summarizePlatformRevenue(
  subs: PlatformRevenueSubRow[],
  fees: PlatformRevenueFeeRow[],
  now: Date = new Date(),
): PlatformRevenueSummary {
  const summary: PlatformRevenueSummary = {
    activeSubscriptions: 0,
    grossMrrCents: 0,
    platformMrrCents: 0,
    feesCollectedCents: 0,
    feesThisMonthCents: 0,
    grossVolumeCents: 0,
    currency: "EUR",
  };
  const currencyCounts = new Map<string, number>();
  const startOfMonth = new Date(now);
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  for (const row of subs) {
    if (clampMemberStatus(row.status) !== "active") continue;
    summary.activeSubscriptions += 1;
    const amount = row.amount ?? 0;
    summary.grossMrrCents += amount;
    summary.platformMrrCents += Math.round(amount * ((row.application_fee_percent ?? 25) / 100));
    const currency = (row.currency || "").toUpperCase();
    if (currency) currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1);
  }

  for (const row of fees) {
    summary.grossVolumeCents += row.amount_total ?? 0;
    const fee = row.application_fee_amount ?? 0;
    summary.feesCollectedCents += fee;
    if (row.created_at && new Date(row.created_at) >= startOfMonth) summary.feesThisMonthCents += fee;
    const currency = (row.currency || "").toUpperCase();
    if (currency) currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1);
  }

  const dominant = [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  summary.currency = dominant || "EUR";
  return summary;
}

export async function getPlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  if (!getSupabaseServiceEnv().ok) return summarizePlatformRevenue([], []);

  const supabase = createServiceSupabaseClient();
  const [subsRes, feesRes] = await Promise.all([
    supabase.from("member_subscriptions").select("amount,status,application_fee_percent,currency"),
    supabase.from("platform_fee_events").select("amount_total,application_fee_amount,currency,created_at"),
  ]);

  return summarizePlatformRevenue(
    (subsRes.data ?? []) as PlatformRevenueSubRow[],
    (feesRes.data ?? []) as PlatformRevenueFeeRow[],
  );
}
