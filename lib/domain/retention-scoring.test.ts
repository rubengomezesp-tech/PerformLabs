import { describe, expect, it } from "vitest";
import { scoreMemberRetention, tierFor, type RetentionSignals } from "./retention-scoring";

const healthy: RetentionSignals = {
  subscriptionStatus: "active",
  daysSinceActivity: 1,
  workoutsLast14: 5,
  lastCheckinDays: 3,
  memberAgeDays: 90,
  onboardingStatus: "completed",
};

describe("tierFor", () => {
  it.each([
    [0, "low"],
    [29, "low"],
    [30, "medium"],
    [59, "medium"],
    [60, "high"],
    [100, "high"],
  ] as const)("score %i -> %s", (score, tier) => {
    expect(tierFor(score)).toBe(tier);
  });
});

describe("scoreMemberRetention", () => {
  it("scores an engaged member as low risk with no reasons", () => {
    const r = scoreMemberRetention(healthy);
    expect(r.riskScore).toBe(0);
    expect(r.tier).toBe("low");
    expect(r.reasons).toEqual([]);
    expect(r.recommendedAction).toBe("Todo en orden, mantén el contacto.");
  });

  it("flags long inactivity as the strongest signal", () => {
    const r = scoreMemberRetention({ ...healthy, daysSinceActivity: 20 });
    expect(r.riskScore).toBeGreaterThanOrEqual(40);
    expect(r.recommendedAction).toBe("Mensaje de reactivación urgente.");
  });

  it("treats null activity like long inactivity", () => {
    const r = scoreMemberRetention({ ...healthy, daysSinceActivity: null });
    expect(r.reasons).toContain("Sin actividad reciente");
  });

  it("adds training-adherence risk only after the member's first week", () => {
    const newbie = scoreMemberRetention({ ...healthy, memberAgeDays: 3, workoutsLast14: 0 });
    const established = scoreMemberRetention({ ...healthy, memberAgeDays: 30, workoutsLast14: 0 });
    expect(newbie.riskScore).toBe(0);
    expect(established.riskScore).toBe(20);
    expect(established.reasons).toContain("0 entrenos en 2 semanas");
  });

  it("prioritises billing problems in the recommended action", () => {
    const r = scoreMemberRetention({ ...healthy, subscriptionStatus: "past_due" });
    expect(r.reasons).toContain("Pago pendiente");
    expect(r.recommendedAction).toBe("Resuelve el pago y contacta hoy.");
  });

  it("flags a never-checked-in member older than two weeks", () => {
    const r = scoreMemberRetention({ ...healthy, memberAgeDays: 30, lastCheckinDays: null });
    expect(r.reasons).toContain("Nunca ha hecho check-in");
  });

  it("flags incomplete onboarding after a week (case-insensitive)", () => {
    const pending = scoreMemberRetention({ ...healthy, memberAgeDays: 30, onboardingStatus: "pending" });
    expect(pending.reasons).toContain("Onboarding sin completar");
    const done = scoreMemberRetention({ ...healthy, memberAgeDays: 30, onboardingStatus: "Completed" });
    expect(done.reasons).not.toContain("Onboarding sin completar");
  });

  it("gives trialing members only a small nudge", () => {
    const r = scoreMemberRetention({ ...healthy, subscriptionStatus: "trialing" });
    expect(r.riskScore).toBe(5);
    expect(r.tier).toBe("low");
  });

  it("clamps the worst-case score at 100", () => {
    const r = scoreMemberRetention({
      subscriptionStatus: "past_due",
      daysSinceActivity: null,
      workoutsLast14: 0,
      lastCheckinDays: null,
      memberAgeDays: 365,
      onboardingStatus: "pending",
    });
    expect(r.riskScore).toBe(100);
    expect(r.tier).toBe("high");
  });
});
