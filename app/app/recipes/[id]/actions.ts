"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { addFoodDiaryEntry } from "@/lib/repositories/nutrition-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Logs a recipe's per-serving macros into the member's food diary for today. */
export async function logRecipeToDiaryAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await addFoodDiaryEntry({
      workspaceId,
      name: readText(formData, "name") || "Receta",
      protein: readNumber(formData, "protein"),
      fat: readNumber(formData, "fat"),
      carbs: readNumber(formData, "carbs"),
      calories: readNumber(formData, "calories"),
      source: "recipe",
    });
  } catch (error) {
    console.error("logRecipeToDiaryAction failed", (error as Error).message);
    redirect("/app/diary?error=" + encodeURIComponent("No se pudo registrar la receta. Inténtalo de nuevo."));
  }

  revalidatePath("/app/diary");
  revalidatePath("/app/meals");
  revalidatePath("/app");
}
