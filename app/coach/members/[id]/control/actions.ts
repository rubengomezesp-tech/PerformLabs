"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { calculateNutritionTargets } from "@/lib/domain/nutrition-engine";
import { saveCoachMemberAdjustment } from "@/lib/repositories/coaching-control";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

const adjustmentSchema = z.object({
  workspaceId: z.string().uuid(),
  memberProfileId: z.string().uuid(),
  goal: z.enum(["fat_loss", "maintenance", "lean_gain", "gain"]),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().int().min(12).max(90),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(35).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  proteinPerKg: z.coerce.number().min(1.2).max(3),
  fatRatioPercent: z.coerce.number().min(15).max(50),
  mealsPerDay: z.coerce.number().int().min(3).max(5),
  calorieOffset: z.coerce.number().int().min(-750).max(750),
  trainingDaysPerWeek: z.coerce.number().int().min(1).max(7),
  dailyStepsTarget: z.coerce.number().int().min(0).max(100000),
  currentTrainingWeek: z.coerce.number().int().min(1).max(12),
  effectiveOn: z.string().date(),
  nextReviewOn: z.string().date(),
  rationale: z.string().max(5000),
  memberMessage: z.string().max(2000),
  intent: z.enum(["draft", "published"]),
});

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveCoachAdjustmentAction(formData: FormData) {
  const parsed = adjustmentSchema.parse({
    workspaceId: readText(formData, "workspaceId"),
    memberProfileId: readText(formData, "memberProfileId"),
    goal: readText(formData, "goal"),
    gender: readText(formData, "gender"),
    age: readText(formData, "age"),
    heightCm: readText(formData, "heightCm"),
    weightKg: readText(formData, "weightKg"),
    activityLevel: readText(formData, "activityLevel"),
    proteinPerKg: readText(formData, "proteinPerKg"),
    fatRatioPercent: readText(formData, "fatRatioPercent"),
    mealsPerDay: readText(formData, "mealsPerDay"),
    calorieOffset: readText(formData, "calorieOffset"),
    trainingDaysPerWeek: readText(formData, "trainingDaysPerWeek"),
    dailyStepsTarget: readText(formData, "dailyStepsTarget"),
    currentTrainingWeek: readText(formData, "currentTrainingWeek"),
    effectiveOn: readText(formData, "effectiveOn"),
    nextReviewOn: readText(formData, "nextReviewOn"),
    rationale: readText(formData, "rationale"),
    memberMessage: readText(formData, "memberMessage"),
    intent: readText(formData, "intent"),
  });
  const session = await requireWorkspaceMutationAccess(parsed.workspaceId);
  const target = calculateNutritionTargets({
    gender: parsed.gender,
    age: parsed.age,
    heightCm: parsed.heightCm,
    weightKg: parsed.weightKg,
    activityLevel: parsed.activityLevel,
    goal: parsed.goal,
    proteinPerKg: parsed.proteinPerKg,
    fatRatio: parsed.fatRatioPercent / 100,
    mealsPerDay: parsed.mealsPerDay,
    trainingDaysPerWeek: parsed.trainingDaysPerWeek,
  });
  const targetCalories = Math.max(800, target.targetCalories + parsed.calorieOffset);
  const targetCarbsG = Math.max(0, Math.round((targetCalories - (target.proteinG * 4) - (target.fatG * 9)) / 4));
  const actorUserId = session.mode === "authenticated" ? session.user.id : null;

  const result = await saveCoachMemberAdjustment({
    workspaceId: parsed.workspaceId,
    memberProfileId: parsed.memberProfileId,
    status: parsed.intent,
    goal: parsed.goal,
    effectiveOn: parsed.effectiveOn,
    targetCalories,
    targetProteinG: target.proteinG,
    targetCarbsG,
    targetFatG: target.fatG,
    waterTargetMl: target.waterMl,
    fiberTargetG: target.fiberG,
    dailyStepsTarget: parsed.dailyStepsTarget,
    trainingDaysPerWeek: parsed.trainingDaysPerWeek,
    currentTrainingWeek: parsed.currentTrainingWeek,
    nextReviewOn: parsed.nextReviewOn,
    rationale: parsed.rationale,
    memberMessage: parsed.memberMessage,
    calculationSnapshot: {
      formula: target.formulaSnapshot.formula,
      input: {
        gender: parsed.gender,
        age: parsed.age,
        heightCm: parsed.heightCm,
        weightKg: parsed.weightKg,
        activityLevel: parsed.activityLevel,
        goal: parsed.goal,
        proteinPerKg: parsed.proteinPerKg,
        fatRatio: parsed.fatRatioPercent / 100,
        mealsPerDay: parsed.mealsPerDay,
        trainingDaysPerWeek: parsed.trainingDaysPerWeek,
      },
      base: { bmr: target.bmr, tdee: target.tdee, targetCalories: target.targetCalories },
      calorieOffset: parsed.calorieOffset,
      final: { targetCalories, proteinG: target.proteinG, carbsG: targetCarbsG, fatG: target.fatG },
    },
    actorUserId,
  });

  await recordSecurityAuditEvent({
    workspaceId: parsed.workspaceId,
    actorUserId,
    action: parsed.intent === "published" ? "coach.member.adjustment_published" : "coach.member.adjustment_drafted",
    entityType: "coach_member_adjustment",
    entityId: result.adjustmentId,
    metadata: {
      version: result.version,
      mealPlanUpdated: result.mealPlanUpdated,
      workoutPlanUpdated: result.workoutPlanUpdated,
    },
  });

  revalidatePath(`/coach/members/${parsed.memberProfileId}`);
  revalidatePath(`/coach/members/${parsed.memberProfileId}/control`);
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
  revalidatePath("/app/cardio");

  const scope = result.mealPlanUpdated && result.workoutPlanUpdated ? "full" : "partial";
  redirect(`/coach/members/${parsed.memberProfileId}/control?saved=${parsed.intent}&scope=${scope}`);
}
