"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { createMemberCheckin } from "@/lib/repositories/checkin-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createMemberCheckinAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  try {
    await createMemberCheckin({
      workspaceId,
      photos,
      weightKg: readText(formData, "weightKg"),
      bodyFatPercent: readText(formData, "bodyFatPercent"),
      waistCm: readText(formData, "waistCm"),
      chestCm: readText(formData, "chestCm"),
      hipCm: readText(formData, "hipCm"),
      energy: readText(formData, "energy"),
      sleepQuality: readText(formData, "sleepQuality"),
      digestion: readText(formData, "digestion"),
      trainingAdherence: readText(formData, "trainingAdherence"),
      nutritionAdherence: readText(formData, "nutritionAdherence"),
      notes: readText(formData, "notes"),
      photosAvailable: formData.get("photosAvailable") === "on",
    });
  } catch (error) {
    console.error("createMemberCheckinAction failed", (error as Error).message);
    redirect("/app/progress?error=" + encodeURIComponent("No se pudo enviar el check-in. Inténtalo de nuevo."));
  }

  revalidatePath("/app/progress");
  revalidatePath("/coach/checkins");
}
