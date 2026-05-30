"use server";

import { revalidatePath } from "next/cache";
import { joinChallenge } from "@/lib/repositories/challenges";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function joinChallengeAction(formData: FormData) {
  await joinChallenge(readText(formData, "workspaceId"), readText(formData, "challengeId"));
  revalidatePath("/app/challenges");
  revalidatePath("/app");
}
