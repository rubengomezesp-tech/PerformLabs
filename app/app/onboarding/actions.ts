"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageWorkspace, getConsoleSession } from "@/lib/auth/access-control";
import { saveMemberOnboarding } from "@/lib/repositories/member-onboarding";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveMemberOnboardingAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const email = (await cookies()).get("performlabs_member_email")?.value ?? "";
  // Self-provisioning a client profile is allowed only for an authenticated
  // workspace admin/owner (so the founder can test). Public visitors cannot
  // enroll without a profile provisioned by payment / the coach.
  const session = await getConsoleSession();
  const allowProvision = Boolean(session && canManageWorkspace(session, workspaceId));
  let errorMessage = "";
  let reviewMode = "coach";

  try {
    const result = await saveMemberOnboarding({
      workspaceId,
      email,
      allowProvision,
      fullName: readText(formData, "fullName"),
      goal: readText(formData, "goal"),
      heightCm: readText(formData, "height"),
      weightKg: readText(formData, "weight"),
      birthDate: readText(formData, "birthDate"),
      sex: readText(formData, "sex"),
      timezone: readText(formData, "timezone"),
      injuries: readText(formData, "injuries"),
      healthConditions: readText(formData, "healthConditions"),
      currentPain: readText(formData, "currentPain"),
      chestPain: readText(formData, "chestPain"),
      fainting: readText(formData, "fainting"),
      uncontrolledBloodPressure: readText(formData, "uncontrolledBloodPressure"),
      medicalRestrictions: readText(formData, "medicalRestrictions"),
      medications: readText(formData, "medications"),
      eatingDisorderHistory: readText(formData, "eatingDisorderHistory"),
      healthConsent: readText(formData, "healthConsent") === "yes",
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

    reviewMode = result.requiresCoachReview ? "medical" : "coach";
  } catch (error) {
    console.error("No se pudo guardar el onboarding del miembro:", error);
    errorMessage = error instanceof Error ? error.message : "No se pudo guardar tu cuestionario. Inténtalo de nuevo.";
  }

  revalidatePath("/app/onboarding");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
  revalidatePath("/app");
  revalidatePath("/coach/members");
  revalidatePath("/coach");

  if (errorMessage) {
    redirect(`/app/onboarding?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect(`/app/onboarding?submitted=1&review=${reviewMode}`);
}
