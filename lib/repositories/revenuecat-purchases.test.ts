import { describe, expect, it } from "vitest";
import type { Json } from "@/lib/supabase/database.types";
import { purchaseEmailFromPayload } from "./revenuecat-purchases";

describe("RevenueCat purchase parsing", () => {
  it("normalizes the protected RevenueCat email attribute", () => {
    const payload = {
      event: {
        subscriber_attributes: {
          $email: { value: "  CLIENTE@Example.COM " },
        },
      },
    } as Json;
    expect(purchaseEmailFromPayload(payload)).toBe("cliente@example.com");
  });

  it("does not treat malformed metadata as a customer identity", () => {
    expect(purchaseEmailFromPayload({ event: { subscriber_attributes: { $email: "attacker" } } })).toBeNull();
    expect(purchaseEmailFromPayload(null)).toBeNull();
  });
});
