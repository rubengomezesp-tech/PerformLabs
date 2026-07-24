"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { requestPhotoConsent } from "@/lib/repositories/photo-consents";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestPhotoConsentAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const memberProfileId = readText(formData, "memberProfileId");
  const beforeCheckinId = readText(formData, "beforeCheckinId");
  const afterCheckinId = readText(formData, "afterCheckinId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  if (!memberProfileId || !beforeCheckinId || !afterCheckinId || beforeCheckinId === afterCheckinId) return;

  const consentId = await requestPhotoConsent({
    workspaceId,
    memberProfileId,
    beforeCheckinId,
    afterCheckinId,
    requestedBy: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.member.photo_consent_requested",
    entityType: "member_photo_consent",
    entityId: consentId,
    metadata: { memberProfileId, beforeCheckinId, afterCheckinId },
  });

  revalidatePath(`/coach/members/${memberProfileId}/photos`);
}
