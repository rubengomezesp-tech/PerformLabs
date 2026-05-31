import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CoachPlan = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  interval: string;
  stripePriceId: string | null;
  active: boolean;
  createdAt: string;
};

type PlanRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  stripe_price_id: string | null;
  active: boolean;
  created_at: string;
};

function mapPlan(row: PlanRow): CoachPlan {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    amountCents: row.amount_cents,
    currency: row.currency,
    interval: row.interval,
    stripePriceId: row.stripe_price_id,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function listCoachPlans(workspaceId: string): Promise<CoachPlan[]> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return [];
  // Table post-dates the generated database.types; cast to reach it.
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase
    .from("coach_client_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  return ((data ?? []) as PlanRow[]).map(mapPlan);
}

/** A single coach client plan by id (used to build member checkouts). */
export async function getCoachClientPlan(planId: string): Promise<CoachPlan | null> {
  if (!getSupabaseServiceEnv().ok || !planId) return null;
  // Table post-dates the generated database.types; cast to reach it.
  const supabase = createServiceSupabaseClient() as any;
  const { data } = await supabase.from("coach_client_plans").select("*").eq("id", planId).maybeSingle();
  return data ? mapPlan(data as PlanRow) : null;
}

export async function createCoachPlan(input: {
  workspaceId: string;
  name: string;
  description?: string | null;
  amountCents: number;
  currency: string;
  interval: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
}): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  const supabase = createServiceSupabaseClient() as any;
  await supabase.from("coach_client_plans").insert({
    workspace_id: input.workspaceId,
    name: input.name,
    description: input.description ?? null,
    amount_cents: input.amountCents,
    currency: input.currency,
    interval: input.interval,
    stripe_product_id: input.stripeProductId ?? null,
    stripe_price_id: input.stripePriceId ?? null,
  });
}

export async function archiveCoachPlan(workspaceId: string, planId: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  const supabase = createServiceSupabaseClient() as any;
  await supabase
    .from("coach_client_plans")
    .update({ active: false })
    .eq("workspace_id", workspaceId)
    .eq("id", planId);
}
