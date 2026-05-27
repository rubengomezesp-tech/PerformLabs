"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { assignPlansToMember, createManagedMember } from "@/lib/repositories/member-management";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createMemberAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await createManagedMember({
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
    action: "member.created",
    entityType: "member_profile",
    metadata: { fullName: readText(formData, "fullName"), email: readText(formData, "email") },
  });

  revalidatePath("/console/members");
}

export async function assignMemberPlansAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const session = await requireWorkspaceMutationAccess(workspaceId);

  await assignPlansToMember({
    workspaceId,
    memberProfileId: readText(formData, "memberProfileId"),
    workoutTemplateId: readText(formData, "workoutTemplateId"),
    dietTemplateId: readText(formData, "dietTemplateId"),
  });
  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: session.mode === "authenticated" ? session.user.id : null,
    action: "member.plan_assigned",
    entityType: "member_profile",
    entityId: readText(formData, "memberProfileId") || null,
    metadata: {
      workoutTemplateId: readText(formData, "workoutTemplateId"),
      dietTemplateId: readText(formData, "dietTemplateId"),
    },
  });

  revalidatePath("/console/members");
  revalidatePath("/app/workouts");
  revalidatePath("/app/meals");
}
