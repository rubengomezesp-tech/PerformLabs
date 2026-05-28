import { beforeEach, describe, expect, it } from "vitest";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimitForTests,
} from "./login-rate-limit";

describe("login-rate-limit", () => {
  beforeEach(() => {
    resetLoginRateLimitForTests();
  });

  it("allows attempts until the threshold is reached", () => {
    const key = "127.0.0.1:user@example.com";
    const now = 1_000;

    expect(checkLoginRateLimit(key, now)).toMatchObject({ allowed: true, remaining: 5 });
    expect(recordFailedLogin(key, now)).toMatchObject({ allowed: true, remaining: 4 });
    expect(recordFailedLogin(key, now + 1)).toMatchObject({ allowed: true, remaining: 3 });
    expect(recordFailedLogin(key, now + 2)).toMatchObject({ allowed: true, remaining: 2 });
    expect(recordFailedLogin(key, now + 3)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("blocks repeated failed login attempts", () => {
    const key = "127.0.0.1:user@example.com";
    const now = 2_000;

    for (let index = 0; index < 4; index += 1) {
      recordFailedLogin(key, now + index);
    }

    expect(recordFailedLogin(key, now + 4)).toMatchObject({ allowed: false, remaining: 0 });
    expect(checkLoginRateLimit(key, now + 5).retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clears a successful login bucket", () => {
    const key = "127.0.0.1:user@example.com";
    const now = 3_000;

    recordFailedLogin(key, now);
    clearLoginRateLimit(key);

    expect(checkLoginRateLimit(key, now + 1)).toMatchObject({ allowed: true, remaining: 5 });
  });
});
