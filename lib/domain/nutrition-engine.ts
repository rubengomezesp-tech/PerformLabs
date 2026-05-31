import Decimal from "decimal.js";
import { z } from "zod";

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
  mealsPerDay?: number;
  trainingDaysPerWeek?: number;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  waterMl: number;
  meals: MacroMealTarget[];
  strategy: NutritionStrategy;
  formulaSnapshot: {
    formula: "mifflin_st_jeor";
    activityFactor: number;
    goalAdjustment: number;
    proteinPerKg: number;
    fatRatio: number;
  };
};

export type CarbCyclingDay = {
  dayType: "training_high" | "training_medium" | "rest_low" | "refeed";
  label: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes: string;
};

export type NutritionAdjustmentInput = {
  goal: NutritionGoal;
  currentCalories: number;
  weightTrendPercent: number;
  trainingAdherence: number;
  nutritionAdherence: number;
  hungerLevel: number;
  performanceTrend: "down" | "flat" | "up";
};

export type NutritionAdjustment = {
  decision: "hold" | "reduce" | "increase" | "refeed" | "diet_break";
  calorieChange: number;
  nextCalories: number;
  reason: string;
  actions: string[];
};

export type MacroMealTarget = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type NutritionStrategy = {
  label: string;
  weeklyRate: string;
  adjustmentRule: string;
  notes: string[];
};

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: "Sedentario",
  light: "Ligera",
  moderate: "Moderada",
  active: "Alta",
  athlete: "Atleta",
};

export const nutritionGoalLabels: Record<NutritionGoal, string> = {
  fat_loss: "Perdida de grasa",
  maintenance: "Mantenimiento",
  lean_gain: "Ganancia limpia",
  gain: "Volumen",
};

export const nutritionTargetSchema = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(12).max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  goal: z.enum(["fat_loss", "maintenance", "lean_gain", "gain"]),
  proteinPerKg: z.number().min(1.2).max(3).optional(),
  // Hasta 0.8 para que las plantillas keto (fat_ratio ~0.70) validen; el resto ~0.25.
  fatRatio: z.number().min(0.15).max(0.8).optional(),
  mealsPerDay: z.number().int().min(3).max(5).optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),
});

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

const strategyByGoal: Record<NutritionGoal, NutritionStrategy> = {
  fat_loss: {
    label: "Deficit controlado con proteina alta",
    weeklyRate: "0.4-0.8% del peso corporal por semana",
    adjustmentRule: "Si el promedio de 14 dias no baja, ajustar -100/-150 kcal o subir pasos.",
    notes: ["Priorizar saciedad", "Mantener rendimiento en fuerza", "Refeed opcional si hay fatiga acumulada"],
  },
  maintenance: {
    label: "Mantenimiento productivo",
    weeklyRate: "Peso estable con margen de +/-0.3%",
    adjustmentRule: "Ajustar +/-75 kcal si el promedio se mueve durante 2 semanas.",
    notes: ["Ideal para recomposicion", "Medir cintura y fotos", "Mantener proteina estable"],
  },
  lean_gain: {
    label: "Superavit limpio",
    weeklyRate: "0.15-0.3% del peso corporal por semana",
    adjustmentRule: "Si no sube rendimiento/peso en 14 dias, sumar +100 kcal.",
    notes: ["Carbohidrato alrededor del entreno", "Controlar cintura", "Subida lenta y medible"],
  },
  gain: {
    label: "Volumen con control",
    weeklyRate: "0.25-0.5% del peso corporal por semana",
    adjustmentRule: "Si la cintura sube demasiado rapido, recortar -100 kcal.",
    notes: ["Priorizar adherencia", "Carbs altos si entrena fuerte", "Deload nutricional si digestion falla"],
  },
};

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

