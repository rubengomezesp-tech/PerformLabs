"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAccess } from "@/lib/auth/access-control";
import { convertLeadToProject } from "@/lib/repositories/implementation-projects";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { addLeadNote, createSalesLead, updateSalesLead } from "@/lib/repositories/sales-leads";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createLeadAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await createSalesLead({
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    brandName: readText(formData, "brandName"),
    websiteUrl: readText(formData, "websiteUrl"),
    monthlyClients: readText(formData, "monthlyClients"),
    mainGoal: readText(formData, "mainGoal"),
    notes: readText(formData, "notes"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "lead.created_manually",
    entityType: "sales_lead",
    metadata: { email: readText(formData, "email"), brandName: readText(formData, "brandName") },
  });

  revalidatePath("/console");
  revalidatePath("/console/leads");
}

export async function updateLeadAction(formData: FormData) {
  const session = await requirePlatformAccess();
  const id = readText(formData, "id");

  await updateSalesLead({
    id,
    status: readText(formData, "status"),
    priority: readText(formData, "priority"),
    assignedAgent: readText(formData, "assignedAgent"),
    nextActionAt: readText(formData, "nextActionAt"),
    qualificationNotes: readText(formData, "qualificationNotes"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "lead.updated",
    entityType: "sales_lead",
    entityId: id || null,
    metadata: { status: readText(formData, "status"), priority: readText(formData, "priority") },
  });

  revalidatePath("/console/leads");
}

export async function addLeadNoteAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await addLeadNote({
    leadId: readText(formData, "leadId"),
    authorName: readText(formData, "authorName"),
    note: readText(formData, "note"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "lead.note_added",
    entityType: "sales_lead",
    entityId: readText(formData, "leadId") || null,
    metadata: { authorName: readText(formData, "authorName") },
  });

  revalidatePath("/console/leads");
}

export async function convertLeadToProjectAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await convertLeadToProject(readText(formData, "leadId"), readText(formData, "templateId"));
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "lead.converted",
    entityType: "sales_lead",
    entityId: readText(formData, "leadId") || null,
    metadata: { templateId: readText(formData, "templateId") },
  });

  revalidatePath("/console/leads");
  revalidatePath("/console/projects");
}
