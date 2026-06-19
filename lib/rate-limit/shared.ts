import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * Generic sliding-window rate limiter backed by Supabase (`consume_rate_limit`
 * RPC), shared across all serverless instances. Degrades to a per-instance
 * in-memory counter when the store is unconfigured or errors — so it never
 * throws and never hard-locks the app, while the migration rolls out.
 */
const fallback = new Map<string, { count: number; resetAt: number }>();

function fallbackConsume(bucket: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  // Evict expired buckets so the Map can't grow unbounded on a warm instance.
  if (fallback.size > 5_000) {
    for (const [k, v] of fallback) {
      if (now >= v.resetAt) fallback.delete(k);
    }
  }
  const entry = fallback.get(bucket);
  if (!entry || now >= entry.resetAt) {
    fallback.set(bucket, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

/** Returns true if the request is allowed, false if it should be throttled. */
export async function consumeRateLimit(
  bucket: string,
  opts: { windowMs: number; max: number },
): Promise<boolean> {
  if (!getSupabaseServiceEnv().ok) return fallbackConsume(bucket, opts.windowMs, opts.max);
  try {
    const supabase = createServiceSupabaseClient();
    // `consume_rate_limit` ships in the same PR (migration
    // 20260619153000_shared_rate_limit_counters.sql). database.types.ts is
    // regenerated on deploy, so until the migration lands the RPC name isn't in
    // the generated union — narrowly type this single call rather than weaken
    // the whole client.
    const callRpc = supabase.rpc as unknown as (
      fn: string,
      args: { p_bucket: string; p_window_ms: number; p_max: number },
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
    const { data, error } = await callRpc("consume_rate_limit", {
      p_bucket: bucket,
      p_window_ms: opts.windowMs,
      p_max: opts.max,
    });
    if (error) throw new Error(error.message);
    return data === true;
  } catch (error) {
    console.error("shared rate-limit failed; using in-memory fallback", (error as Error).message);
    return fallbackConsume(bucket, opts.windowMs, opts.max);
  }
}
