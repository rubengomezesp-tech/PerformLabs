import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { resolveCoachRecipient, sendCoachEmail, shouldSendCoachEmails } from "@/lib/notifications/coach-email";
import { fireMemberEventNotification } from "@/lib/notifications/events";
import { createMemberNotification } from "@/lib/repositories/member-notifications";

const CHECKINS_URL = "https://miembros.rubengomezcoaching.com/coach/checkins";

export type CheckinEmailFacts = {
  memberName: string;
  weightKg: number | null;
  weightDeltaKg: number | null;
  photoCount: number;
  trainingAdherence: string;
  nutritionAdherence: string;
  notes: string;
  checkinId: string;
};

/**
 * Asunto con triage: la decisión de abrir o no se toma en el inbox, así que el
 * asunto lleva nombre + delta de peso + fotos. Primer check-in = sin delta.
 */
export function buildCheckinEmailSubject(facts: CheckinEmailFacts): string {
  const details: string[] = [];
  if (facts.weightKg !== null) {
    const delta = facts.weightDeltaKg !== null
      ? ` (${facts.weightDeltaKg > 0 ? "+" : ""}${facts.weightDeltaKg.toFixed(1)})`
      : " · primer registro";
    details.push(`${facts.weightKg.toFixed(1)}kg${delta}`);
  }
  if (facts.photoCount > 0) details.push(`${facts.photoCount} foto${facts.photoCount === 1 ? "" : "s"}`);
  return details.length ? `[Check-in] ${facts.memberName} — ${details.join(" · ")}` : `[Check-in] ${facts.memberName}`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function buildCheckinEmailBody(facts: CheckinEmailFacts): { html: string; text: string } {
  const deepLink = `${CHECKINS_URL}#checkin-${facts.checkinId}`;
  const rows: Array<[string, string]> = [
    ["Peso", facts.weightKg !== null ? `${facts.weightKg.toFixed(1)} kg${facts.weightDeltaKg !== null ? ` (${facts.weightDeltaKg > 0 ? "+" : ""}${facts.weightDeltaKg.toFixed(1)} vs anterior)` : " · primer registro"}` : "Sin dato"],
    ["Adherencia entreno", facts.trainingAdherence || "Sin dato"],
    ["Adherencia nutrición", facts.nutritionAdherence || "Sin dato"],
    ["Fotos", facts.photoCount ? `${facts.photoCount}` : "No"],
  ];
  const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:8px 0;color:#718099;font-size:12px">${escapeHtml(label)}</td><td style="padding:8px 0;color:#fff;font-weight:700;text-align:right">${escapeHtml(value)}</td></tr>`).join("");
  const notesBlock = facts.notes
    ? `<p style="margin:16px 0 0;padding:12px;border:1px solid #1b2940;border-radius:10px;color:#c9d4e5;font-size:13px">${escapeHtml(facts.notes)}</p>`
    : "";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#eef2f8;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" style="max-width:560px;background:#050914;border:1px solid #1b2940;border-radius:18px;overflow:hidden"><tr><td style="height:4px;background:linear-gradient(90deg,#2f6bff,#00d4ff)"></td></tr><tr><td style="padding:30px 34px"><p style="margin:0;color:#00d4ff;font-size:11px;font-weight:900;letter-spacing:1.4px">NUEVO CHECK-IN</p><h1 style="margin:8px 0 0;color:#fff;font-size:26px">${escapeHtml(facts.memberName)}</h1><table role="presentation" width="100%" style="margin-top:18px;border-collapse:collapse">${htmlRows}</table>${notesBlock}<a href="${deepLink}" style="display:inline-block;margin-top:22px;padding:13px 19px;border-radius:10px;background:#2f6bff;color:#fff;text-decoration:none;font-weight:900">REVISAR CHECK-IN →</a></td></tr></table></td></tr></table></body></html>`;
  const text = [
    `Nuevo check-in de ${facts.memberName}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(facts.notes ? ["", facts.notes] : []),
    "",
    deepLink,
  ].join("\n");
  return { html, text };
}

/**
 * Email inmediato al coach al llegar un check-in. Nunca lanza (el guardado del
 * check-in jamás depende de esto); cada intento queda en el ledger
 * coach_checkin_email_deliveries para reintento/backfill y conteo de fallos.
 * Se invoca desde after() en la server action.
 */
export async function notifyCoachOfCheckin(input: {
  workspaceId: string;
  memberProfileId: string;
  checkinId: string;
}): Promise<void> {
  try {
    if (!getSupabaseServiceEnv().ok) return;
    const supabase = createServiceSupabaseClient();

    const recipient = await resolveCoachRecipient(input.workspaceId);
    const ledger = async (status: string, extra: Record<string, unknown> = {}) => {
      await supabase.from("coach_checkin_email_deliveries").upsert({
        workspace_id: input.workspaceId,
        checkin_id: input.checkinId,
        recipient_email: recipient ?? "",
        status,
        updated_at: new Date().toISOString(),
        ...extra,
      }, { onConflict: "checkin_id" });
    };

    if (!shouldSendCoachEmails()) {
      await ledger("skipped", { error_code: "non_production_env" });
      return;
    }
    if (!recipient) {
      await ledger("failed", { error_code: "recipient_not_configured" });
      console.error("notifyCoachOfCheckin: sin destinatario configurado", input.workspaceId);
      return;
    }

    // Datos del check-in + delta vs el anterior con peso del mismo miembro.
    const { data: current } = await supabase
      .from("customer_checkins")
      .select("key_values, submitted_at, member_profiles(full_name)")
      .eq("id", input.checkinId)
      .maybeSingle();
    const keyValues = (current?.key_values && typeof current.key_values === "object" && !Array.isArray(current.key_values))
      ? current.key_values as Record<string, unknown>
      : {};
    const weightKg = typeof keyValues.weightKg === "number" ? keyValues.weightKg : null;

    let weightDeltaKg: number | null = null;
    if (weightKg !== null && current?.submitted_at) {
      const { data: previous } = await supabase
        .from("customer_checkins")
        .select("key_values")
        .eq("member_profile_id", input.memberProfileId)
        .lt("submitted_at", current.submitted_at)
        .order("submitted_at", { ascending: false })
        .limit(10);
      for (const row of previous ?? []) {
        const values = (row.key_values && typeof row.key_values === "object" && !Array.isArray(row.key_values))
          ? row.key_values as Record<string, unknown>
          : {};
        if (typeof values.weightKg === "number") {
          weightDeltaKg = weightKg - values.weightKg;
          break;
        }
      }
    }

    const photoPaths = Array.isArray(keyValues.photoPaths) ? keyValues.photoPaths : [];
    const memberName = (current as { member_profiles?: { full_name?: string | null } | null } | null)?.member_profiles?.full_name ?? "Cliente";
    const facts: CheckinEmailFacts = {
      memberName,
      weightKg,
      weightDeltaKg,
      photoCount: photoPaths.length,
      trainingAdherence: typeof keyValues.trainingAdherence === "string" ? keyValues.trainingAdherence : "",
      nutritionAdherence: typeof keyValues.nutritionAdherence === "string" ? keyValues.nutritionAdherence : "",
      notes: typeof keyValues.notes === "string" ? keyValues.notes : "",
      checkinId: input.checkinId,
    };

    const body = buildCheckinEmailBody(facts);
    const result = await sendCoachEmail({
      to: recipient,
      subject: buildCheckinEmailSubject(facts),
      html: body.html,
      text: body.text,
      messageType: "coach_checkin_immediate",
    });

    if (result.ok) await ledger("sent", { provider_message_id: result.id });
    else {
      await ledger("failed", { error_code: result.error });
      console.error("notifyCoachOfCheckin: envío fallido", input.checkinId, result.error);
    }
  } catch (error) {
    console.error("notifyCoachOfCheckin failed", input.checkinId, (error as Error).message);
  }
}

/**
 * Cierra el bucle hacia el cliente cuando el coach revisa su check-in: fila en
 * la bandeja (canal día-1 en nativo, fallback web) + web-push si el miembro lo
 * permite. Respeta member_notification_preferences (coach_changes, quiet_mode).
 * Best-effort: nunca lanza — la revisión del coach jamás depende de esto.
 */
export async function notifyMemberOfCheckinReview(input: {
  workspaceId: string;
  memberProfileId: string;
  coachFeedback: string;
}): Promise<void> {
  try {
    if (!getSupabaseServiceEnv().ok || !input.workspaceId || !input.memberProfileId) return;
    const supabase = createServiceSupabaseClient();

    const { data: prefs } = await supabase
      .from("member_notification_preferences")
      .select("coach_changes,quiet_mode")
      .eq("member_profile_id", input.memberProfileId)
      .maybeSingle();
    const coachChanges = prefs?.coach_changes ?? true;
    const quietMode = prefs?.quiet_mode ?? false;
    if (!coachChanges) return;

    const feedback = input.coachFeedback.trim();
    await createMemberNotification({
      workspaceId: input.workspaceId,
      memberProfileId: input.memberProfileId,
      kind: "checkin_reviewed",
      title: "Tu coach revisó tu check-in",
      body: feedback ? feedback.slice(0, 240) : "Tienes feedback nuevo de tu coach.",
      url: "/app/progress?tab=historial",
    });

    if (!quietMode) {
      await fireMemberEventNotification({
        workspaceId: input.workspaceId,
        memberProfileId: input.memberProfileId,
        eventKey: "checkin.reviewed",
      });
    }
  } catch (error) {
    console.error("notifyMemberOfCheckinReview failed", input.memberProfileId, (error as Error).message);
  }
}
