"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import type { ExperienceLevel, TrainingLocation, WorkoutGoal } from "@/lib/domain/workout-engine";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { createManagedWorkoutBlueprint, createManagedWorkoutDay, createManagedWorkoutExercise, createManagedWorkoutTemplate, createQuarterlyModuleLibrary, updateManagedWorkoutExercise } from "@/lib/repositories/training-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCoachWorkoutTemplateAction(formData: FormData) {
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
    action: "coach.workout_template.created",
    entityType: "workout_template",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function createCoachWorkoutBlueprintAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const result = await createManagedWorkoutBlueprint({
    workspaceId,
    name: readText(formData, "name"),
    goal: readText(formData, "goal") as WorkoutGoal,
    level: readText(formData, "level") as ExperienceLevel,
    location: readText(formData, "location") as TrainingLocation,
    daysPerWeek: readText(formData, "daysPerWeek"),
    sessionMinutes: readText(formData, "sessionMinutes"),
    injuries: readText(formData, "injuries"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.workout_blueprint.generated",
    entityType: "workout_template",
    entityId: result.templateId,
    metadata: { name: readText(formData, "name"), daysCreated: result.daysCreated, exercisesCreated: result.exercisesCreated },
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function createQuarterlyModuleLibraryAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const result = await createQuarterlyModuleLibrary({
    workspaceId,
    goal: readText(formData, "goal") as WorkoutGoal,
    level: readText(formData, "level") as ExperienceLevel,
    location: readText(formData, "location") as TrainingLocation,
    sessionMinutes: readText(formData, "sessionMinutes"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.quarterly_module_library.generated",
    entityType: "workout_template",
    metadata: {
      created: result.created.map((item) => item.daysPerWeek),
      skipped: result.skipped,
    },
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function createCoachWorkoutDayAction(formData: FormData) {
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
    action: "coach.workout_day.created",
    entityType: "workout_template",
    entityId: readText(formData, "templateId") || null,
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function createCoachWorkoutExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedWorkoutExercise({
    dayId: readText(formData, "dayId"),
    exerciseId: readText(formData, "exerciseId"),
    sets: readText(formData, "sets"),
    reps: readText(formData, "reps"),
    tempo: readText(formData, "tempo"),
    restSeconds: readText(formData, "restSeconds"),
    targetRir: readText(formData, "targetRir"),
    intensityTechnique: readText(formData, "intensityTechnique"),
    notes: readText(formData, "notes"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.workout_exercise.added",
    entityType: "workout_template_day",
    entityId: readText(formData, "dayId") || null,
    metadata: { exerciseId: readText(formData, "exerciseId") },
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}

export async function updateCoachWorkoutExerciseAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await updateManagedWorkoutExercise({
    templateExerciseId: readText(formData, "templateExerciseId"),
    dayId: readText(formData, "dayId"),
    exerciseId: readText(formData, "exerciseId"),
    sets: readText(formData, "sets"),
    reps: readText(formData, "reps"),
    tempo: readText(formData, "tempo"),
    restSeconds: readText(formData, "restSeconds"),
    targetRir: readText(formData, "targetRir"),
    intensityTechnique: readText(formData, "intensityTechnique"),
    notes: readText(formData, "notes"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.workout_exercise.updated",
    entityType: "workout_template_exercise",
    entityId: readText(formData, "templateExerciseId") || null,
    metadata: { exerciseId: readText(formData, "exerciseId") },
  });

  revalidatePath("/coach/programs");
  revalidatePath("/app/workouts");
}
