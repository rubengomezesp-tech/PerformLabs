"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { generateWorkoutPlanDraft, type PlanBrief } from "@/lib/ai/plan-generator";
import { getCoachBrain } from "@/lib/repositories/coach-brain";
import { approvePlanDraft, createWorkoutPlanDraft, discardPlanDraft } from "@/lib/repositories/coach-plan-drafts";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(formData: FormData, key: string, fallback: number) {
  const parsed = parseInt(readText(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function generatePlanDraftAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const brief: PlanBrief = {
    goal: readText(formData, "goal"),
    level: readText(formData, "level"),
    location: readText(formData, "location"),
    daysPerWeek: Math.max(1, Math.min(7, readInt(formData, "daysPerWeek", 4))),
    sessionMinutes: Math.max(20, Math.min(150, readInt(formData, "sessionMinutes", 60))),
    injuries: readText(formData, "injuries"),
    focusNotes: readText(formData, "focusNotes"),
  };

  const brand = await getWorkspaceBrand(workspaceId);
  const brain = await getCoachBrain(workspaceId);
  const result = await generateWorkoutPlanDraft({ brain, brandName: brand?.name ?? "tu marca", brief });

  if (!result.ok) {
    redirect(`/coach/ai/plans?error=${encodeURIComponent(result.error)}`);
  }

  await createWorkoutPlanDraft({ workspaceId, brief, plan: result.plan });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.ai_plan.generated",
    entityType: "coach_ai_plan_draft",
  });

  revalidatePath("/coach/ai/plans");
}

export async function approvePlanDraftAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const draftId = readText(formData, "draftId");

  const { templateId } = await approvePlanDraft(workspaceId, draftId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.ai_plan.approved",
    entityType: "workout_template",
    entityId: templateId,
  });

  revalidatePath("/coach/ai/plans");
  revalidatePath("/coach/programs");
}

export async function discardPlanDraftAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const draftId = readText(formData, "draftId");

  await discardPlanDraft(workspaceId, draftId);

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.ai_plan.discarded",
    entityType: "coach_ai_plan_draft",
    entityId: draftId,
  });

  revalidatePath("/coach/ai/plans");
}
