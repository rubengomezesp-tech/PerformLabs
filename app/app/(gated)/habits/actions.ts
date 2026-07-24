"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { activateSuggestedHabits, archiveHabit, createCustomHabit, toggleHabitForDay } from "@/lib/repositories/habit-tracking";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const ERR = "/app/habits?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo.");

export async function activateSuggestedHabitsAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await activateSuggestedHabits(workspaceId);
  } catch (error) {
    console.error("activateSuggestedHabitsAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/habits");
  revalidatePath("/app");
}

export async function createHabitAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await createCustomHabit(workspaceId, readText(formData, "name"));
  } catch (error) {
    console.error("createHabitAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/habits");
}

export async function toggleHabitAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await toggleHabitForDay(workspaceId, readText(formData, "habitId"), readText(formData, "date") || undefined);
  } catch (error) {
    console.error("toggleHabitAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/habits");
  revalidatePath("/app");
}

export async function archiveHabitAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await archiveHabit(workspaceId, readText(formData, "habitId"));
  } catch (error) {
    console.error("archiveHabitAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/habits");
}
