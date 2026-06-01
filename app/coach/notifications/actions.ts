"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  createManagedScheduledNotification,
  saveManagedNotificationTemplate,
  setScheduledNotificationStatus,
} from "@/lib/repositories/notification-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveCoachNotificationTemplateAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await saveManagedNotificationTemplate({
    workspaceId,
    eventKey: readText(formData, "eventKey"),
    channel: readText(formData, "channel"),
    subject: readText(formData, "subject"),
    body: readText(formData, "body"),
    isEnabled: readBoolean(formData, "isEnabled"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.notification_template.saved",
    entityType: "notification_template",
    metadata: {
      eventKey: readText(formData, "eventKey"),
      channel: readText(formData, "channel"),
    },
  });

  revalidatePath("/coach/notifications");
}

/** Move a draft campaign to 'scheduled' so the cron dispatcher delivers it. */
export async function activateCoachScheduledNotificationAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  await setScheduledNotificationStatus(workspaceId, readText(formData, "scheduledId"), "scheduled");
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.notification_scheduled.activated",
    entityType: "scheduled_notification",
    entityId: readText(formData, "scheduledId") || null,
  });
  revalidatePath("/coach/notifications");
}

/** Pull a scheduled campaign back to draft so it won't be delivered. */
export async function cancelCoachScheduledNotificationAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  await setScheduledNotificationStatus(workspaceId, readText(formData, "scheduledId"), "draft");
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.notification_scheduled.cancelled",
    entityType: "scheduled_notification",
    entityId: readText(formData, "scheduledId") || null,
  });
  revalidatePath("/coach/notifications");
}

export async function createCoachScheduledNotificationAction(formData: FormData) {
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
    action: "coach.notification_scheduled.created",
    entityType: "scheduled_notification",
    metadata: {
      name: readText(formData, "name"),
      channel: readText(formData, "channel"),
    },
  });

  revalidatePath("/coach/notifications");
}
