import { describe, expect, it } from "vitest";
import {
  buildCarbCyclingTargets,
  calculateNutritionTargets,
  macroCalories,
  recommendNutritionAdjustment,
  splitCaloriesByMeal,
} from "./nutrition-engine";

describe("nutrition-engine", () => {
  it("calculates coherent targets from Mifflin-St Jeor inputs", () => {
    const targets = calculateNutritionTargets({
      gender: "male",
      age: 32,
      heightCm: 178,
      weightKg: 82,
      activityLevel: "active",
      goal: "fat_loss",
      mealsPerDay: 4,
      trainingDaysPerWeek: 5,
    });

    expect(targets.bmr).toBe(1778);
    expect(targets.tdee).toBe(3066);
    expect(targets.targetCalories).toBe(2525);
    expect(targets.proteinG).toBe(172);
    expect(targets.meals).toHaveLength(4);
    expect(targets.waterMl).toBe(3700);
    expect(Math.abs(macroCalories(targets) - targets.targetCalories)).toBeLessThanOrEqual(5);
  });

  it("splits daily calories into practical meal ratios", () => {
    expect(splitCaloriesByMeal(3)).toEqual([0.3, 0.4, 0.3]);
    expect(splitCaloriesByMeal(4)).toEqual([0.25, 0.35, 0.25, 0.15]);
    expect(splitCaloriesByMeal(5)).toEqual([0.22, 0.28, 0.22, 0.14, 0.14]);
  });

  it("always allocates 100% of calories regardless of meal count", () => {
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    for (const meals of [1, 2, 3, 4, 5, 6]) {
      const ratios = splitCaloriesByMeal(meals);
      expect(sum(ratios)).toBeCloseTo(1, 10);
    }
    // 1-2 meals used to under-allocate (0.3 / 0.7); pin the corrected ratios.
    expect(splitCaloriesByMeal(1)).toEqual([1]);
    expect(splitCaloriesByMeal(2)).toEqual([0.45, 0.55]);
  });

  it("creates carb cycling days without changing protein target", () => {
    const targets = calculateNutritionTargets({
      gender: "female",
      age: 29,
      heightCm: 165,
      weightKg: 64,
      activityLevel: "moderate",
      goal: "fat_loss",
      trainingDaysPerWeek: 4,
    });

    const days = buildCarbCyclingTargets(targets, 4);

    expect(days.map((day) => day.dayType)).toEqual(["training_high", "training_medium", "rest_low", "refeed"]);
    expect(days.every((day) => day.proteinG === targets.proteinG)).toBe(true);
    expect(days.find((day) => day.dayType === "training_high")?.calories).toBeGreaterThan(targets.targetCalories);
    expect(days.find((day) => day.dayType === "rest_low")?.calories).toBeLessThan(targets.targetCalories);
  });

  it("does not cut calories when adherence is the bottleneck", () => {
    const adjustment = recommendNutritionAdjustment({
      goal: "fat_loss",
      currentCalories: 2300,
      weightTrendPercent: 0,
      trainingAdherence: 0.62,
      nutritionAdherence: 0.68,
      hungerLevel: 5,
      performanceTrend: "flat",
    });

    expect(adjustment.decision).toBe("hold");
    expect(adjustment.nextCalories).toBe(2300);
    expect(adjustment.actions).toContain("Simplificar comidas");
  });

  it("increases calories for stalled lean gain", () => {
    const adjustment = recommendNutritionAdjustment({
      goal: "lean_gain",
      currentCalories: 2800,
      weightTrendPercent: 0.02,
      trainingAdherence: 0.9,
      nutritionAdherence: 0.9,
      hungerLevel: 4,
      performanceTrend: "up",
    });

    expect(adjustment.decision).toBe("increase");
    expect(adjustment.nextCalories).toBe(2925);
  });
});
