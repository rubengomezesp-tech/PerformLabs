"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { coachInquiryUpdateSchema } from "@/lib/lead-capture/coach-inquiry";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { updateCoachInquiry } from "@/lib/repositories/coach-inquiries";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateCoachInquiryAction(formData: FormData) {
  const parsed = coachInquiryUpdateSchema.safeParse({
    workspaceId: readText(formData, "workspaceId"),
    inquiryId: readText(formData, "inquiryId"),
    status: readText(formData, "status"),
    priority: readText(formData, "priority"),
    nextActionDate: readText(formData, "nextActionDate"),
    qualificationNotes: readText(formData, "qualificationNotes"),
  });

  if (!parsed.success) {
    throw new Error("Los datos del lead no son válidos.");
  }

  const brand = await getSelectedMemberAppBrand();
  if (parsed.data.workspaceId !== brand.id) {
    throw new Error("El lead no pertenece a la marca seleccionada.");
  }

  const session = await requireWorkspaceMutationAccess(brand.id);
  const nextActionAt = parsed.data.nextActionDate
    ? `${parsed.data.nextActionDate}T12:00:00.000Z`
    : null;

  await updateCoachInquiry({
    workspaceId: brand.id,
    inquiryId: parsed.data.inquiryId,
    status: parsed.data.status,
    priority: parsed.data.priority,
    nextActionAt,
    qualificationNotes: parsed.data.qualificationNotes,
  });

  await recordSecurityAuditEvent({
    workspaceId: brand.id,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.inquiry.updated",
    entityType: "coach_inquiry",
    entityId: parsed.data.inquiryId,
    metadata: {
      status: parsed.data.status,
      priority: parsed.data.priority,
      hasNextAction: Boolean(parsed.data.nextActionDate),
      hasQualificationNotes: Boolean(parsed.data.qualificationNotes),
    },
  });

  revalidatePath("/coach");
  revalidatePath("/coach/leads");
}
