import { describe, expect, it } from "vitest";
import {
  BLOCK_MS,
  evaluateRateLimit,
  MAX_ATTEMPTS,
  registerFailure,
  WINDOW_MS,
  type AttemptState,
} from "./login-rate-limit-policy";

describe("login-rate-limit-policy", () => {
  it("allows with full remaining when there is no prior state", () => {
    expect(evaluateRateLimit(null, 1000)).toEqual({ allowed: true, remaining: 5, retryAfterSeconds: 0 });
  });

  it("decrements remaining as failures accrue within the window", () => {
    let state: AttemptState | null = null;
    const now = 1000;
    state = registerFailure(state, now);
    expect(evaluateRateLimit(state, now)).toMatchObject({ allowed: true, remaining: 4 });
    state = registerFailure(state, now + 1);
    state = registerFailure(state, now + 2);
    state = registerFailure(state, now + 3);
    expect(evaluateRateLimit(state, now + 3)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("blocks once the threshold is reached", () => {
    let state: AttemptState | null = null;
    const now = 2000;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) state = registerFailure(state, now + i);
    const result = evaluateRateLimit(state, now + MAX_ATTEMPTS);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps the block until it expires, then allows a fresh window", () => {
    let state: AttemptState | null = null;
    const now = 3000;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) state = registerFailure(state, now + i);
    expect(evaluateRateLimit(state, now + BLOCK_MS - 1).allowed).toBe(false);
    expect(evaluateRateLimit(state, now + BLOCK_MS + WINDOW_MS + 1)).toMatchObject({ allowed: true, remaining: 5 });
  });

  it("resets the counter when the window has expired", () => {
    const stale: AttemptState = { attempts: 4, windowStartedAt: 0, blockedUntil: 0 };
    const next = registerFailure(stale, WINDOW_MS + 1);
    expect(next.attempts).toBe(1);
    expect(evaluateRateLimit(next, WINDOW_MS + 1)).toMatchObject({ allowed: true, remaining: 4 });
  });
});
