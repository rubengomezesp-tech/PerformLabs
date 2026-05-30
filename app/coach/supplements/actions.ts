"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { createSupplement, deleteSupplement, type SupplementTiming } from "@/lib/repositories/supplements";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createSupplementAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createSupplement({
    workspaceId,
    name: readText(formData, "name"),
    dose: readText(formData, "dose"),
    timing: (readText(formData, "timing") || "anytime") as SupplementTiming,
    notes: readText(formData, "notes"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.supplement.created",
    entityType: "supplement",
  });

  revalidatePath("/coach/supplements");
  revalidatePath("/app/supplements");
}

export async function deleteSupplementAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  await requireWorkspaceMutationAccess(workspaceId);
  await deleteSupplement(workspaceId, readText(formData, "supplementId"));
  revalidatePath("/coach/supplements");
  revalidatePath("/app/supplements");
}
