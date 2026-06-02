import { describe, expect, it } from "vitest";
import { clampMemberStatus, summarizePlatformRevenue, summarizeWorkspaceBilling } from "./member-subscriptions";

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

describe("summarizeWorkspaceBilling", () => {
  it("returns an all-zero EUR summary for no rows", () => {
    expect(summarizeWorkspaceBilling([])).toMatchObject({ total: 0, active: 0, mrrCents: 0, arpuCents: 0, currency: "EUR" });
  });

  it("counts by clamped status, sums only active MRR and derives ARPU", () => {
    const s = summarizeWorkspaceBilling([
      { status: "active", amount: 3000, currency: "eur" },
      { status: "active", amount: 5000, currency: "EUR" },
      { status: "trialing", amount: 9999, currency: "EUR" }, // not counted toward MRR
      { status: "past_due", amount: 1000, currency: "EUR" },
      { status: "canceled", amount: 4000, currency: "EUR" }, // clamps to inactive
    ]);
    expect(s.total).toBe(5);
    expect(s.active).toBe(2);
    expect(s.trialing).toBe(1);
    expect(s.pastDue).toBe(1);
    expect(s.inactive).toBe(1);
    expect(s.mrrCents).toBe(8000);
    expect(s.arpuCents).toBe(4000); // 8000 / 2 active
    expect(s.currency).toBe("EUR");
  });

  it("picks the dominant currency across rows", () => {
    const s = summarizeWorkspaceBilling([
      { status: "active", amount: 100, currency: "usd" },
      { status: "active", amount: 100, currency: "USD" },
      { status: "active", amount: 100, currency: "EUR" },
    ]);
    expect(s.currency).toBe("USD");
  });
});

describe("summarizePlatformRevenue", () => {
  it("sums gross MRR and the platform share via application_fee_percent (default 25)", () => {
    const s = summarizePlatformRevenue(
      [
        { amount: 10000, status: "active", application_fee_percent: 25, currency: "EUR" },
        { amount: 8000, status: "active", application_fee_percent: null, currency: "EUR" }, // defaults to 25%
        { amount: 5000, status: "canceled", application_fee_percent: 25, currency: "EUR" }, // excluded
      ],
      [],
    );
    expect(s.activeSubscriptions).toBe(2);
    expect(s.grossMrrCents).toBe(18000);
    expect(s.platformMrrCents).toBe(4500); // 2500 + 2000
  });

  it("splits ledger fees into all-time and this-month using the injected now", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    const s = summarizePlatformRevenue(
      [],
      [
        { amount_total: 10000, application_fee_amount: 2500, currency: "EUR", created_at: "2026-06-02T00:00:00.000Z" },
        { amount_total: 8000, application_fee_amount: 2000, currency: "EUR", created_at: "2026-05-20T00:00:00.000Z" }, // last month
      ],
      now,
    );
    expect(s.grossVolumeCents).toBe(18000);
    expect(s.feesCollectedCents).toBe(4500);
    expect(s.feesThisMonthCents).toBe(2500); // only the June fee
  });
});
