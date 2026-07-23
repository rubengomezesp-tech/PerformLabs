"use server";

import { revalidatePath } from "next/cache";
import { getMemberContext } from "@/lib/auth/member-access";
import { localDateTimeToUtc } from "@/lib/domain/personal-training-schedule";
import { getManagedPersonalTrainingSession } from "@/lib/repositories/personal-training-sessions";
import { createMemberSessionChangeRequest } from "@/lib/repositories/session-change-requests";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestSessionChangeAction(formData: FormData) {
  const workspaceHint = readText(formData, "workspaceId");
  const sessionId = readText(formData, "sessionId");
  const timezone = readText(formData, "timezone");
  const requestedStartLocal = readText(formData, "requestedStartLocal");
  const context = await getMemberContext(workspaceHint);
  if (!context || context.workspaceId !== workspaceHint) throw new Error("Acceso de cliente no válido");

  const session = await getManagedPersonalTrainingSession(context.workspaceId, sessionId);
  if (!session || session.memberProfileId !== context.memberProfileId || session.status !== "scheduled") {
    throw new Error("Esta sesión ya no admite cambios");
  }
  if (new Date(session.startsAt).getTime() <= Date.now()) throw new Error("La sesión ya ha comenzado");

  const requestedStartsAt = localDateTimeToUtc(requestedStartLocal, timezone);
  if (new Date(requestedStartsAt).getTime() <= Date.now()) throw new Error("El nuevo horario debe estar en el futuro");
  const durationMs = new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime();
  const requestedEndsAt = new Date(new Date(requestedStartsAt).getTime() + durationMs).toISOString();

  await createMemberSessionChangeRequest({
    workspaceId: context.workspaceId,
    memberProfileId: context.memberProfileId,
    sessionId,
    requestedStartsAt,
    requestedEndsAt,
    timezone,
    message: readText(formData, "message"),
  });

  revalidatePath("/app/sessions");
  revalidatePath("/coach/sessions");
}
