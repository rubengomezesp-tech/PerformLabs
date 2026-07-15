"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { localDateTimeToUtc, sessionDurationEnd, type PersonalTrainingStatus } from "@/lib/domain/personal-training-schedule";
import {
  getManagedPersonalTrainingSession,
  rescheduleManagedPersonalTrainingSession,
  scheduleManagedPersonalTrainingSession,
  transitionManagedPersonalTrainingSession,
} from "@/lib/repositories/personal-training-sessions";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function actorId(session: Awaited<ReturnType<typeof requireWorkspaceMutationAccess>>) {
  return session.mode === "authenticated" ? session.user.id : null;
}

function refreshSessionViews(memberProfileId?: string) {
  revalidatePath("/coach/sessions");
  revalidatePath("/coach");
  if (memberProfileId) revalidatePath(`/coach/members/${memberProfileId}`);
  revalidatePath("/app");
  revalidatePath("/app/sessions");
  revalidatePath("/app/profile");
}

export async function schedulePersonalTrainingSessionAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const memberProfileId = readText(formData, "memberProfileId");
  const timezone = readText(formData, "timezone");
  const startLocal = readText(formData, "startLocal");
  const durationMinutes = Number.parseInt(readText(formData, "durationMinutes"), 10);
  const cancellationWindowHours = Number.parseInt(readText(formData, "cancellationWindowHours"), 10);
  const session = await requireWorkspaceMutationAccess(workspaceId);

  if (!memberProfileId || !Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) {
    throw new Error("Duración o cliente no válidos");
  }
  if (!Number.isInteger(cancellationWindowHours) || cancellationWindowHours < 0 || cancellationWindowHours > 168) {
    throw new Error("Política de cancelación no válida");
  }

  const startsAt = localDateTimeToUtc(startLocal, timezone);
  const endsAt = sessionDurationEnd(startLocal, durationMinutes, timezone);
  const result = await scheduleManagedPersonalTrainingSession({
    workspaceId,
    memberProfileId,
    startsAt,
    endsAt,
    timezone,
    location: readText(formData, "location"),
    memberNotes: readText(formData, "memberNotes"),
    cancellationWindowHours,
    actorUserId: actorId(session),
    eventId: readText(formData, "eventId") || crypto.randomUUID(),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: actorId(session),
    action: "coach.personal_training_session.scheduled",
    entityType: "personal_training_session",
    entityId: result.sessionId,
    metadata: { memberProfileId, startsAt, endsAt, available: result.available },
  });
  refreshSessionViews(memberProfileId);
}

export async function resolvePersonalTrainingSessionAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const sessionId = readText(formData, "sessionId");
  const resolution = readText(formData, "resolution");
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const appointment = await getManagedPersonalTrainingSession(workspaceId, sessionId);
  if (!appointment || appointment.status !== "scheduled") throw new Error("La sesión ya no está pendiente");

  let nextStatus: Exclude<PersonalTrainingStatus, "scheduled">;
  if (resolution === "completed") {
    if (Date.now() < new Date(appointment.startsAt).getTime()) throw new Error("No puedes completar una sesión antes de que comience");
    nextStatus = "completed";
  } else if (resolution === "no_show") {
    if (Date.now() < new Date(appointment.startsAt).getTime()) throw new Error("No puedes marcar un no-show antes de la cita");
    nextStatus = "no_show";
  } else if (resolution === "cancel_policy") {
    const cutoff = new Date(appointment.startsAt).getTime() - appointment.cancellationWindowHours * 3_600_000;
    nextStatus = Date.now() <= cutoff ? "cancelled_on_time" : "cancelled_late";
  } else {
    throw new Error("Resolución de sesión no válida");
  }

  const result = await transitionManagedPersonalTrainingSession({
    workspaceId,
    sessionId,
    status: nextStatus,
    note: readText(formData, "note"),
    actorUserId: actorId(session),
    eventId: readText(formData, "eventId") || crypto.randomUUID(),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: actorId(session),
    action: `coach.personal_training_session.${nextStatus}`,
    entityType: "personal_training_session",
    entityId: sessionId,
    metadata: { memberProfileId: appointment.memberProfileId, balance: result.balance, available: result.available, changed: result.changed ?? true },
  });
  refreshSessionViews(appointment.memberProfileId);
}

export async function reschedulePersonalTrainingSessionAction(formData: FormData) {
  const workspaceId = readText(formData, "workspaceId");
  const sessionId = readText(formData, "sessionId");
  const timezone = readText(formData, "timezone");
  const startLocal = readText(formData, "startLocal");
  const durationMinutes = Number.parseInt(readText(formData, "durationMinutes"), 10);
  const session = await requireWorkspaceMutationAccess(workspaceId);
  const appointment = await getManagedPersonalTrainingSession(workspaceId, sessionId);
  if (!appointment || appointment.status !== "scheduled") throw new Error("Solo puedes mover una sesión pendiente");
  if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) throw new Error("Duración no válida");

  const startsAt = localDateTimeToUtc(startLocal, timezone);
  const endsAt = sessionDurationEnd(startLocal, durationMinutes, timezone);
  await rescheduleManagedPersonalTrainingSession({
    workspaceId,
    sessionId,
    startsAt,
    endsAt,
    timezone,
    location: readText(formData, "location"),
    memberNotes: readText(formData, "memberNotes"),
    actorUserId: actorId(session),
    eventId: readText(formData, "eventId") || crypto.randomUUID(),
  });

  await recordSecurityAuditEvent({
    workspaceId,
    actorUserId: actorId(session),
    action: "coach.personal_training_session.rescheduled",
    entityType: "personal_training_session",
    entityId: sessionId,
    metadata: { memberProfileId: appointment.memberProfileId, startsAt, endsAt },
  });
  refreshSessionViews(appointment.memberProfileId);
}
