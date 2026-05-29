"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { createManagedExercise } from "@/lib/repositories/training-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCoachExerciseAction(formData: FormData) {
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
    isBaseLibrary: false,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.exercise.created",
    entityType: "exercise",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/exercises");
  revalidatePath("/coach/programs");
}
