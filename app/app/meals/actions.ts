"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { logWaterGlass, upsertDailyNutritionLog, upsertMealLog, type MealLogStatus } from "@/lib/repositories/nutrition-tracking";
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

// The workspace is resolved from the authenticated session (not the form's brand
// id, which can be the zero-UUID fallback). Repo failures redirect with a notice
// instead of throwing the member into the full-screen error boundary.
const SAVE_ERROR = "/app/meals?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo.");

export async function saveMealLogAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await upsertMealLog({
      workspaceId,
      recipeId: readText(formData, "recipeId") || null,
      mealSlot: readText(formData, "mealSlot"),
      mealTitle: readText(formData, "mealTitle"),
      status: readMealStatus(formData),
      satisfaction: readNumber(formData, "satisfaction"),
      requestReason: readText(formData, "requestReason"),
      notes: readText(formData, "notes"),
    });
  } catch (error) {
    console.error("saveMealLogAction failed", (error as Error).message);
    redirect(SAVE_ERROR);
  }
  revalidatePath("/app/meals");
  revalidatePath("/app/progress");
}

export async function swapMealAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await swapAssignedMealItem({
      workspaceId,
      itemId: readText(formData, "itemId"),
      recipeId: readText(formData, "recipeId"),
    });
  } catch (error) {
    console.error("swapMealAction failed", (error as Error).message);
    redirect(SAVE_ERROR);
  }
  revalidatePath("/app/meals");
  revalidatePath("/app/diary");
}

/**
 * Member picks one of the surfaced swap alternatives for a meal. The alternative
 * references a real brand recipe, so we reuse swapAssignedMealItem to record the
 * choice in the assigned plan item — keeping a single source of truth for the meal.
 */
export async function chooseMealSwapAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await swapAssignedMealItem({
      workspaceId,
      itemId: readText(formData, "itemId"),
      recipeId: readText(formData, "recipeId"),
    });
  } catch (error) {
    console.error("chooseMealSwapAction failed", (error as Error).message);
    redirect(SAVE_ERROR);
  }
  revalidatePath("/app/meals");
  revalidatePath("/app/diary");
  revalidatePath("/app/progress");
}

export async function logWaterGlassAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await logWaterGlass(workspaceId, 1);
  } catch (error) {
    console.error("logWaterGlassAction failed", (error as Error).message);
    redirect(SAVE_ERROR);
  }
  revalidatePath("/app/meals");
  revalidatePath("/app/diary");
  revalidatePath("/app/progress");
}

export async function saveNutritionDayAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await upsertDailyNutritionLog({
      workspaceId,
      waterGlasses: readNumber(formData, "waterGlasses") ?? 0,
      hungerLevel: readNumber(formData, "hungerLevel"),
      energyLevel: readNumber(formData, "energyLevel"),
      notes: readText(formData, "notes"),
    });
  } catch (error) {
    console.error("saveNutritionDayAction failed", (error as Error).message);
    redirect(SAVE_ERROR);
  }
  revalidatePath("/app/meals");
  revalidatePath("/app/progress");
}
