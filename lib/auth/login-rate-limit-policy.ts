// Pure decision logic for the login rate limiter, kept storage-agnostic so it can
// be unit-tested without a database. The storage layer (login-rate-limit.ts) reads
// the persisted state, applies these functions, and writes the result back.

export type LoginRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type AttemptState = {
  attempts: number;
  /** Epoch ms the current counting window opened. */
  windowStartedAt: number;
  /** Epoch ms the block lifts, or 0 when not blocked. */
  blockedUntil: number;
};

export const WINDOW_MS = 15 * 60 * 1000;
export const BLOCK_MS = 15 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

function windowExpired(state: AttemptState, now: number): boolean {
  return now - state.windowStartedAt >= WINDOW_MS;
}

/** Read-only check: may this key attempt a login right now? */
export function evaluateRateLimit(state: AttemptState | null, now: number): LoginRateLimitResult {
  if (state && state.blockedUntil > now) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((state.blockedUntil - now) / 1000) };
  }
  const count = !state || windowExpired(state, now) ? 0 : state.attempts;
  return { allowed: true, remaining: Math.max(0, MAX_ATTEMPTS - count), retryAfterSeconds: 0 };
}

/** The next persisted state after one failed attempt (resets an expired window). */
export function registerFailure(state: AttemptState | null, now: number): AttemptState {
  const fresh = !state || windowExpired(state, now);
  const attempts = (fresh ? 0 : state.attempts) + 1;
  const windowStartedAt = fresh ? now : state.windowStartedAt;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? now + BLOCK_MS : (fresh ? 0 : state.blockedUntil);
  return { attempts, windowStartedAt, blockedUntil };
}
