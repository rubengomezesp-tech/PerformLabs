import { describe, expect, it } from "vitest";
import { isRevenueCatWebhookAuthorized } from "./route";

describe("RevenueCat webhook authorization", () => {
  it("accepts the configured value or a Bearer token", () => {
    expect(isRevenueCatWebhookAuthorized("secret-value", "secret-value")).toBe(true);
    expect(isRevenueCatWebhookAuthorized("Bearer secret-value", "secret-value")).toBe(true);
  });

  it("rejects missing and mismatched values", () => {
    expect(isRevenueCatWebhookAuthorized(null, "secret-value")).toBe(false);
    expect(isRevenueCatWebhookAuthorized("Bearer wrong", "secret-value")).toBe(false);
  });
});
