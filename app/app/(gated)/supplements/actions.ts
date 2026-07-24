"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberWorkspaceId } from "@/lib/auth/member-access";
import { toggleSupplementLog } from "@/lib/repositories/supplements";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function toggleSupplementAction(formData: FormData) {
  const workspaceId = await requireMemberWorkspaceId(readText(formData, "workspaceId") || undefined);
  try {
    await toggleSupplementLog(workspaceId, readText(formData, "supplementId"));
  } catch (error) {
    console.error("toggleSupplementAction failed", (error as Error).message);
    redirect("/app/supplements?error=" + encodeURIComponent("No se pudo guardar. Inténtalo de nuevo."));
  }
  revalidatePath("/app/supplements");
  revalidatePath("/app");
}
