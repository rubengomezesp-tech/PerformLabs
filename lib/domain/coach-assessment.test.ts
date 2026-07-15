import { describe, expect, it } from "vitest";
import {
  calculateAssessmentCompletion,
  calculateAssessmentRiskFlags,
  readAssessmentAnswers,
  resolveAssessmentStatus,
} from "./coach-assessment";

describe("coach assessment", () => {
  it("trims and only accepts known answer fields", () => {
    expect(readAssessmentAnswers({ primaryGoal: "  Perder grasa ", injected: "no" })).toEqual({
      primaryGoal: "Perder grasa",
    });
  });

  it("escalates critical cardiovascular answers", () => {
    const answers = { chestPain: "yes", currentPain: "yes" } as const;
    expect(calculateAssessmentRiskFlags(answers)).toEqual(["chest_pain", "current_pain"]);
    expect(resolveAssessmentStatus(answers, "complete")).toBe("medical_clearance_required");
  });

  it("does not treat explicit negative free text as a condition", () => {
    expect(calculateAssessmentRiskFlags({ medicalConditions: "Ninguna", medications: "none" })).toEqual([]);
  });

  it("keeps an incomplete assessment as a draft", () => {
    const answers = { primaryGoal: "Fat loss" };
    expect(calculateAssessmentCompletion(answers)).toBeGreaterThan(0);
    expect(calculateAssessmentCompletion(answers)).toBeLessThan(100);
    expect(resolveAssessmentStatus(answers, "complete")).toBe("draft");
  });
});
