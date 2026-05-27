"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { createManagedExercise } from "@/lib/repositories/training-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedExercise({
    workspaceId,
    name: readText(formData, "name"),
    muscleGroups: readText(formData, "muscleGroups"),
    equipment: readText(formData, "equipment"),
    locations: readText(formData, "locations"),
    difficulty: readText(formData, "difficulty"),
    instructions: readText(formData, "instructions"),
    defaultVideoUrl: readText(formData, "defaultVideoUrl"),
    isBaseLibrary: readText(formData, "scope") === "base",
  });
  await recordSecurityAuditEvent({
    workspaceId: readText(formData, "scope") === "base" ? null : workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "exercise.created",
    entityType: "exercise",
    metadata: { name: readText(formData, "name"), scope: readText(formData, "scope") },
  });

  revalidatePath("/console/exercises");
}
