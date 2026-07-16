import { afterEach, describe, expect, it, vi } from "vitest";
import type { RevenueCatPurchaseDelivery } from "@/lib/repositories/revenuecat-purchases";

const repository = vi.hoisted(() => ({
  claimRevenueCatPurchaseDeliveries: vi.fn(),
  markRevenueCatPurchaseDelivery: vi.fn(),
}));

vi.mock("@/lib/repositories/revenuecat-purchases", () => repository);

import {
  buildCoachPurchaseMessage,
  buildCustomerPurchaseMessage,
  runRevenueCatPurchaseCommunications,
} from "./revenuecat-purchase-communications";

function delivery(audience: "customer" | "coach" = "customer"): RevenueCatPurchaseDelivery {
  return {
    id: `delivery_${audience}`,
    workspaceId: "10000000-0000-4000-8000-000000000001",
    eventId: "evt_purchase",
    memberProfileId: null,
    audience,
    deliveryType: audience === "customer" ? "purchase_confirmation" : "coach_purchase_alert",
    recipientEmail: audience === "customer" ? "client@example.com" : "rubengomezesp@gmail.com",
    attemptCount: 1,
    payload: {
      productLabel: "RG 10",
      priceCents: 79_900,
      currency: "USD",
      sessions: 10,
      sessionUnitPriceCents: 6_000,
      trainingSubtotalCents: 60_000,
      coachingSubtotalCents: 19_900,
      sessionValidityDays: 90,
      transactionId: "txn_rg_10",
      customerEmail: "client@example.com",
      processingStatus: "pending_assignment",
      termsUrl: "https://rubengomezcoaching.com/terminos-compra",
    },
  };
}

describe("RG purchase communications", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete process.env.RG_COACH_RESEND_API_KEY;
    delete process.env.RG_COACH_RESEND_FROM;
  });

  it("explains the one-payment RG 10 breakdown to the customer", () => {
    const message = buildCustomerPurchaseMessage(delivery());
    expect(message.subject).toContain("Compra confirmada");
    expect(message.text).toContain("$799");
    expect(message.html).toContain("10 × $60 = $600");
    expect(message.html).toContain("$199");
    expect(message.html).toContain("un solo pago");
    expect(message.text).toContain("terminos-compra");
  });

  it("marks the coach alert as important and actionable", () => {
    const message = buildCoachPurchaseMessage(delivery("coach"));
    expect(message.subject).toBe("IMPORTANTE · PAGO CONFIRMADO · RG 10 · $799");
    expect(message.text).toContain("REQUIERE VINCULAR CLIENTE");
    expect(message.text).toContain("/coach/purchases");
  });

  it("does not claim deliveries until the isolated Resend account is configured", async () => {
    await expect(runRevenueCatPurchaseCommunications()).resolves.toEqual({
      ok: false,
      configured: false,
      claimed: 0,
      sent: 0,
      failed: 0,
    });
    expect(repository.claimRevenueCatPurchaseDeliveries).not.toHaveBeenCalled();
  });

  it("sends a claimed delivery once and records the provider id", async () => {
    process.env.RG_COACH_RESEND_API_KEY = "re_test";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <test@example.com>";
    repository.claimRevenueCatPurchaseDeliveries.mockResolvedValue([delivery()]);
    repository.markRevenueCatPurchaseDelivery.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "email_1" }), { status: 200 })));

    await expect(runRevenueCatPurchaseCommunications()).resolves.toEqual({
      ok: true,
      configured: true,
      claimed: 1,
      sent: 1,
      failed: 0,
    });
    expect(repository.markRevenueCatPurchaseDelivery).toHaveBeenCalledWith(expect.objectContaining({
      id: "delivery_customer",
      status: "sent",
      providerMessageId: "email_1",
    }));
  });

  it("records a failed provider attempt for controlled retry", async () => {
    process.env.RG_COACH_RESEND_API_KEY = "re_test";
    process.env.RG_COACH_RESEND_FROM = "RG Coach <test@example.com>";
    repository.claimRevenueCatPurchaseDeliveries.mockResolvedValue([delivery("coach")]);
    repository.markRevenueCatPurchaseDelivery.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));

    await expect(runRevenueCatPurchaseCommunications()).resolves.toMatchObject({ ok: false, claimed: 1, sent: 0, failed: 1 });
    expect(repository.markRevenueCatPurchaseDelivery).toHaveBeenCalledWith(expect.objectContaining({
      id: "delivery_coach",
      status: "failed",
      error: "provider_429",
      attemptCount: 1,
    }));
  });
});
