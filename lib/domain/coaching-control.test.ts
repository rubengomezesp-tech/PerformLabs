import { describe, expect, it } from "vitest";
import {
  ageFromBirthDate,
  buildCoachingSignals,
  normalizeCoachingGoal,
  parseAdherence,
} from "./coaching-control";

describe("coaching control signals", () => {
  const now = new Date("2026-07-15T12:00:00.000Z").getTime();

  it("builds a high-confidence 14-day weight trend", () => {
    const signals = buildCoachingSignals([
      { submittedAt: "2026-07-14T10:00:00.000Z", weightKg: 79, waistCm: 84, trainingAdherence: "90%", nutritionAdherence: "0.82" },
      { submittedAt: "2026-07-05T10:00:00.000Z", weightKg: 80 },
    ], 82, now);

    expect(signals.confidence).toBe("high");
    expect(signals.weightChangeKg).toBe(-1);
    expect(signals.weightChangePercent).toBe(-1.25);
    expect(signals.trainingAdherence).toBe(0.9);
    expect(signals.nutritionAdherence).toBe(0.82);
  });

  it("does not invent a trend from one repeated baseline", () => {
    const signals = buildCoachingSignals([
      { submittedAt: "2026-07-14T10:00:00.000Z", weightKg: 80 },
    ], 80, now);

    expect(signals.confidence).toBe("medium");
    expect(signals.weightChangeKg).toBeNull();
  });

  it("marks missing check-ins as low confidence", () => {
    const signals = buildCoachingSignals([], 75, now);
    expect(signals.confidence).toBe("low");
    expect(signals.confidenceReasons).toContain("no_checkins");
  });
});

describe("coaching control normalizers", () => {
  it("parses ratios and percentages", () => {
    expect(parseAdherence("85%")) .toBe(0.85);
    expect(parseAdherence("0,7")).toBe(0.7);
    expect(parseAdherence("pending")).toBeNull();
  });

  it("normalizes common goals and age", () => {
    expect(normalizeCoachingGoal("Perder grasa")).toBe("fat_loss");
    expect(normalizeCoachingGoal("Mantenimiento")).toBe("maintenance");
    expect(ageFromBirthDate("1996-07-15", new Date("2026-07-15T12:00:00.000Z"))).toBe(30);
  });
});
