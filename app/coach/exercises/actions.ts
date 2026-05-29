"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  addExerciseVideo,
  createManagedExercise,
  deleteManagedExercise,
  updateManagedExercise,
} from "@/lib/repositories/training-management";
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

export async function updateCoachExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const exerciseId = readText(formData, "exerciseId");

  await updateManagedExercise({
    id: exerciseId,
    workspaceId,
    name: readText(formData, "name"),
    muscleGroups: readText(formData, "muscleGroups"),
    equipment: readText(formData, "equipment"),
    locations: readText(formData, "locations"),
    difficulty: readText(formData, "difficulty"),
    instructions: readText(formData, "instructions"),
    defaultVideoUrl: readText(formData, "defaultVideoUrl"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.exercise.updated",
    entityType: "exercise",
    entityId: exerciseId,
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/exercises");
  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function deleteCoachExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const exerciseId = readText(formData, "exerciseId");

  await deleteManagedExercise({ id: exerciseId, workspaceId });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.exercise.deleted",
    entityType: "exercise",
    entityId: exerciseId,
  });

  revalidatePath("/coach/exercises");
  revalidatePath("/coach/programs");
}

export async function addCoachExerciseVideoAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const exerciseId = readText(formData, "exerciseId");

  await addExerciseVideo({
    workspaceId,
    exerciseId,
    title: readText(formData, "title"),
    videoUrl: readText(formData, "videoUrl"),
    thumbnailUrl: readText(formData, "thumbnailUrl"),
    isDefault: readText(formData, "isDefault") === "true",
    createdBy: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.exercise.video_added",
    entityType: "exercise",
    entityId: exerciseId,
    metadata: { title: readText(formData, "title") },
  });

  revalidatePath("/coach/exercises");
  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}
