"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAccess } from "@/lib/auth/access-control";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { createWorkspace, setWorkspaceActive, updateWorkspace } from "@/lib/repositories/workspaces";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkspaceAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await createWorkspace({
    name: readText(formData, "name"),
    appName: readText(formData, "appName"),
    customDomain: readText(formData, "customDomain"),
    supportEmail: readText(formData, "supportEmail"),
    accentColor: readText(formData, "accentColor"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workspace.created",
    entityType: "workspace",
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/apps");
}

export async function updateWorkspaceAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const id = readText(formData, "id");

  await updateWorkspace({
    id,
    name: readText(formData, "name"),
    appName: readText(formData, "appName"),
    customDomain: readText(formData, "customDomain"),
    supportEmail: readText(formData, "supportEmail"),
    accentColor: readText(formData, "accentColor"),
  });
  await recordSecurityAuditEvent({
    workspaceId: id,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workspace.updated",
    entityType: "workspace",
    entityId: id,
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/apps");
}

export async function toggleWorkspaceAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const id = readText(formData, "id");
  const isActive = readText(formData, "isActive") === "true";

  await setWorkspaceActive(id, isActive);
  await recordSecurityAuditEvent({
    workspaceId: id,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: isActive ? "workspace.activated" : "workspace.paused",
    entityType: "workspace",
    entityId: id,
    metadata: { isActive },
  });
  revalidatePath("/console/apps");
}
