import { describe, expect, it } from "vitest";
import { clampMemberStatus } from "./member-subscriptions";

describe("clampMemberStatus", () => {
  it("passes through the valid member_profiles enum values (case-insensitive)", () => {
    for (const status of ["trialing", "active", "past_due", "paused", "cancelled", "expired"] as const) {
      expect(clampMemberStatus(status)).toBe(status);
      expect(clampMemberStatus(status.toUpperCase())).toBe(status);
    }
  });

  it("maps Stripe statuses that aren't 1:1 with our enum", () => {
    expect(clampMemberStatus("canceled")).toBe("cancelled");
    expect(clampMemberStatus("incomplete")).toBe("past_due");
    expect(clampMemberStatus("unpaid")).toBe("expired");
    expect(clampMemberStatus("incomplete_expired")).toBe("expired");
  });

  it("defaults unknown / empty / null to a non-entitling status", () => {
    expect(clampMemberStatus("")).toBe("expired");
    expect(clampMemberStatus(null)).toBe("expired");
    expect(clampMemberStatus(undefined)).toBe("expired");
    expect(clampMemberStatus("something_new_from_stripe")).toBe("expired");
  });

  // The /app gate only lets {active, trialing} in. A non-paying or unknown status
  // must NEVER clamp to one of those, or a member without a cleared payment slips in.
  it("never grants an entitling status to a non-paying/unknown input", () => {
    const nonPaying = ["canceled", "cancelled", "unpaid", "incomplete", "incomplete_expired", "past_due", "paused", "expired", "", "garbage"];
    for (const status of nonPaying) {
      expect(["active", "trialing"]).not.toContain(clampMemberStatus(status));
    }
  });
});
