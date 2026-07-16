import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionCredits = vi.hoisted(() => ({
  getSessionCreditProduct: vi.fn(),
  getRevenueCatWebhookEventStatus: vi.fn(),
  recordRevenueCatSessionPurchase: vi.fn(),
  recordRevenueCatWebhookEvent: vi.fn(),
  refundRevenueCatSessionPurchase: vi.fn(),
  resolveRevenueCatMemberId: vi.fn(),
  resolveRevenueCatWorkspaceId: vi.fn(),
  revenueCatCustomerEmail: vi.fn(),
}));

const purchases = vi.hoisted(() => ({
  linkRevenueCatCustomer: vi.fn(),
  recordRevenueCatCoachingAccess: vi.fn(),
  updateRevenueCatCoachingAccess: vi.fn(),
}));

const subscriptions = vi.hoisted(() => ({
  setMemberSubscriptionStatus: vi.fn(),
}));

vi.mock("@/lib/repositories/session-credits", () => sessionCredits);
vi.mock("@/lib/repositories/revenuecat-purchases", () => purchases);
vi.mock("@/lib/repositories/member-subscriptions", () => subscriptions);

const workspaceId = "10000000-0000-4000-8000-000000000001";
const memberId = "20000000-0000-4000-8000-000000000002";
const purchasedAtMs = Date.UTC(2026, 6, 16, 12);

function payload(overrides: Record<string, unknown> = {}) {
  return {
    api_version: "1.0",
    event: {
      id: "evt_qa_1",
      type: "NON_RENEWING_PURCHASE",
      app_id: "app_qa",
      app_user_id: "web_qa_customer",
      product_id: "rg_10_bundle_usd_799",
      transaction_id: "txn_qa_1",
      environment: "PRODUCTION",
      purchased_at_ms: purchasedAtMs,
      event_timestamp_ms: purchasedAtMs,
      subscriber_attributes: { $email: { value: "qa@example.com" } },
      ...overrides,
    },
  };
}

