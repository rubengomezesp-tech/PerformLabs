"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { updateWorkspaceBranding } from "@/lib/repositories/workspaces";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateBrandingAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  // Authorize: only a manager of THIS workspace may rewrite its branding.
  // Without this guard the action is an unauthenticated cross-tenant write.
  await requireWorkspaceMutationAccess(workspaceId);

  await updateWorkspaceBranding(workspaceId, {
    accentColor: readText(formData, "accentColor"),
    backgroundColor: readText(formData, "backgroundColor"),
    logoUrl: readText(formData, "logoUrl"),
    heroHeadline: readText(formData, "heroHeadline"),
    heroSubtext: readText(formData, "heroSubtext"),
    heroImageUrl: readText(formData, "heroImageUrl"),
    welcomeMessage: readText(formData, "welcomeMessage"),
  });

  revalidatePath("/coach/brand");
  revalidatePath("/app");
  revalidatePath("/m");
}
