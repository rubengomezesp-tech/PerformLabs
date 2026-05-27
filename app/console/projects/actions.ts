"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAccess } from "@/lib/auth/access-control";
import {
  addImplementationTemplateTask,
  addProjectTask,
  createOperationalWorkspaceFromProject,
  updateImplementationTemplate,
  updateProjectBrief,
  updateProjectStatus,
  updateProjectTask,
  updateTemplateBriefDefaults,
} from "@/lib/repositories/implementation-projects";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProjectAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const id = readText(formData, "id");

  await updateProjectStatus({
    id,
    status: readText(formData, "status"),
    assignedAgent: readText(formData, "assignedAgent"),
    launchTargetDate: readText(formData, "launchTargetDate"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "project.updated",
    entityType: "implementation_project",
    entityId: id || null,
    metadata: { status: readText(formData, "status"), assignedAgent: readText(formData, "assignedAgent") },
  });

  revalidatePath("/console/projects");
  revalidatePath(`/console/projects/${id}`);
}

export async function updateProjectTaskAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const projectId = readText(formData, "projectId");

  await updateProjectTask({
    id: readText(formData, "id"),
    status: readText(formData, "status"),
    dueDate: readText(formData, "dueDate"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "project_task.updated",
    entityType: "project_onboarding_task",
    entityId: readText(formData, "id") || null,
    metadata: { projectId, status: readText(formData, "status") },
  });

  revalidatePath("/console/projects");
  if (projectId) {
    revalidatePath(`/console/projects/${projectId}`);
  }
}

export async function addProjectTaskAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const projectId = readText(formData, "projectId");

  await addProjectTask({
    projectId,
    phase: readText(formData, "phase"),
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    dueDate: readText(formData, "dueDate"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "project_task.created",
    entityType: "project_onboarding_task",
    metadata: { projectId, title: readText(formData, "title"), phase: readText(formData, "phase") },
  });

  revalidatePath("/console/projects");
  if (projectId) {
    revalidatePath(`/console/projects/${projectId}`);
  }
}

export async function updateProjectBriefAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const projectId = readText(formData, "projectId");

  await updateProjectBrief({
    projectId,
    appName: readText(formData, "appName"),
    domainStrategy: readText(formData, "domainStrategy"),
    desiredDomain: readText(formData, "desiredDomain"),
    logoStatus: readText(formData, "logoStatus"),
    primaryColor: readText(formData, "primaryColor"),
    accentColor: readText(formData, "accentColor"),
    brandNotes: readText(formData, "brandNotes"),
    targetAudience: readText(formData, "targetAudience"),
    offerSummary: readText(formData, "offerSummary"),
    pricingNotes: readText(formData, "pricingNotes"),
    paymentProvider: readText(formData, "paymentProvider"),
    contentNotes: readText(formData, "contentNotes"),
    exerciseVideoNotes: readText(formData, "exerciseVideoNotes"),
    nutritionNotes: readText(formData, "nutritionNotes"),
    legalNotes: readText(formData, "legalNotes"),
    launchNotes: readText(formData, "launchNotes"),
    internalRisks: readText(formData, "internalRisks"),
    kickoffCallAt: readText(formData, "kickoffCallAt"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "project_brief.updated",
    entityType: "project_brief",
    metadata: { projectId, appName: readText(formData, "appName") },
  });

  revalidatePath("/console/projects");
  revalidatePath(`/console/projects/${projectId}`);
}

export async function createOperationalWorkspaceAction(formData: FormData) {
  const session = await requirePlatformAccess();

  const projectId = readText(formData, "projectId");

  await createOperationalWorkspaceFromProject(projectId);
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "project.workspace_created",
    entityType: "implementation_project",
    entityId: projectId || null,
    metadata: { projectId },
  });

  revalidatePath("/console/projects");
  revalidatePath(`/console/projects/${projectId}`);
  revalidatePath("/console/apps");
  revalidatePath("/console/brand");
}

export async function updateImplementationTemplateAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await updateImplementationTemplate({
    id: readText(formData, "id"),
    name: readText(formData, "name"),
    description: readText(formData, "description"),
    buyerType: readText(formData, "buyerType"),
    estimatedDays: readText(formData, "estimatedDays"),
    isActive: readText(formData, "isActive"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "implementation_template.updated",
    entityType: "implementation_template",
    entityId: readText(formData, "id") || null,
    metadata: { name: readText(formData, "name") },
  });

  revalidatePath("/console/templates");
  revalidatePath("/console/leads");
}

export async function addImplementationTemplateTaskAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await addImplementationTemplateTask({
    templateId: readText(formData, "templateId"),
    phase: readText(formData, "phase"),
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    dayOffset: readText(formData, "dayOffset"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "implementation_template_task.created",
    entityType: "implementation_template_task",
    metadata: { templateId: readText(formData, "templateId"), title: readText(formData, "title") },
  });

  revalidatePath("/console/templates");
}

export async function updateTemplateBriefDefaultsAction(formData: FormData) {
  const session = await requirePlatformAccess();

  await updateTemplateBriefDefaults({
    templateId: readText(formData, "templateId"),
    domainStrategy: readText(formData, "domainStrategy"),
    logoStatus: readText(formData, "logoStatus"),
    brandNotes: readText(formData, "brandNotes"),
    targetAudience: readText(formData, "targetAudience"),
    offerSummary: readText(formData, "offerSummary"),
    pricingNotes: readText(formData, "pricingNotes"),
    paymentProvider: readText(formData, "paymentProvider"),
    contentNotes: readText(formData, "contentNotes"),
    exerciseVideoNotes: readText(formData, "exerciseVideoNotes"),
    nutritionNotes: readText(formData, "nutritionNotes"),
    legalNotes: readText(formData, "legalNotes"),
    launchNotes: readText(formData, "launchNotes"),
    internalRisks: readText(formData, "internalRisks"),
  });
  await recordSecurityAuditEvent({
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "implementation_template_brief.updated",
    entityType: "implementation_template_brief_defaults",
    metadata: { templateId: readText(formData, "templateId") },
  });

  revalidatePath("/console/templates");
}
