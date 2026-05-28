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
    sex: readText(formData, "sex"),
    timezone: readText(formData, "timezone"),
    injuries: readText(formData, "injuries"),
    experienceLevel: readText(formData, "experienceLevel"),
    availableEquipment: readText(formData, "availableEquipment"),
    preferredTrainingDays: readText(formData, "preferredTrainingDays"),
    cardioPreference: readText(formData, "cardioPreference"),
    activityLevel: readText(formData, "activityLevel"),
    sleepHours: readText(formData, "sleepHours"),
    stepsTarget: readText(formData, "stepsTarget"),
    trainingLocation: readText(formData, "trainingLocation"),
    daysPerWeek: readText(formData, "daysPerWeek"),
    sessionMinutes: readText(formData, "sessionMinutes"),
    mealsPerDay: readText(formData, "mealsPerDay"),
    dietStyle: readText(formData, "dietStyle"),
    allergies: readText(formData, "allergies"),
    preferredFoods: readText(formData, "preferredFoods"),
    dislikedFoods: readText(formData, "dislikedFoods"),
    cookingTimeMinutes: readText(formData, "cookingTimeMinutes"),
    budgetLevel: readText(formData, "budgetLevel"),
    hideMacros: readText(formData, "hideMacros") === "on",
    notes: readText(formData, "notes"),
  });

  revalidatePath("/app/onboarding");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
  revalidatePath("/app");
  revalidatePath("/coach/members");
  revalidatePath("/coach");
  redirect("/app");
}
