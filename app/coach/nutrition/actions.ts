"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { calculateNutritionTargets, type ActivityLevel, type Gender, type NutritionGoal } from "@/lib/domain/nutrition-engine";
import { createManagedDietTemplate, createManagedIngredient, createManagedRecipe } from "@/lib/repositories/nutrition-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCoachDietTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedDietTemplate({
    workspaceId,
    categoryId: readText(formData, "categoryId"),
    name: readText(formData, "name"),
    goal: readText(formData, "goal"),
    caloriesMin: readText(formData, "caloriesMin"),
    caloriesMax: readText(formData, "caloriesMax"),
    proteinRatio: readText(formData, "proteinRatio"),
    carbsRatio: readText(formData, "carbsRatio"),
    fatRatio: readText(formData, "fatRatio"),
    tags: readText(formData, "tags"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.diet_template.created",
    entityType: "diet_template",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/nutrition");
  revalidatePath("/app/meals");
}

export async function createCoachMacroTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const weightKg = Number(readText(formData, "weightKg")) || 80;
  const goal = readText(formData, "goal") as NutritionGoal;
  const targets = calculateNutritionTargets({
    gender: readText(formData, "gender") as Gender,
    age: Number(readText(formData, "age")) || 30,
    heightCm: Number(readText(formData, "heightCm")) || 175,
    weightKg,
    activityLevel: readText(formData, "activityLevel") as ActivityLevel,
    goal,
    proteinPerKg: Number(readText(formData, "proteinPerKg")) || undefined,
    fatRatio: (Number(readText(formData, "fatRatio")) || 25) / 100,
    mealsPerDay: Number(readText(formData, "mealsPerDay")) || 4,
    trainingDaysPerWeek: Number(readText(formData, "trainingDaysPerWeek")) || 4,
  });
  const proteinRatio = Math.round(((targets.proteinG * 4) / targets.targetCalories) * 100);
  const carbsRatio = Math.round(((targets.carbsG * 4) / targets.targetCalories) * 100);
  const fatRatio = Math.round(((targets.fatG * 9) / targets.targetCalories) * 100);

  await createManagedDietTemplate({
    workspaceId,
    categoryId: readText(formData, "categoryId"),
    name: readText(formData, "name") || `${targets.strategy.label} · ${targets.targetCalories} kcal`,
    goal,
    caloriesMin: String(targets.targetCalories - 75),
    caloriesMax: String(targets.targetCalories + 75),
    proteinRatio: String(proteinRatio),
    carbsRatio: String(carbsRatio),
    fatRatio: String(fatRatio),
    tags: [
      "macrolab",
      `${targets.proteinG}g proteina`,
      `${targets.carbsG}g carbs`,
      `${targets.fatG}g grasas`,
      `${targets.fiberG}g fibra`,
    ].join(","),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.macro_template.generated",
    entityType: "diet_template",
    metadata: { targetCalories: targets.targetCalories, protein: targets.proteinG, carbs: targets.carbsG, fat: targets.fatG },
  });

  revalidatePath("/coach/nutrition");
  revalidatePath("/app/meals");
}

export async function createCoachIngredientAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedIngredient({
    workspaceId,
    name: readText(formData, "name"),
    caloriesPer100g: readText(formData, "caloriesPer100g"),
    proteinPer100g: readText(formData, "proteinPer100g"),
    carbsPer100g: readText(formData, "carbsPer100g"),
    fatPer100g: readText(formData, "fatPer100g"),
    allergens: readText(formData, "allergens"),
    tags: readText(formData, "tags"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.ingredient.created",
    entityType: "ingredient",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/nutrition");
}

export async function createCoachRecipeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedRecipe({
    workspaceId,
    categoryId: readText(formData, "categoryId"),
    name: readText(formData, "name"),
    mealSlot: readText(formData, "mealSlot"),
    instructions: readText(formData, "instructions"),
    tags: readText(formData, "tags"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.recipe.created",
    entityType: "recipe",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/nutrition");
  revalidatePath("/app/meals");
}
