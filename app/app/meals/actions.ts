"use server";

import { revalidatePath } from "next/cache";
import { upsertDailyNutritionLog, upsertMealLog, type MealLogStatus } from "@/lib/repositories/nutrition-tracking";
import { swapAssignedMealItem } from "@/lib/repositories/nutrition-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function readMealStatus(formData: FormData): MealLogStatus {
  const status = readText(formData, "status");
  if (status === "skipped" || status === "swap_requested") return status;
  return "done";
}

export async function saveMealLogAction(formData: FormData) {
  await upsertMealLog({
    workspaceId: readText(formData, "workspaceId"),
    recipeId: readText(formData, "recipeId") || null,
    mealSlot: readText(formData, "mealSlot"),
    mealTitle: readText(formData, "mealTitle"),
    status: readMealStatus(formData),
    satisfaction: readNumber(formData, "satisfaction"),
    requestReason: readText(formData, "requestReason"),
    notes: readText(formData, "notes"),
  });

  revalidatePath("/app/meals");
  revalidatePath("/app/progress");
}

export async function swapMealAction(formData: FormData) {
  await swapAssignedMealItem({
    workspaceId: readText(formData, "workspaceId"),
    itemId: readText(formData, "itemId"),
    recipeId: readText(formData, "recipeId"),
  });

  revalidatePath("/app/meals");
  revalidatePath("/app/diary");
}

export async function saveNutritionDayAction(formData: FormData) {
  await upsertDailyNutritionLog({
    workspaceId: readText(formData, "workspaceId"),
    waterGlasses: readNumber(formData, "waterGlasses") ?? 0,
    hungerLevel: readNumber(formData, "hungerLevel"),
    energyLevel: readNumber(formData, "energyLevel"),
    notes: readText(formData, "notes"),
  });

  revalidatePath("/app/meals");
  revalidatePath("/app/progress");
}
