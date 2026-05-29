"use server";

import { revalidatePath } from "next/cache";
import { analyzeMealText } from "@/lib/ai/smart-add";
import { addFoodDiaryEntry, deleteFoodDiaryEntry } from "@/lib/repositories/nutrition-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function smartAddMealAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const description = readText(formData, "description");
  const date = readText(formData, "date") || undefined;

  const macros = await analyzeMealText(description);

  await addFoodDiaryEntry({
    workspaceId,
    name: macros.name,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    calories: macros.calories,
    source: "smart_add",
    date,
  });

  revalidatePath("/app/diary");
  revalidatePath("/app");
}

export async function deleteFoodEntryAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const entryId = readText(formData, "entryId");

  await deleteFoodDiaryEntry(workspaceId, entryId);

  revalidatePath("/app/diary");
  revalidatePath("/app");
}
