"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { joinChallenge } from "@/lib/repositories/challenges";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function joinChallengeAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await joinChallenge(workspaceId, readText(formData, "challengeId"));
  } catch (error) {
    console.error("joinChallengeAction failed", (error as Error).message);
    redirect("/app/challenges?error=" + encodeURIComponent("No se pudo unir al reto. Inténtalo de nuevo."));
  }
  revalidatePath("/app/challenges");
  revalidatePath("/app");
}
