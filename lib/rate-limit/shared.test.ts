import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseServiceEnv: () => ({
    ok: true as const,
    url: "https://example.supabase.co",
    serviceRoleKey: "service-role-test",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabaseClient: () => ({ rpc: mocks.rpc }),
}));

import { consumeRateLimit } from "./shared";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the atomic shared RPC when it is available", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await expect(consumeRateLimit("lead:hmac", { windowMs: 60_000, max: 4, failClosed: true }))
      .resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_bucket: "lead:hmac",
      p_window_ms: 60_000,
      p_max: 4,
    });
  });

  it("fails closed for a protected public route when the shared store rejects the call", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "permission denied" } });

    await expect(consumeRateLimit("lead:strict", { windowMs: 60_000, max: 4, failClosed: true }))
      .resolves.toBe(false);
  });

  it("keeps the original in-memory degradation for non-public callers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpc.mockRejectedValue(new Error("store unavailable"));

    await expect(consumeRateLimit("coach-ai:fallback-test", { windowMs: 60_000, max: 1 }))
      .resolves.toBe(true);
    await expect(consumeRateLimit("coach-ai:fallback-test", { windowMs: 60_000, max: 1 }))
      .resolves.toBe(false);
  });
});
