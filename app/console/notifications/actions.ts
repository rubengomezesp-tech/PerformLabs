"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { createManagedScheduledNotification, saveManagedNotificationTemplate } from "@/lib/repositories/notification-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveNotificationTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await saveManagedNotificationTemplate({
    workspaceId,
    eventKey: readText(formData, "eventKey"),
    channel: readText(formData, "channel"),
    subject: readText(formData, "subject"),
    body: readText(formData, "body"),
    isEnabled: readText(formData, "isEnabled") !== "false",
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "notification_template.saved",
    entityType: "notification_template",
    metadata: { eventKey: readText(formData, "eventKey"), channel: readText(formData, "channel") },
  });

  revalidatePath("/console/notifications");
}

export async function createScheduledNotificationAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedScheduledNotification({
    workspaceId,
    name: readText(formData, "name"),
    channel: readText(formData, "channel"),
    deliveryAt: readText(formData, "deliveryAt"),
    message: readText(formData, "message"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "scheduled_notification.created",
    entityType: "scheduled_notification",
    metadata: { name: readText(formData, "name"), channel: readText(formData, "channel") },
  });

  revalidatePath("/console/notifications");
}
