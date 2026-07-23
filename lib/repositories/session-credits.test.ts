import { describe, expect, it } from "vitest";
import {
  getSessionCreditProduct,
  revenueCatCustomerEmail,
  sessionPackExpiry,
} from "./session-credits";

describe("session credit products", () => {
  it("maps current and historical one-time RevenueCat products to their sessions", () => {
    expect(getSessionCreditProduct("rg_10_bundle_usd_799")).toMatchObject({ sessions: 10, validityDays: 90, grantEvents: ["NON_RENEWING_PURCHASE"] });
    expect(getSessionCreditProduct("rg_20_monthly_usd_1399")).toMatchObject({ sessions: 20, validityDays: 35, grantEvents: ["INITIAL_PURCHASE", "RENEWAL"] });
    expect(getSessionCreditProduct("rg_session_single_usd_70")).toMatchObject({ sessions: 1, validityDays: 30 });
    expect(getSessionCreditProduct("rg_pack_8_usd_440")).toMatchObject({ sessions: 8, validityDays: 90 });
    expect(getSessionCreditProduct("rg_pack_8_usd_480")).toMatchObject({ sessions: 8, validityDays: 90 });
    expect(getSessionCreditProduct("rg_pack_10_usd_600")).toMatchObject({ sessions: 10, validityDays: 90 });
    expect(getSessionCreditProduct("rg_pack_12_usd_600")).toMatchObject({ sessions: 12, validityDays: 90 });
    expect(getSessionCreditProduct("rg_starter_monthly_usd_149")).toBeNull();
  });

  it("calculates a deterministic validity date", () => {
    expect(sessionPackExpiry(Date.UTC(2026, 6, 15), 30)).toBe("2026-08-14T00:00:00.000Z");
  });

  it("extracts the normalized RevenueCat email attribute", () => {
    expect(revenueCatCustomerEmail({ $email: { value: " Client@Example.com " } })).toBe("client@example.com");
    expect(revenueCatCustomerEmail({})).toBeNull();
  });
});
