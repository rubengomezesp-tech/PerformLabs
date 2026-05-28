"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { markOnboardingBriefingReviewed } from "@/lib/repositories/coach-dashboard";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function markCoachBriefingReviewedAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const responseId = readText(formData, "responseId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await markOnboardingBriefingReviewed({
    workspaceId,
    responseId,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.onboarding.reviewed",
    entityType: "member_onboarding_response",
    entityId: responseId || null,
    metadata: { source: "coach_dashboard" },
  });

  revalidatePath("/coach");
  revalidatePath("/coach/members");
}
