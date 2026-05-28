"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { saveManagedContentPage } from "@/lib/repositories/content-management";
import { replyToSupportConversation } from "@/lib/repositories/support-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveCoachContentPageAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await saveManagedContentPage({
    workspaceId,
    title: readText(formData, "title"),
    slug: readText(formData, "slug"),
    status: readText(formData, "status"),
    heading: readText(formData, "heading"),
    notes: readText(formData, "notes"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.content.saved",
    entityType: "content_page",
    metadata: { title: readText(formData, "title") },
  });

  revalidatePath("/coach/content");
  revalidatePath("/app/guides");
  revalidatePath("/app/support");
}

export async function replyCoachSupportAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await replyToSupportConversation({
    workspaceId,
    conversationId: readText(formData, "conversationId"),
    message: readText(formData, "message"),
    status: readText(formData, "status"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.support.replied",
    entityType: "support_conversation",
    entityId: readText(formData, "conversationId") || null,
  });

  revalidatePath("/coach/content");
  revalidatePath("/app/support");
}
