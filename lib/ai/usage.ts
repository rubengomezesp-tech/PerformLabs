import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type AiFeature = "coach_brain" | "plan_gen" | "photo";

/** Raw usage block as returned by the Anthropic SDK on a message response. */
export type AiTokenUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

/** USD per 1M tokens. cacheRead ≈ 0.1× input, cacheWrite ≈ 1.25× input. */
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

const FALLBACK_PRICING = PRICING["claude-sonnet-4-6"];

/**
 * Monthly per-workspace quotas. Generous defaults that comfortably cover a busy
 * coach while capping runaway usage so we never lose money on the AI. Tunable
 * per plan tier later; overridable via env for testing.
 */
export const AI_MONTHLY_LIMITS: Record<AiFeature, number> = {
  coach_brain: Number(process.env.AI_LIMIT_COACH_BRAIN ?? 4000),
  plan_gen: Number(process.env.AI_LIMIT_PLAN_GEN ?? 150),
  photo: Number(process.env.AI_LIMIT_PHOTO ?? 1500),
};

export function estimateCostUsd(model: string, usage: AiTokenUsage): number {
  const p = PRICING[model] ?? FALLBACK_PRICING;
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  return (
    (input * p.input + output * p.output + cacheRead * p.cacheRead + cacheWrite * p.cacheWrite) /
    1_000_000
  );
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Best-effort: logs a Claude call's tokens + cost. Never throws. */
export async function recordAiUsage(input: {
  workspaceId: string;
  feature: AiFeature;
  model: string;
  usage: AiTokenUsage;
  memberProfileId?: string | null;
}): Promise<void> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(input.workspaceId)) return;

  try {
    const supabase = createServiceSupabaseClient();
    await supabase.from("ai_usage_events").insert({
      workspace_id: input.workspaceId,
      feature: input.feature,
      model: input.model,
      input_tokens: input.usage.input_tokens ?? 0,
      output_tokens: input.usage.output_tokens ?? 0,
      cache_read_tokens: input.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: input.usage.cache_creation_input_tokens ?? 0,
      cost_usd: Number(estimateCostUsd(input.model, input.usage).toFixed(6)),
      member_profile_id: isUuid(input.memberProfileId) ? input.memberProfileId : null,
    });
  } catch (error) {
    console.error("Unable to record AI usage", error instanceof Error ? error.message : error);
  }
}

export type MonthlyAiUsage = {
  coachBrain: number;
  planGen: number;
  photo: number;
  costUsd: number;
};

export async function getMonthlyAiUsage(workspaceId?: string): Promise<MonthlyAiUsage> {
  const empty: MonthlyAiUsage = { coachBrain: 0, planGen: 0, photo: 0, costUsd: 0 };
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("feature,cost_usd")
    .eq("workspace_id", workspaceId)
    .gte("created_at", startOfMonthIso())
    .limit(20000);

  if (error || !data) return empty;

  const result = { ...empty };
  for (const row of data as Array<{ feature: AiFeature; cost_usd: number | string }>) {
    if (row.feature === "coach_brain") result.coachBrain += 1;
    else if (row.feature === "plan_gen") result.planGen += 1;
    else if (row.feature === "photo") result.photo += 1;
    result.costUsd += Number(row.cost_usd) || 0;
  }
  result.costUsd = Number(result.costUsd.toFixed(4));
  return result;
}

export type QuotaCheck = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

/** Returns whether a feature is still within its monthly quota. */
export async function checkAiQuota(workspaceId: string | undefined, feature: AiFeature): Promise<QuotaCheck> {
  const limit = AI_MONTHLY_LIMITS[feature];
  const env = getSupabaseServiceEnv();
  // Don't block when we can't measure (e.g. local/no DB).
  if (!env.ok || !isUuid(workspaceId)) return { allowed: true, used: 0, limit, remaining: limit };

  const usage = await getMonthlyAiUsage(workspaceId);
  const used = feature === "coach_brain" ? usage.coachBrain : feature === "plan_gen" ? usage.planGen : usage.photo;
  const remaining = Math.max(0, limit - used);
  return { allowed: used < limit, used, limit, remaining };
}
