"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveMemberOnboarding } from "@/lib/repositories/member-onboarding";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveMemberOnboardingAction(formData: FormData) {
  await saveMemberOnboarding({
    workspaceId: readText(formData, "workspaceId"),
    fullName: readText(formData, "fullName"),
    goal: readText(formData, "goal"),
    heightCm: readText(formData, "height"),
    weightKg: readText(formData, "weight"),
    birthDate: readText(formData, "birthDate"),
    timezone: readText(formData, "timezone"),
    injuries: readText(formData, "injuries"),
    trainingLocation: readText(formData, "trainingLocation"),
    daysPerWeek: readText(formData, "daysPerWeek"),
    sessionMinutes: readText(formData, "sessionMinutes"),
  });

  revalidatePath("/app/onboarding");
  revalidatePath("/app/workouts");
  revalidatePath("/coach/members");
  redirect("/app/workouts");
}
