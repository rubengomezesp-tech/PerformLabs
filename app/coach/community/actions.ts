"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import {
  createCoachAnnouncement,
  moderateDeleteCommunityPost,
  toggleCommunityPin,
} from "@/lib/repositories/community";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCoachAnnouncementAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createCoachAnnouncement(
    workspaceId,
    readText(formData, "body"),
    readText(formData, "authorName"),
  );

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.community_announcement.published",
    entityType: "community_post",
  });

  revalidatePath("/coach/community");
  revalidatePath("/app/community");
}

export async function toggleCommunityPinAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const postId = readText(formData, "postId");

  const result = await toggleCommunityPin(workspaceId, postId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: result.pinned ? "coach.community_post.pinned" : "coach.community_post.unpinned",
    entityType: "community_post",
    entityId: postId,
  });

  revalidatePath("/coach/community");
  revalidatePath("/app/community");
}

export async function moderateDeleteCommunityPostAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const postId = readText(formData, "postId");

  await moderateDeleteCommunityPost(workspaceId, postId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.community_post.moderated",
    entityType: "community_post",
    entityId: postId,
  });

  revalidatePath("/coach/community");
  revalidatePath("/app/community");
}
