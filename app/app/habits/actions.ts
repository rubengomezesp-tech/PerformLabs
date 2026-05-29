"use server";

import { revalidatePath } from "next/cache";
import { activateSuggestedHabits, archiveHabit, createCustomHabit, toggleHabitForDay } from "@/lib/repositories/habit-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function activateSuggestedHabitsAction(formData: FormData) {
  await activateSuggestedHabits(readText(formData, "workspaceId"));
  revalidatePath("/app/habits");
  revalidatePath("/app");
}

export async function createHabitAction(formData: FormData) {
  await createCustomHabit(readText(formData, "workspaceId"), readText(formData, "name"));
  revalidatePath("/app/habits");
}

export async function toggleHabitAction(formData: FormData) {
  await toggleHabitForDay(readText(formData, "workspaceId"), readText(formData, "habitId"), readText(formData, "date") || undefined);
  revalidatePath("/app/habits");
  revalidatePath("/app");
}

export async function archiveHabitAction(formData: FormData) {
  await archiveHabit(readText(formData, "workspaceId"), readText(formData, "habitId"));
  revalidatePath("/app/habits");
}