export function calculateNutritionTargets(input: NutritionTargetInput): NutritionTargets {
  const parsed = nutritionTargetSchema.parse(input);
  const genderConstant = parsed.gender === "male" ? 5 : -161;
  const bmrDecimal = new Decimal(10)
    .times(parsed.weightKg)
    .plus(new Decimal(6.25).times(parsed.heightCm))
    .minus(new Decimal(5).times(parsed.age))
    .plus(genderConstant);
  const activityFactor = activityFactors[parsed.activityLevel];
  const goalAdjustment = goalAdjustments[parsed.goal];
  const tdeeDecimal = bmrDecimal.times(activityFactor);
  const targetCalories = roundToNearest(tdeeDecimal.times(new Decimal(1).plus(goalAdjustment)).toNumber(), 25);
  const proteinPerKg = parsed.proteinPerKg ?? 2.1;
  const fatRatio = parsed.fatRatio ?? 0.25;
  const proteinG = new Decimal(parsed.weightKg).times(proteinPerKg).round().toNumber();
  const fatG = new Decimal(targetCalories).times(fatRatio).dividedBy(9).round().toNumber();
  const remainingCalories = targetCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingCalories / 4));
  const fiberG = Math.max(22, Math.round((targetCalories / 1000) * 14));
  const waterMl = roundToNearest(parsed.weightKg * 38 + (parsed.trainingDaysPerWeek ?? 3) * 120, 50);
  const meals = buildMealTargets({
    mealsPerDay: parsed.mealsPerDay ?? 4,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
  });

  return {
    bmr: bmrDecimal.round().toNumber(),
    tdee: tdeeDecimal.round().toNumber(),
    targetCalories,
    proteinG,
    fatG,
    carbsG,
    fiberG,
    waterMl,
    meals,
    strategy: strategyByGoal[parsed.goal],
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

export function buildMealTargets(input: {
  mealsPerDay: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}): MacroMealTarget[] {
  const ratios = splitCaloriesByMeal(Math.max(3, Math.min(5, input.mealsPerDay)));
  const mealNames = ["Desayuno", "Comida", "Cena", "Snack", "Extra"];

  return ratios.map((ratio, index) => ({
    name: mealNames[index] ?? `Comida ${index + 1}`,
    calories: roundToNearest(input.targetCalories * ratio, 5),
    proteinG: Math.round(input.proteinG * ratio),
    carbsG: Math.round(input.carbsG * ratio),
    fatG: Math.round(input.fatG * ratio),
  }));
}

export function macroCalories(targets: Pick<NutritionTargets, "proteinG" | "carbsG" | "fatG">) {
  return targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9;
}

export function buildCarbCyclingTargets(targets: NutritionTargets, trainingDaysPerWeek: number): CarbCyclingDay[] {
  const highDays = Math.max(1, Math.min(3, Math.round(trainingDaysPerWeek / 2)));
  const mediumDays = Math.max(0, trainingDaysPerWeek - highDays);
  const lowDays = Math.max(0, 7 - trainingDaysPerWeek);
  const protein = targets.proteinG;

  const makeDay = (
    dayType: CarbCyclingDay["dayType"],
    label: string,
    calorieMultiplier: number,
    fatRatio: number,
    notes: string,
  ): CarbCyclingDay => {
    const calories = roundToNearest(targets.targetCalories * calorieMultiplier, 25);
    const fatG = Math.max(35, Math.round((calories * fatRatio) / 9));
    const carbsG = Math.max(0, Math.round((calories - protein * 4 - fatG * 9) / 4));

    return { dayType, label, calories, proteinG: protein, carbsG, fatG, notes };
  };

  const days: CarbCyclingDay[] = [
    makeDay("training_high", `${highDays} dia(s) alto`, 1.08, 0.2, "Usar en pierna, push pesado o sesiones de mayor volumen."),
  ];

  if (mediumDays) {
    days.push(makeDay("training_medium", `${mediumDays} dia(s) medio`, 1, 0.24, "Usar en sesiones normales de fuerza/hipertrofia."));
  }

  if (lowDays) {
    days.push(makeDay("rest_low", `${lowDays} dia(s) bajo`, 0.88, 0.3, "Usar en descanso, cardio suave o días de baja demanda."));
  }

  if (targets.strategy.label.toLowerCase().includes("deficit")) {
    days.push(makeDay("refeed", "Refeed opcional", 1.18, 0.18, "Aplicar 1 día si hay fatiga alta y adherencia buena."));
  }

  return days;
}

export function recommendNutritionAdjustment(input: NutritionAdjustmentInput): NutritionAdjustment {
  const adherence = Math.min(input.trainingAdherence, input.nutritionAdherence);
  const poorAdherence = adherence < 0.7;
  const highHunger = input.hungerLevel >= 8;

  if (input.goal === "fat_loss") {
    if (poorAdherence) {
      return {
        decision: "hold",
        calorieChange: 0,
        nextCalories: input.currentCalories,
        reason: "La adherencia es el cuello de botella; bajar calorías empeoraría el cumplimiento.",
        actions: ["Simplificar comidas", "Subir saciedad", "Revisar horarios y proteína", "Mantener calorías 7 días"],
      };
    }

    if (input.weightTrendPercent > -0.25 && input.performanceTrend !== "down") {
      return {
        decision: "reduce",
        calorieChange: -125,
        nextCalories: input.currentCalories - 125,
        reason: "El promedio no baja lo suficiente y el rendimiento permite un ajuste suave.",
        actions: ["Recortar 100-150 kcal", "Mantener proteína", "Revisar pasos", "Reevaluar en 7-10 días"],
      };
    }

    if (highHunger && input.performanceTrend === "down") {
      return {
        decision: "refeed",
        calorieChange: 200,
        nextCalories: input.currentCalories,
        reason: "Hambre alta y rendimiento bajando: conviene aliviar fatiga sin abandonar el déficit semanal.",
        actions: ["Añadir refeed alto en carbohidrato", "Reducir grasas ese día", "Mantener pasos", "No tocar proteína"],
      };
    }
  }

  if ((input.goal === "lean_gain" || input.goal === "gain") && input.weightTrendPercent < 0.1 && input.performanceTrend !== "down") {
    return {
      decision: "increase",
      calorieChange: 125,
      nextCalories: input.currentCalories + 125,
      reason: "El peso/rendimiento no suben lo suficiente para una fase de ganancia.",
      actions: ["Sumar 100-150 kcal", "Priorizar carbohidrato peri-entreno", "Controlar cintura", "Revisar en 14 días"],
    };
  }

  return {
    decision: "hold",
    calorieChange: 0,
    nextCalories: input.currentCalories,
    reason: "La tendencia está dentro del rango esperado.",
    actions: ["Mantener plan", "Revisar check-in semanal", "Ajustar solo si cambia la tendencia"],
  };
}
