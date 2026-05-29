"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { saveCoachBrain } from "@/lib/repositories/coach-brain";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveCoachBrainAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const enabled = readBoolean(formData, "enabled");

  await saveCoachBrain({
    workspaceId,
    enabled,
    assistantName: readText(formData, "assistantName"),
    greeting: readText(formData, "greeting"),
    persona: readText(formData, "persona"),
    tone: readText(formData, "tone"),
    specialties: readText(formData, "specialties"),
    rules: readText(formData, "rules"),
    substitutions: readText(formData, "substitutions"),
    forbidden: readText(formData, "forbidden"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: enabled ? "coach.ai_brain.enabled" : "coach.ai_brain.saved",
    entityType: "coach_ai_brain",
  });

  revalidatePath("/coach/ai");
  revalidatePath("/app/coach-ai");
}
