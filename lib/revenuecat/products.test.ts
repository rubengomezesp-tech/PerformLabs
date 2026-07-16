import { describe, expect, it } from "vitest";
import {
  getRevenueCatProduct,
  isRevenueCatPurchaseEvent,
  revenueCatAccessEnd,
} from "./products";

describe("RG RevenueCat product contract", () => {
  it("keeps public price and credit math exact", () => {
    expect(getRevenueCatProduct("rg_10_bundle_usd_799")).toMatchObject({ priceCents: 79_900, sessions: 10, coachingAccessDays: 30 });
    expect(getRevenueCatProduct("rg_20_monthly_usd_1399")).toMatchObject({ priceCents: 139_900, sessions: 20, purchaseType: "subscription" });
    expect(getRevenueCatProduct("rg_360_monthly_usd_199")).toMatchObject({ priceCents: 19_900, sessions: 0, purchaseType: "subscription" });
  });

  it("grants monthly credits only on the initial purchase and each renewal", () => {
    expect(isRevenueCatPurchaseEvent("rg_20_monthly_usd_1399", "INITIAL_PURCHASE")).toBe(true);
    expect(isRevenueCatPurchaseEvent("rg_20_monthly_usd_1399", "RENEWAL")).toBe(true);
    expect(isRevenueCatPurchaseEvent("rg_20_monthly_usd_1399", "CANCELLATION")).toBe(false);
  });

  it("calculates RG 10 access without creating a permanent entitlement", () => {
    expect(revenueCatAccessEnd({
      productId: "rg_10_bundle_usd_799",
      purchasedAtMs: Date.UTC(2026, 6, 16),
    })).toBe("2026-08-15T00:00:00.000Z");
  });
});
