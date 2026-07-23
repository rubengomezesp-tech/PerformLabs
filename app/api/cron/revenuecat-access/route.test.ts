import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/revenuecat-purchases", () => ({
  reconcileExpiredRevenueCatAccess: vi.fn(async () => ({ expired: 2, members: 1 })),
  reconcilePendingRevenueCatPurchases: vi.fn(async () => ({ checked: 3, assigned: 1, unmatched: 2, failed: 0 })),
}));

vi.mock("@/lib/automations/revenuecat-purchase-communications", () => ({
  runRevenueCatPurchaseCommunications: vi.fn(async () => ({ ok: true, configured: true, claimed: 2, sent: 2, failed: 0 })),
}));

describe("RevenueCat access cron", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
    vi.resetModules();
  });

  it("stays closed when no cron secret exists", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/cron/revenuecat-access"));
    expect(response.status).toBe(503);
  });

  it("rejects an invalid bearer token", async () => {
    process.env.CRON_SECRET = "correct";
    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/cron/revenuecat-access", {
      headers: { authorization: "Bearer wrong" },
    }));
    expect(response.status).toBe(401);
  });

  it("reconciles access only with the valid cron token", async () => {
    process.env.CRON_SECRET = "correct";
    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/cron/revenuecat-access", {
      headers: { authorization: "Bearer correct" },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      access: { expired: 2, members: 1 },
      purchases: { checked: 3, assigned: 1, unmatched: 2, failed: 0 },
      communications: { ok: true, configured: true, claimed: 2, sent: 2, failed: 0 },
    });
  });
});
