"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { createCommunityPost, deleteCommunityPost, toggleCommunityLike } from "@/lib/repositories/community";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const ERR = "/app/community?error=" + encodeURIComponent("No se pudo completar la acción. Inténtalo de nuevo.");

export async function createCommunityPostAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await createCommunityPost(workspaceId, readText(formData, "body"));
  } catch (error) {
    console.error("createCommunityPostAction failed", (error as Error).message);
    redirect("/app/community?error=" + encodeURIComponent("No se pudo publicar. Inténtalo de nuevo."));
  }
  revalidatePath("/app/community");
}

export async function toggleCommunityLikeAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await toggleCommunityLike(workspaceId, readText(formData, "postId"));
  } catch (error) {
    console.error("toggleCommunityLikeAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/community");
}

export async function deleteCommunityPostAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await deleteCommunityPost(workspaceId, readText(formData, "postId"));
  } catch (error) {
    console.error("deleteCommunityPostAction failed", (error as Error).message);
    redirect(ERR);
  }
  revalidatePath("/app/community");
}
