import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  evaluateRateLimit,
  MAX_ATTEMPTS,
  registerFailure,
  type AttemptState,
  type LoginRateLimitResult,
} from "@/lib/auth/login-rate-limit-policy";

export type { LoginRateLimitResult };

// Shared (Supabase-backed) login rate limiter. Every operation FAILS OPEN: if the
// store is unconfigured or errors, we allow the attempt rather than risk locking a
// legitimate operator out. The worst case on an outage is the previous behaviour
// (no cross-instance limiting), never a lockout.
const ALLOW: LoginRateLimitResult = { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };

type Row = { attempts: number | null; window_started_at: string | null; blocked_until: string | null };

function rowToState(row: Row | null): AttemptState | null {
  if (!row) return null;
  return {
    attempts: row.attempts ?? 0,
    windowStartedAt: row.window_started_at ? Date.parse(row.window_started_at) : 0,
    blockedUntil: row.blocked_until ? Date.parse(row.blocked_until) : 0,
  };
}

async function readState(key: string): Promise<AttemptState | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("auth_rate_limits")
    .select("attempts,window_started_at,blocked_until")
    .eq("key", key)
    .maybeSingle();
  return rowToState(data);
}

export async function checkLoginRateLimit(key: string, now = Date.now()): Promise<LoginRateLimitResult> {
  if (!getSupabaseServiceEnv().ok) return ALLOW;
  try {
    return evaluateRateLimit(await readState(key), now);
  } catch (error) {
    console.error("login rate-limit check failed; allowing", (error as Error).message);
    return ALLOW;
  }
}

export async function recordFailedLogin(key: string, now = Date.now()): Promise<LoginRateLimitResult> {
  if (!getSupabaseServiceEnv().ok) return ALLOW;
  try {
    const supabase = createServiceSupabaseClient();
    const next = registerFailure(await readState(key), now);
    await supabase.from("auth_rate_limits").upsert(
      {
        key,
        attempts: next.attempts,
        window_started_at: new Date(next.windowStartedAt).toISOString(),
        blocked_until: next.blockedUntil ? new Date(next.blockedUntil).toISOString() : null,
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: "key" },
    );
    return evaluateRateLimit(next, now);
  } catch (error) {
    console.error("login rate-limit record failed; allowing", (error as Error).message);
    return ALLOW;
  }
}

export async function clearLoginRateLimit(key: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok) return;
  try {
    const supabase = createServiceSupabaseClient();
    await supabase.from("auth_rate_limits").delete().eq("key", key);
  } catch (error) {
    console.error("login rate-limit clear failed", (error as Error).message);
  }
}
