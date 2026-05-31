"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { replyToSupportConversation } from "@/lib/repositories/support-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function replyCoachMessageAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const message = readText(formData, "message");
  if (!message) return;

  await replyToSupportConversation({
    workspaceId,
    conversationId: readText(formData, "conversationId"),
    message,
    // Replying hands the ball back to the member.
    status: "waiting_member",
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.support.replied",
    entityType: "support_conversation",
    entityId: readText(formData, "conversationId") || null,
  });

  revalidatePath("/coach/messages");
  revalidatePath("/coach/content");
  revalidatePath("/app/support");
}
