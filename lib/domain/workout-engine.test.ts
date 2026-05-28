import { describe, expect, it } from "vitest";
import {
  buildPeriodizedWorkoutPlan,
  buildWeeklyPeriodizationTargets,
  buildWorkoutBlueprint,
  estimateTrainingStress,
  recommendNextQuarterlyModule,
  recommendWorkoutAdjustment,
} from "./workout-engine";

describe("workout-engine", () => {
  it("builds a workout blueprint for every requested week and day", () => {
    const days = buildWorkoutBlueprint({
      goals: ["hypertrophy"],
      weeks: 4,
      daysPerWeek: 3,
      sessionMinutes: 60,
      experience: "intermediate",
      location: "gym",
    });

    expect(days).toHaveLength(12);
    expect(days[0]).toMatchObject({ week: 1, day: 1, focus: "Push", phase: "Base tecnica" });
    expect(days[0].blocks.map((block) => block.type)).toEqual(["warmup", "main", "mobility"]);
  });

  it("creates a capped 12-week periodized plan with three phases", () => {
    const plan = buildPeriodizedWorkoutPlan({
      goals: ["hypertrophy"],
      weeks: 24,
      daysPerWeek: 4,
      sessionMinutes: 60,
      experience: "intermediate",
      location: "gym",
    });

    expect(plan.weeks).toBe(12);
    expect(plan.days).toHaveLength(48);
    expect(plan.phases.map((phase) => phase.title)).toEqual(["Base tecnica", "Progresion", "Especializacion"]);
  });

  it("marks deload weeks in weekly periodization targets", () => {
    const targets = buildWeeklyPeriodizationTargets(12);

    expect(targets).toHaveLength(12);
    expect(targets.filter((week) => week.deload).map((week) => week.week)).toEqual([4, 8, 12]);
    expect(targets[0].rirTarget).toBe("RIR 2-3");
    expect(targets[11].phase).toBe("Especializacion");
  });

  it("rotates quarterly module based on adherence, progress and pain", () => {
    expect(recommendNextQuarterlyModule({
      currentDaysPerWeek: 4,
      adherenceRate: 0.9,
      volumeTrend: "up",
      painFlags: 0,
    })).toMatchObject({ decision: "progress", nextDaysPerWeek: 5 });

    expect(recommendNextQuarterlyModule({
      currentDaysPerWeek: 4,
      adherenceRate: 0.5,
      volumeTrend: "down",
      painFlags: 2,
    })).toMatchObject({ decision: "deload", nextDaysPerWeek: 3 });
  });

  it("estimates training stress from days, duration, level and goal", () => {
    const stress = estimateTrainingStress({
      daysPerWeek: 5,
      sessionMinutes: 70,
      experience: "advanced",
      goal: "strength",
    });

    expect(stress.score).toBeGreaterThanOrEqual(75);
    expect(stress.label).toMatch(/Carga/);
  });

  it("recommends progress, deload or regression from member signals", () => {
    expect(recommendWorkoutAdjustment({
      adherenceRate: 0.9,
      painFlags: 0,
      performanceTrend: "up",
      recoveryScore: 80,
      currentVolumeSets: 60,
    })).toMatchObject({ decision: "progress", nextVolumeSets: 65 });

    expect(recommendWorkoutAdjustment({
      adherenceRate: 0.9,
      painFlags: 2,
      performanceTrend: "flat",
      recoveryScore: 70,
      currentVolumeSets: 60,
    })).toMatchObject({ decision: "deload", nextVolumeSets: 43 });

    expect(recommendWorkoutAdjustment({
      adherenceRate: 0.5,
      painFlags: 0,
      performanceTrend: "flat",
      recoveryScore: 70,
      currentVolumeSets: 60,
    })).toMatchObject({ decision: "regress", nextVolumeSets: 51 });
  });
});
