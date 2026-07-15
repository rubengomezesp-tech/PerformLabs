import { describe, expect, it } from "vitest";
import {
  getSessionCreditProduct,
  revenueCatCustomerEmail,
  sessionPackExpiry,
} from "./session-credits";

describe("session credit products", () => {
  it("maps every live one-time RevenueCat product to its sessions", () => {
    expect(getSessionCreditProduct("rg_session_single_usd_70")).toEqual({ sessions: 1, validityDays: 30 });
    expect(getSessionCreditProduct("rg_pack_8_usd_440")).toEqual({ sessions: 8, validityDays: 90 });
    expect(getSessionCreditProduct("rg_pack_12_usd_600")).toEqual({ sessions: 12, validityDays: 90 });
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
