"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { cloneRecipeToWorkspace } from "@/lib/repositories/nutrition-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function cloneRecipeAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const recipeId = readText(formData, "recipeId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const { id } = await cloneRecipeToWorkspace(recipeId, workspaceId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "nutrition.recipe.cloned",
    entityType: "recipe",
    entityId: id,
    metadata: { source: recipeId },
  });

  revalidatePath("/console/nutrition");
}
