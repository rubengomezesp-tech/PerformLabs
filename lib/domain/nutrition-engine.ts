export type NutritionGoal = "fat_loss" | "maintenance" | "lean_gain" | "gain";
export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";

export type NutritionTargetInput = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  proteinPerKg?: number;
  fatRatio?: number;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  formulaSnapshot: {
    formula: "mifflin_st_jeor";
    activityFactor: number;
    goalAdjustment: number;
    proteinPerKg: number;
    fatRatio: number;
  };
};

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const goalAdjustments: Record<NutritionGoal, number> = {
  fat_loss: -0.18,
  maintenance: 0,
  lean_gain: 0.1,
  gain: 0.18,
};

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

export function calculateNutritionTargets(input: NutritionTargetInput): NutritionTargets {
  const genderConstant = input.gender === "male" ? 5 : -161;
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + genderConstant;
  const activityFactor = activityFactors[input.activityLevel];
  const goalAdjustment = goalAdjustments[input.goal];
  const tdee = bmr * activityFactor;
  const targetCalories = roundToNearest(tdee * (1 + goalAdjustment), 25);
  const proteinPerKg = input.proteinPerKg ?? 2.1;
  const fatRatio = input.fatRatio ?? 0.25;
  const proteinG = Math.round(input.weightKg * proteinPerKg);
  const fatG = Math.round((targetCalories * fatRatio) / 9);
  const remainingCalories = targetCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingCalories / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    proteinG,
    fatG,
    carbsG,
    formulaSnapshot: {
      formula: "mifflin_st_jeor",
      activityFactor,
      goalAdjustment,
      proteinPerKg,
      fatRatio,
    },
  };
}

export function splitCaloriesByMeal(mealsPerDay: number) {
  if (mealsPerDay <= 3) {
    return [0.3, 0.4, 0.3].slice(0, mealsPerDay);
  }

  if (mealsPerDay === 4) {
    return [0.25, 0.35, 0.25, 0.15];
  }

  return [0.22, 0.28, 0.22, 0.14, 0.14].slice(0, mealsPerDay);
}
