"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { logCardioSession } from "@/lib/repositories/cardio";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function logCardioSessionAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await logCardioSession({
      workspaceId,
      modality: readText(formData, "modality"),
      intensity: readText(formData, "intensity") || null,
      minutes: readOptionalNumber(formData, "minutes"),
      distanceKm: readOptionalNumber(formData, "distanceKm"),
      calories: readOptionalNumber(formData, "calories"),
      avgHr: readOptionalNumber(formData, "avgHr"),
      notes: readText(formData, "notes") || null,
      loggedOn: readText(formData, "loggedOn") || null,
    });
  } catch (error) {
    console.error("logCardioSessionAction failed", (error as Error).message);
    redirect("/app/cardio?error=" + encodeURIComponent("No se pudo guardar la sesión. Inténtalo de nuevo."));
  }

  revalidatePath("/app/cardio");
  revalidatePath("/app");
}
