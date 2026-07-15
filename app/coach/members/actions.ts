"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { assignPlansToMember, createManagedMember, listManagedMembers } from "@/lib/repositories/member-management";
import { adjustManagedMemberSessions } from "@/lib/repositories/session-credits";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCoachMemberAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const memberProfileId = await createManagedMember({
    workspaceId,
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    goal: readText(formData, "goal"),
    heightCm: readText(formData, "heightCm"),
    startingWeightKg: readText(formData, "startingWeightKg"),
    sex: readText(formData, "sex"),
    timezone: readText(formData, "timezone"),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.member.created",
    entityType: "member_profile",
    entityId: memberProfileId,
    metadata: { source: "coach_quick_start" },
  });

  revalidatePath("/coach/members");
  redirect(`/coach/members/${memberProfileId}/assessment?new=1`);
}

export async function assignCoachMemberPlansAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await assignPlansToMember({
    workspaceId,
    memberProfileId: readText(formData, "memberProfileId"),
    workoutTemplateId: readText(formData, "workoutTemplateId"),
    dietTemplateId: readText(formData, "dietTemplateId"),
    assignmentGoal: readText(formData, "assignmentGoal"),
    assignmentNotes: readText(formData, "assignmentNotes"),
    currentMonth: readText(formData, "currentMonth"),
    currentWeek: readText(formData, "currentWeek"),
    nextReviewOn: readText(formData, "nextReviewOn"),
    assignedBy: session.mode === "authenticated" ? session.user.id : null,
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "coach.member.plan_assigned",
    entityType: "member_profile",
    entityId: readText(formData, "memberProfileId") || null,
    metadata: {
      workoutTemplateId: readText(formData, "workoutTemplateId"),
      dietTemplateId: readText(formData, "dietTemplateId"),
    },
  });

  revalidatePath("/coach/members");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
}

export async function adjustCoachMemberSessionsAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const memberProfileId = readText(formData, "memberProfileId");
  const operation = readText(formData, "operation");
  const quantity = Number.parseInt(readText(formData, "quantity"), 10);
  const note = readText(formData, "note");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  if (!memberProfileId || operation !== "add" || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error("Ajuste de sesiones no válido");
  }

  const delta = quantity;
  const actorUserId = session.mode === "authenticated" ? session.user.id : null;
  const newBalance = await adjustManagedMemberSessions({
    workspaceId,
    memberProfileId,
    delta,
    note: note || "Abono manual del coach",
    actorUserId,
    eventType: "coach_credit",
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId,
    action: "coach.member.session_balance_adjusted",
    entityType: "member_profile",
    entityId: memberProfileId,
    metadata: { operation, quantity, delta, newBalance },
  });

  revalidatePath(`/coach/members/${memberProfileId}`);
  revalidatePath("/app");
  revalidatePath("/app/profile");
}

/**
 * Assign the same workout and/or diet template to several members at once.
 * Ids come from the bulk form (one hidden `memberProfileIds` per selected card);
 * they're intersected with the workspace's own member list before any write, so
 * a tampered form can't touch a member outside this coach's tenant.
 */
export async function bulkAssignCoachMemberPlansAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  const requestedIds = formData
    .getAll("memberProfileIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const workoutTemplateId = readText(formData, "workoutTemplateId");
  const dietTemplateId = readText(formData, "dietTemplateId");
  const assignmentGoal = readText(formData, "assignmentGoal");

  if (!requestedIds.length || (!workoutTemplateId && !dietTemplateId)) {
    return;
  }

  const members = await listManagedMembers(workspaceId);
  const ownIds = new Set(members.map((member) => member.id));
  const targetIds = requestedIds.filter((id) => ownIds.has(id));
  if (!targetIds.length) return;

  const assignedBy = session.mode === "authenticated" ? session.user.id : null;
  for (const memberProfileId of targetIds) {
    await assignPlansToMember({
      workspaceId,
      memberProfileId,
      workoutTemplateId,
      dietTemplateId,
      assignmentGoal,
      assignmentNotes: "",
      currentMonth: "1",
      currentWeek: "1",
      nextReviewOn: "",
      assignedBy,
    });
  }

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: assignedBy,
    action: "coach.member.plan_assigned_bulk",
    entityType: "member_profile",
    metadata: { count: targetIds.length, workoutTemplateId, dietTemplateId },
  });

  revalidatePath("/coach/members");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
}
