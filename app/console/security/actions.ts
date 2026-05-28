"use server";

import { revalidatePath } from "next/cache";
import { canManageWorkspace, requirePlatformAccess } from "@/lib/auth/access-control";
import type { WorkspaceRole } from "@/lib/auth/access-control";
import {
  inviteWorkspaceTeamMember,
  revokeWorkspaceTeamAccess,
  revokeWorkspaceTeamInvitation,
} from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return undefined;
}

function assertWorkspaceAccess(session: Awaited<ReturnType<typeof requirePlatformAccess>>, workspaceId: string) {
  if (!canManageWorkspace(session, workspaceId)) {
    throw new Error("No tienes permisos para operar esta marca.");
  }
}

export async function inviteWorkspaceTeamMemberAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const workspaceId = readText(formData, "workspaceId");
  const baseUrl = appUrl();
  assertWorkspaceAccess(session, workspaceId);

  await inviteWorkspaceTeamMember({
    workspaceId,
    email: readText(formData, "email"),
    role: readText(formData, "role") as WorkspaceRole,
    actorRole: session.topRole,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    redirectTo: baseUrl ? `${baseUrl}/auth/callback?next=/coach` : undefined,
  });

  revalidatePath("/console/security");
}

export async function revokeWorkspaceTeamInvitationAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const workspaceId = readText(formData, "workspaceId");
  assertWorkspaceAccess(session, workspaceId);

  await revokeWorkspaceTeamInvitation({
    workspaceId,
    invitationId: readText(formData, "invitationId"),
    actorRole: session.topRole,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
  });

  revalidatePath("/console/security");
}

export async function revokeWorkspaceTeamAccessAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const workspaceId = readText(formData, "workspaceId");
  assertWorkspaceAccess(session, workspaceId);

  await revokeWorkspaceTeamAccess({
    workspaceId,
    membershipId: readText(formData, "membershipId"),
    actorRole: session.topRole,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
  });

  revalidatePath("/console/security");
}
