import { describe, expect, it } from "vitest";
import { SESSION_PACK, sessionPackCheckoutUrl } from "../mobile/src/services/session-checkout";

describe("native session checkout", () => {
  const memberId = "15bb94fe-8e86-4cf0-8e78-13d8e556c89e";

  it("binds the active ten-session offer to the member profile", () => {
    expect(SESSION_PACK).toMatchObject({ packageId: "rg_10_bundle", sessions: 10, priceUsd: 799, coachingAccessDays: 30, validityDays: 90 });
    expect(sessionPackCheckoutUrl(memberId)).toBe(
      `https://pay.rev.cat/yvcgmrwpgqphcyyq/${memberId}?package_id=rg_10_bundle`,
    );
  });

  it("rejects identifiers that cannot be assigned by the webhook", () => {
    expect(() => sessionPackCheckoutUrl("demo-user")).toThrow("INVALID_MEMBER_PROFILE_ID");
    expect(() => sessionPackCheckoutUrl(memberId, "https://example.com/checkout")).toThrow("INVALID_REVENUECAT_PURCHASE_URL");
  });
});
