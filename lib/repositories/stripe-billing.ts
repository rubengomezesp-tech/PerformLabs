import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type StripeAccount = {
  workspaceId: string;
  stripeUserId: string;
  livemode: boolean;
  country: string | null;
  defaultCurrency: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  connectedAt: string;
};

export type PlatformSubscription = {
  workspaceId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  priceId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type AccountRow = {
  workspace_id: string;
  stripe_user_id: string;
  livemode: boolean;
  country: string | null;
  default_currency: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  connected_at: string;
};

type SubscriptionRow = {
  workspace_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function mapAccount(row: AccountRow): StripeAccount {
  return {
    workspaceId: row.workspace_id,
    stripeUserId: row.stripe_user_id,
    livemode: row.livemode,
    country: row.country,
    defaultCurrency: row.default_currency,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    detailsSubmitted: row.details_submitted,
    connectedAt: row.connected_at,
  };
}

function mapSubscription(row: SubscriptionRow): PlatformSubscription {
  return {
    workspaceId: row.workspace_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    priceId: row.price_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

export async function getStripeAccount(workspaceId: string): Promise<StripeAccount | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return null;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase.from("stripe_accounts").select("*").eq("workspace_id", workspaceId).maybeSingle();
  return data ? mapAccount(data as AccountRow) : null;
}

export async function upsertStripeAccount(input: {
  workspaceId: string;
  stripeUserId: string;
  livemode?: boolean;
  scope?: string | null;
  country?: string | null;
  defaultCurrency?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  await supabase.from("stripe_accounts").upsert(
    {
      workspace_id: input.workspaceId,
      stripe_user_id: input.stripeUserId,
      livemode: input.livemode ?? false,
      scope: input.scope ?? null,
      country: input.country ?? null,
      default_currency: input.defaultCurrency ?? null,
      charges_enabled: input.chargesEnabled ?? false,
      payouts_enabled: input.payoutsEnabled ?? false,
      details_submitted: input.detailsSubmitted ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );
}

export async function deleteStripeAccount(workspaceId: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  await supabase.from("stripe_accounts").delete().eq("workspace_id", workspaceId);
}

export async function getPlatformSubscription(workspaceId: string): Promise<PlatformSubscription | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return null;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase.from("platform_subscriptions").select("*").eq("workspace_id", workspaceId).maybeSingle();
  return data ? mapSubscription(data as SubscriptionRow) : null;
}

export async function upsertPlatformSubscription(input: {
  workspaceId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  priceId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  await supabase.from("platform_subscriptions").upsert(
    {
      workspace_id: input.workspaceId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      price_id: input.priceId ?? null,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );
}

/** Records an event id once; returns false if it was already processed (idempotency). */
export async function recordWebhookEvent(event: { id: string; type: string; accountId?: string | null }): Promise<boolean> {
  if (!getSupabaseServiceEnv().ok) return true;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  const { error } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    account_id: event.accountId ?? null,
    processed_at: new Date().toISOString(),
  });
  // A unique-violation means we have seen this event before.
  return !error;
}

export async function findWorkspaceByStripeAccount(stripeUserId: string): Promise<string | null> {
  if (!getSupabaseServiceEnv().ok) return null;
  // These tables post-date the generated database.types; cast to reach them,
  // same pattern used elsewhere in the repo until types are regenerated.
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase.from("stripe_accounts").select("workspace_id").eq("stripe_user_id", stripeUserId).maybeSingle();
  return (data as { workspace_id: string } | null)?.workspace_id ?? null;
}
