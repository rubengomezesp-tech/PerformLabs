"use server";

import { revalidatePath } from "next/cache";
import { createCommunityPost, deleteCommunityPost, toggleCommunityLike } from "@/lib/repositories/community";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCommunityPostAction(formData: FormData) {
  await createCommunityPost(readText(formData, "workspaceId"), readText(formData, "body"));
  revalidatePath("/app/community");
}

export async function toggleCommunityLikeAction(formData: FormData) {
  await toggleCommunityLike(readText(formData, "workspaceId"), readText(formData, "postId"));
  revalidatePath("/app/community");
}

export async function deleteCommunityPostAction(formData: FormData) {
  await deleteCommunityPost(readText(formData, "workspaceId"), readText(formData, "postId"));
  revalidatePath("/app/community");
}
