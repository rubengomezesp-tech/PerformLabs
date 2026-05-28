"use server";

import { revalidatePath } from "next/cache";
import { createMemberCheckin } from "@/lib/repositories/checkin-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createMemberCheckinAction(formData: FormData) {
  await createMemberCheckin({
    workspaceId: readText(formData, "workspaceId"),
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

  revalidatePath("/app/progress");
  revalidatePath("/coach/checkins");
}
