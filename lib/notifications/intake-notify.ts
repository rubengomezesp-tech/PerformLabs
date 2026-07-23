import { resolveCoachRecipient, sendCoachEmail, shouldSendCoachEmails } from "@/lib/notifications/coach-email";
import { fireMemberEventNotification } from "@/lib/notifications/events";
import { createMemberNotification } from "@/lib/repositories/member-notifications";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

const MEMBERS_URL = "https://miembros.rubengomezcoaching.com/coach/members";

export function buildIntakeEmailSubject(memberName: string, safetyFlags: number): string {
  const flag = safetyFlags > 0 ? ` · ⚠ ${safetyFlags} alerta${safetyFlags === 1 ? "" : "s"} de salud` : "";
  return `[Valoración] ${memberName} completó su cuestionario${flag}`;
}

/**
 * Aviso al coach cuando un cliente completa el intake: el siguiente paso del
 * bucle es SU valoración (coach_member_assessments) y la prescripción del plan.
 * Best-effort: nunca lanza ni bloquea el submit del quiz.
 */
export async function notifyCoachOfIntake(input: {
  workspaceId: string;
  memberName: string;
  safetyFlags: number;
}): Promise<void> {
  try {
    if (!shouldSendCoachEmails()) return;
    const recipient = await resolveCoachRecipient(input.workspaceId);
    if (!recipient) {
      console.error("notifyCoachOfIntake: sin destinatario configurado", input.workspaceId);
      return;
    }
    const name = input.memberName.trim() || "Un cliente";
    const subject = buildIntakeEmailSubject(name, input.safetyFlags);
    const text = [
      `${name} acaba de completar su cuestionario de valoración inicial.`,
      input.safetyFlags > 0
        ? `Atención: hay ${input.safetyFlags} respuesta(s) de seguridad marcadas — revísalas antes de activar el plan.`
        : "Sin alertas de seguridad marcadas.",
      "",
      `Siguiente paso: haz su valoración y prescribe el plan en ${MEMBERS_URL}`,
    ].join("\n");
    const html = `<!doctype html><html lang="es"><body style="margin:0;background:#eef2f8;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" style="max-width:560px;background:#050914;border:1px solid #1b2940;border-radius:18px;overflow:hidden"><tr><td style="height:4px;background:linear-gradient(90deg,#2f6bff,#00d4ff)"></td></tr><tr><td style="padding:30px 34px"><p style="margin:0;color:#00d4ff;font-size:11px;font-weight:900;letter-spacing:1.4px">VALORACIÓN COMPLETADA</p><h1 style="margin:8px 0 0;color:#fff;font-size:26px">${name.replaceAll("<", "&lt;")}</h1><p style="margin:14px 0 0;color:#c9d4e5;font-size:14px">${input.safetyFlags > 0 ? `⚠ ${input.safetyFlags} respuesta(s) de seguridad marcadas — revísalas antes de activar el plan.` : "Sin alertas de seguridad marcadas."}</p><a href="${MEMBERS_URL}" style="display:inline-block;margin-top:22px;padding:13px 19px;border-radius:10px;background:#2f6bff;color:#fff;text-decoration:none;font-weight:900">HACER SU VALORACIÓN →</a></td></tr></table></td></tr></table></body></html>`;
    const result = await sendCoachEmail({ to: recipient, subject, html, text, messageType: "coach_intake_completed" });
    if (!result.ok) console.error("notifyCoachOfIntake: envío fallido", input.workspaceId, result.error);
  } catch (error) {
    console.error("notifyCoachOfIntake failed", (error as Error).message);
  }
}

/**
 * "Tu plan está listo" — el momento más importante del día 0-3: cierra el aire
 * muerto entre completar el intake y ver el plan publicado. Fila en la bandeja
 * (canal día-1 en nativo) + push si el miembro lo permite. Nunca lanza.
 */
export async function notifyMemberOfPlanPublished(input: {
  workspaceId: string;
  memberProfileId: string;
}): Promise<void> {
  try {
    if (!getSupabaseServiceEnv().ok || !input.workspaceId || !input.memberProfileId) return;
    const supabase = createServiceSupabaseClient();
    const { data: prefs } = await supabase
      .from("member_notification_preferences")
      .select("coach_changes,quiet_mode")
      .eq("member_profile_id", input.memberProfileId)
      .maybeSingle();
    if (!(prefs?.coach_changes ?? true)) return;

    await createMemberNotification({
      workspaceId: input.workspaceId,
      memberProfileId: input.memberProfileId,
      kind: "plan_published",
      title: "¡Tu plan está listo!",
      body: "Tu coach ha publicado tu plan. Empieza por la ruta de hoy y envía tu punto de partida.",
      url: "/app",
    });

    if (!(prefs?.quiet_mode ?? false)) {
      await fireMemberEventNotification({
        workspaceId: input.workspaceId,
        memberProfileId: input.memberProfileId,
        eventKey: "plan.published",
      });
    }
  } catch (error) {
    console.error("notifyMemberOfPlanPublished failed", input.memberProfileId, (error as Error).message);
  }
}
