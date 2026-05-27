"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { saveManagedContentPage } from "@/lib/repositories/content-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveContentPageAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await saveManagedContentPage({
    id: readText(formData, "id"),
    workspaceId,
    title: readText(formData, "title"),
    slug: readText(formData, "slug"),
    status: readText(formData, "status"),
    heading: readText(formData, "heading"),
    notes: readText(formData, "notes"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "content_page.saved",
    entityType: "content_page",
    entityId: readText(formData, "id") || null,
    metadata: { title: readText(formData, "title"), slug: readText(formData, "slug") },
  });

  revalidatePath("/console/content");
  revalidatePath("/app/guides");
  revalidatePath("/app/support");
}
