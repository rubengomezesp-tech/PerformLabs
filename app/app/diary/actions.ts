"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
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

/**
 * Text Smart-Add. Resolves the workspace from the session, enforces the monthly AI
 * quota, and NEVER throws to the error boundary: an unconfigured/over-quota/failed
 * AI estimate redirects back with a notice so the member can add the meal manually.
 */
export async function smartAddMealAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const description = readText(formData, "description");
  const date = readText(formData, "date") || undefined;
  if (!description) {
    redirect("/app/diary?error=" + encodeURIComponent("Escribe qué comiste para estimarlo."));
  }

  const quota = await checkAiQuota(workspaceId, "photo");
  if (!quota.allowed) {
    redirect("/app/diary?error=" + encodeURIComponent(`Has alcanzado el límite de ${quota.limit} estimaciones con IA este mes.`));
  }

  try {
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
    // analyzeMealText doesn't return token usage; a nominal estimate keeps the
    // per-workspace monthly counter moving (recordAiUsage counts one row per call).
    await recordAiUsage({
      workspaceId,
      feature: "photo",
      model: "claude-opus-4-8",
      usage: { input_tokens: 320, output_tokens: 80 },
    });
  } catch (error) {
    console.error("smartAddMealAction failed", (error as Error).message);
    redirect("/app/diary?error=" + encodeURIComponent("La estimación con IA no está disponible ahora. Añade la comida a mano."));
  }

  revalidatePath("/app/diary");
  revalidatePath("/app");
}

export async function deleteFoodEntryAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await deleteFoodDiaryEntry(workspaceId, readText(formData, "entryId"));
  } catch (error) {
    console.error("deleteFoodEntryAction failed", (error as Error).message);
    redirect("/app/diary?error=" + encodeURIComponent("No se pudo borrar la entrada. Inténtalo de nuevo."));
  }
  revalidatePath("/app/diary");
  revalidatePath("/app");
}
