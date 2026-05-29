"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import {
  cloneWorkoutTemplate,
  createManagedWorkoutDay,
  createManagedWorkoutExercise,
  createManagedWorkoutTemplate,
  setWorkoutTemplateStatus,
} from "@/lib/repositories/training-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkoutTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedWorkoutTemplate({
    workspaceId,
    name: readText(formData, "name"),
    goal: readText(formData, "goal"),
    level: readText(formData, "level"),
    daysPerWeek: readText(formData, "daysPerWeek"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workout_template.created",
    entityType: "workout_template",
    metadata: { name: readText(formData, "name"), daysPerWeek: readText(formData, "daysPerWeek") },
  });

  revalidatePath("/console/programs");
}

export async function createWorkoutDayAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedWorkoutDay({
    templateId: readText(formData, "templateId"),
    weekNumber: readText(formData, "weekNumber"),
    dayNumber: readText(formData, "dayNumber"),
    title: readText(formData, "title"),
    notes: readText(formData, "notes"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workout_day.created",
    entityType: "workout_template",
    entityId: readText(formData, "templateId") || null,
    metadata: { title: readText(formData, "title"), dayNumber: readText(formData, "dayNumber") },
  });

  revalidatePath("/console/programs");
}

export async function createWorkoutExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedWorkoutExercise({
    dayId: readText(formData, "dayId"),
    exerciseId: readText(formData, "exerciseId"),
    sets: readText(formData, "sets"),
    reps: readText(formData, "reps"),
    restSeconds: readText(formData, "restSeconds"),
    notes: readText(formData, "notes"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workout_exercise.added",
    entityType: "workout_template_day",
    entityId: readText(formData, "dayId") || null,
    metadata: { exerciseId: readText(formData, "exerciseId"), sets: readText(formData, "sets"), reps: readText(formData, "reps") },
  });

  revalidatePath("/console/programs");
  revalidatePath("/app/workouts");
}

export async function cloneWorkoutTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const templateId = readText(formData, "templateId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const { id } = await cloneWorkoutTemplate(templateId, workspaceId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "training.template.cloned",
    entityType: "workout_template",
    entityId: id,
    metadata: { source: templateId },
  });

  revalidatePath("/console/programs");
}

export async function setWorkoutTemplateStatusAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const templateId = readText(formData, "templateId");
  const next = readText(formData, "status");
  const status = next === "active" ? "active" : next === "archived" ? "archived" : "draft";
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await setWorkoutTemplateStatus(templateId, status);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "training.template.status_changed",
    entityType: "workout_template",
    entityId: templateId,
    metadata: { status },
  });

  revalidatePath("/console/programs");
}
