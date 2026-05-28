"use server";

import { revalidatePath } from "next/cache";
import { createWorkoutIssueRequest, createWorkoutSessionLog, type WorkoutSetLogInput } from "@/lib/repositories/workout-performance";

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

  await createWorkoutSessionLog({
    workspaceId: readText(formData, "workspaceId"),
    templateId: readText(formData, "templateId"),
    dayId: readText(formData, "dayId"),
    assignedDayId: readText(formData, "assignedDayId"),
    perceivedEffort: readInteger(formData.get("perceivedEffort")),
    durationMinutes: readInteger(formData.get("durationMinutes")),
    notes: readText(formData, "notes"),
    sets,
  });

  revalidatePath("/app/workouts");
  revalidatePath("/app/progress");
}

export async function requestWorkoutIssueAction(formData: FormData) {
  await createWorkoutIssueRequest({
    workspaceId: readText(formData, "workspaceId"),
    templateId: readText(formData, "templateId"),
    dayId: readText(formData, "dayId"),
    assignedDayId: readText(formData, "assignedDayId"),
    reason: readText(formData, "issueReason"),
    notes: readText(formData, "issueNotes"),
  });

  revalidatePath("/app/workouts");
  revalidatePath("/coach");
}
