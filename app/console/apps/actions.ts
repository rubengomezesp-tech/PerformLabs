"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAccess } from "@/lib/auth/access-control";
import { entitlementModules, upsertWorkspaceEntitlement, type EntitlementModule, type EntitlementStatus } from "@/lib/repositories/entitlements";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { createWorkspace, setWorkspaceActive, setWorkspaceMemberDomain, updateWorkspace } from "@/lib/repositories/workspaces";
import { registerProjectDomain } from "@/lib/vercel/domains";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Connect only the member-app host. The public/marketing domain stays on its
 * existing website project and is never registered or moved by this action.
 */
export async function connectWorkspaceDomainAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const id = readText(formData, "id");
  const domain = readText(formData, "memberDomain");
  if (!id || !domain) return;

  const memberDomain = await setWorkspaceMemberDomain(id, domain);
  const result = await registerProjectDomain(memberDomain);

  await recordSecurityAuditEvent({
    workspaceId: id,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workspace.domain_connected",
    entityType: "workspace",
    entityId: id,
    metadata: {
      memberDomain,
      vercel: !result.configured ? "not_configured" : result.ok ? "registered" : `error:${result.error ?? "unknown"}`,
    },
  });

  revalidatePath("/console/apps");
}

export async function createWorkspaceAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await createWorkspace({
    name: readText(formData, "name"),
    appName: readText(formData, "appName"),
    publicDomain: readText(formData, "publicDomain"),
    memberDomain: readText(formData, "memberDomain"),
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
    publicDomain: readText(formData, "publicDomain"),
    memberDomain: readText(formData, "memberDomain"),
    supportEmail: readText(formData, "supportEmail"),
    accentColor: readText(formData, "accentColor"),
    subdomain: readText(formData, "subdomain"),
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

export async function updateWorkspaceEntitlementAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const workspaceId = readText(formData, "workspaceId");
  const status = readText(formData, "status") as EntitlementStatus;
  const reason = readText(formData, "reason");
  const contractRef = readText(formData, "contractRef");
  const enabledModules = new Set(formData.getAll("modules").filter((value): value is EntitlementModule => (
    typeof value === "string" && entitlementModules.includes(value as EntitlementModule)
  )));
  const modules = Object.fromEntries(entitlementModules.map((module) => [module, enabledModules.has(module)])) as Record<EntitlementModule, boolean>;

  await upsertWorkspaceEntitlement({
    workspaceId,
    status,
    reason,
    contractRef,
    modules,
    updatedBy: session.mode === "authenticated" ? session.user.id : null,
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "workspace.entitlement_updated",
    entityType: "workspace",
    entityId: workspaceId,
    metadata: { status, reason, contractRef, modules },
  });

  revalidatePath("/console/apps");
  revalidatePath("/coach");
  revalidatePath("/coach/programs");
  revalidatePath("/coach/nutrition");
  revalidatePath("/coach/checkins");
  revalidatePath("/coach/content");
  revalidatePath("/coach/notifications");
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
  revalidatePath("/app/progress");
  revalidatePath("/app/guides");
  revalidatePath("/app/support");
}
