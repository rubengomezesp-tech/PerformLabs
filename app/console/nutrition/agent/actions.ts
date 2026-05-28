"use server";

import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { generateRecipeDraft, type AiRecipeDraft, type AiRecipeResult } from "@/lib/ai/nutrition-agent";
import { saveAiRecipe } from "@/lib/repositories/nutrition-management";

export async function generateRecipeAction(
  _previous: AiRecipeResult | null,
  formData: FormData,
): Promise<AiRecipeResult> {
  const prompt = typeof formData.get("prompt") === "string" ? (formData.get("prompt") as string) : "";
  return generateRecipeDraft(prompt);
}

export type SaveRecipeState = { ok: boolean; message: string } | null;

export async function saveRecipeAction(
  _previous: SaveRecipeState,
  formData: FormData,
): Promise<SaveRecipeState> {
  const workspaceId = typeof formData.get("workspaceId") === "string" ? (formData.get("workspaceId") as string) : "";
  const payload = typeof formData.get("recipe") === "string" ? (formData.get("recipe") as string) : "";
  if (!workspaceId || !payload) {
    return { ok: false, message: "Falta la marca o la receta." };
  }

  await requireWorkspaceMutationAccess(workspaceId);

  try {
    const recipe = JSON.parse(payload) as AiRecipeDraft;
    await saveAiRecipe(workspaceId, recipe);
    return { ok: true, message: `"${recipe.name}" guardada en tu librería.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar la receta." };
  }
}