async function post(body = payload(), authorization = "Bearer qa-secret") {
  const { POST } = await import("./route");
  return POST(new Request("https://example.test/api/revenuecat/webhook", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("RevenueCat webhook purchase lifecycle", () => {
  beforeEach(() => {
    process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN = "qa-secret";
    process.env.REVENUECAT_APP_ID = "app_qa";
    process.env.REVENUECAT_ACCEPT_SANDBOX = "false";
    sessionCredits.resolveRevenueCatWorkspaceId.mockResolvedValue(workspaceId);
    sessionCredits.getRevenueCatWebhookEventStatus.mockResolvedValue(null);
    sessionCredits.resolveRevenueCatMemberId.mockResolvedValue(null);
    sessionCredits.revenueCatCustomerEmail.mockReturnValue("qa@example.com");
    sessionCredits.getSessionCreditProduct.mockReturnValue({ sessions: 10, validityDays: 90, grantEvents: ["NON_RENEWING_PURCHASE"] });
    sessionCredits.recordRevenueCatSessionPurchase.mockResolvedValue({ packId: "pack_1", created: true, assigned: false });
    sessionCredits.recordRevenueCatWebhookEvent.mockResolvedValue(undefined);
    sessionCredits.refundRevenueCatSessionPurchase.mockResolvedValue(true);
    purchases.linkRevenueCatCustomer.mockResolvedValue(undefined);
    purchases.recordRevenueCatCoachingAccess.mockResolvedValue(undefined);
    purchases.updateRevenueCatCoachingAccess.mockResolvedValue(1);
    subscriptions.setMemberSubscriptionStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
    delete process.env.REVENUECAT_APP_ID;
    delete process.env.REVENUECAT_ACCEPT_SANDBOX;
  });

  it("records an unidentified RG 10 purchase for manual assignment", async () => {
    const response = await post();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ received: true, status: "pending_assignment" });
    expect(sessionCredits.recordRevenueCatSessionPurchase).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId,
      memberProfileId: null,
      productIdentifier: "rg_10_bundle_usd_799",
      transactionId: "txn_qa_1",
      customerEmail: "qa@example.com",
    }));
    expect(purchases.recordRevenueCatCoachingAccess).toHaveBeenCalledWith(expect.objectContaining({
      memberProfileId: null,
      endsAt: "2026-08-15T12:00:00.000Z",
    }));
    expect(sessionCredits.recordRevenueCatWebhookEvent).toHaveBeenLastCalledWith(expect.objectContaining({
      processingStatus: "pending_assignment",
    }));
  });

  it("links and activates an identified RG 20 renewal", async () => {
    sessionCredits.resolveRevenueCatMemberId.mockResolvedValue(memberId);
    sessionCredits.getSessionCreditProduct.mockReturnValue({ sessions: 20, validityDays: 35, grantEvents: ["INITIAL_PURCHASE", "RENEWAL"] });
    sessionCredits.recordRevenueCatSessionPurchase.mockResolvedValue({ packId: "pack_20", created: true, assigned: true });
    const expirationAtMs = purchasedAtMs + 35 * 86_400_000;

    const response = await post(payload({
      type: "RENEWAL",
      product_id: "rg_20_monthly_usd_1399",
      transaction_id: "txn_qa_renewal",
      original_transaction_id: "txn_qa_original",
      expiration_at_ms: expirationAtMs,
    }));

    await expect(response.json()).resolves.toMatchObject({ status: "processed" });
    expect(purchases.linkRevenueCatCustomer).toHaveBeenCalledWith(expect.objectContaining({ memberProfileId: memberId }));
    expect(purchases.recordRevenueCatCoachingAccess).toHaveBeenCalledWith(expect.objectContaining({
      memberProfileId: memberId,
      transactionId: "txn_qa_renewal",
      endsAt: new Date(expirationAtMs).toISOString(),
    }));
    expect(subscriptions.setMemberSubscriptionStatus).toHaveBeenCalledWith(memberId, "active");
  });

  it("stops an already processed retry before granting anything again", async () => {
    sessionCredits.getRevenueCatWebhookEventStatus.mockResolvedValue("processed");

    const response = await post();

    await expect(response.json()).resolves.toEqual({ received: true, status: "processed", duplicate: true });
    expect(sessionCredits.resolveRevenueCatMemberId).not.toHaveBeenCalled();
    expect(sessionCredits.recordRevenueCatSessionPurchase).not.toHaveBeenCalled();
    expect(purchases.recordRevenueCatCoachingAccess).not.toHaveBeenCalled();
  });

  it("marks an identified member past due on a billing issue", async () => {
    sessionCredits.resolveRevenueCatMemberId.mockResolvedValue(memberId);
    sessionCredits.getSessionCreditProduct.mockReturnValue(null);

    const response = await post(payload({
      type: "BILLING_ISSUE",
      product_id: "rg_360_monthly_usd_199",
      transaction_id: "txn_qa_billing",
    }));

    await expect(response.json()).resolves.toMatchObject({ status: "processed" });
    expect(purchases.updateRevenueCatCoachingAccess).toHaveBeenCalledWith(expect.objectContaining({ status: "past_due" }));
    expect(subscriptions.setMemberSubscriptionStatus).toHaveBeenCalledWith(memberId, "past_due");
  });

  it("refunds RG 10 credits and access on cancellation", async () => {
    const response = await post(payload({ type: "CANCELLATION" }));

    await expect(response.json()).resolves.toMatchObject({ status: "processed" });
    expect(sessionCredits.refundRevenueCatSessionPurchase).toHaveBeenCalledWith(expect.objectContaining({ transactionId: "txn_qa_1" }));
    expect(purchases.updateRevenueCatCoachingAccess).toHaveBeenCalledWith(expect.objectContaining({ status: "refunded" }));
  });

  it("records sandbox events as ignored when sandbox processing is disabled", async () => {
    const response = await post(payload({ environment: "SANDBOX" }));

    await expect(response.json()).resolves.toEqual({ received: true, ignored: "sandbox" });
    expect(sessionCredits.recordRevenueCatSessionPurchase).not.toHaveBeenCalled();
    expect(sessionCredits.recordRevenueCatWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({ processingStatus: "ignored" }));
  });
});
