"use server";

import { revalidatePath } from "next/cache";
import { analyzeMealText } from "@/lib/ai/smart-add";
import { checkAiQuota, recordAiUsage } from "@/lib/ai/usage";
import { analyzeMealPhoto } from "@/lib/ai/vision-nutrition";
import { addFoodDiaryEntry, deleteFoodDiaryEntry } from "@/lib/repositories/nutrition-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type PhotoMealResult =
  | { ok: true; name: string; calories: number; protein: number; carbs: number; fat: number }
  | { ok: false; error: string };

export async function smartAddMealPhotoAction(input: {
  workspaceId: string;
  base64: string;
  mediaType: string;
  date?: string;
}): Promise<PhotoMealResult> {
  try {
    const quota = await checkAiQuota(input.workspaceId, "photo");
    if (!quota.allowed) {
      return { ok: false, error: `Has alcanzado el límite de ${quota.limit} análisis por foto de este mes.` };
    }

    const result = await analyzeMealPhoto(input.base64, input.mediaType);
    if (!result.ok) return { ok: false, error: result.error };

    await recordAiUsage({ workspaceId: input.workspaceId, feature: "photo", model: result.model, usage: result.usage });
    await addFoodDiaryEntry({
      workspaceId: input.workspaceId,
      name: result.macros.name,
      protein: result.macros.protein,
      fat: result.macros.fat,
      carbs: result.macros.carbs,
      calories: result.macros.calories,
      source: "photo",
      date: input.date,
    });

    revalidatePath("/app/diary");
    revalidatePath("/app");
    return {
      ok: true,
      name: result.macros.name,
      calories: result.macros.calories,
      protein: result.macros.protein,
      carbs: result.macros.carbs,
      fat: result.macros.fat,
    };
  } catch {
    return { ok: false, error: "No se pudo añadir la comida. Inténtalo de nuevo." };
  }
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
