"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { createWorkoutIssueRequest, createWorkoutSessionLog, type WorkoutSetLogInput } from "@/lib/repositories/workout-performance";
import { swapAssignedWorkoutExercise } from "@/lib/repositories/training-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function readInteger(value: FormDataEntryValue | null) {
  const parsed = readNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

export async function saveWorkoutSessionAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const templateExerciseIds = formData.getAll("templateExerciseId");
  const exerciseIds = formData.getAll("exerciseId");
  const setNumbers = formData.getAll("setNumber");
  const plannedReps = formData.getAll("plannedReps");
  const actualReps = formData.getAll("actualReps");
  const weightKg = formData.getAll("weightKg");
  const rir = formData.getAll("rir");
  const rpe = formData.getAll("rpe");
  const setNotes = formData.getAll("setNotes");

  const sets: WorkoutSetLogInput[] = templateExerciseIds.map((value, index) => ({
    templateExerciseId: typeof value === "string" ? value : "",
    exerciseId: typeof exerciseIds[index] === "string" ? String(exerciseIds[index]) : "",
    setNumber: readInteger(setNumbers[index]) ?? index + 1,
    plannedReps: typeof plannedReps[index] === "string" ? String(plannedReps[index]) : "",
    actualReps: readInteger(actualReps[index]),
    weightKg: readNumber(weightKg[index]),
    rir: readNumber(rir[index]),
    rpe: readNumber(rpe[index]),
    notes: typeof setNotes[index] === "string" ? String(setNotes[index]) : "",
  }));

  try {
    await createWorkoutSessionLog({
      workspaceId,
      templateId: readText(formData, "templateId"),
      dayId: readText(formData, "dayId"),
      assignedDayId: readText(formData, "assignedDayId"),
      perceivedEffort: readInteger(formData.get("perceivedEffort")),
      durationMinutes: readInteger(formData.get("durationMinutes")),
      notes: readText(formData, "notes"),
      sets,
    });
  } catch (error) {
    console.error("saveWorkoutSessionAction failed", (error as Error).message);
    redirect("/app/workouts?error=" + encodeURIComponent("No se pudo guardar el entreno. Inténtalo de nuevo."));
  }

  revalidatePath("/app/workouts");
  revalidatePath("/app/progress");
}

export async function swapWorkoutExerciseAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await swapAssignedWorkoutExercise({
      workspaceId,
      assignedExerciseId: readText(formData, "assignedExerciseId"),
      newExerciseId: readText(formData, "newExerciseId"),
    });
  } catch (error) {
    console.error("swapWorkoutExerciseAction failed", (error as Error).message);
    redirect("/app/workouts?error=" + encodeURIComponent("No se pudo cambiar el ejercicio. Inténtalo de nuevo."));
  }
  revalidatePath("/app/workouts");
}

export async function requestWorkoutIssueAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await createWorkoutIssueRequest({
      workspaceId,
      templateId: readText(formData, "templateId"),
      dayId: readText(formData, "dayId"),
      assignedDayId: readText(formData, "assignedDayId"),
      reason: readText(formData, "issueReason"),
      notes: readText(formData, "issueNotes"),
    });
  } catch (error) {
    console.error("requestWorkoutIssueAction failed", (error as Error).message);
    redirect("/app/workouts?error=" + encodeURIComponent("No se pudo avisar al coach. Inténtalo de nuevo."));
  }
  revalidatePath("/app/workouts");
  revalidatePath("/coach");
}
