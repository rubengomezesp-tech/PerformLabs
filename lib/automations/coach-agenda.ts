import type { SupabaseClient } from "@supabase/supabase-js";
import { localDateTimeToUtc } from "@/lib/domain/personal-training-schedule";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RG_LOGO_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png";

type AutomationConfig = {
  workspace_id: string;
  timezone: string;
  delivery_hour: number;
  recipient_email: string;
  workspaces: { name: string; app_name: string } | null;
};

type AgendaSession = {
  id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location: string | null;
  member_profiles: { full_name: string } | null;
};

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + days));
  return next.toISOString().slice(0, 10);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function agendaEmail(input: { localDate: string; timezone: string; sessions: AgendaSession[]; pendingChanges: number }) {
  const dateLabel = new Intl.DateTimeFormat("es-ES", { timeZone: input.timezone, weekday: "long", day: "numeric", month: "long" }).format(new Date(`${input.localDate}T12:00:00Z`));
  const sessionRows = input.sessions.length ? input.sessions.map((session) => {
    const time = new Intl.DateTimeFormat("es-ES", { timeZone: input.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(session.starts_at));
    return `<tr><td style="padding:13px 0;border-bottom:1px solid #1b2940;color:#00d4ff;font-weight:800">${escapeHtml(time)}</td><td style="padding:13px 12px;border-bottom:1px solid #1b2940;color:#fff;font-weight:700">${escapeHtml(session.member_profiles?.full_name ?? "Cliente")}</td><td style="padding:13px 0;border-bottom:1px solid #1b2940;color:#9cabc1;text-align:right">${escapeHtml(session.location ?? "Lugar pendiente")}</td></tr>`;
  }).join("") : `<tr><td style="padding:22px 0;color:#9cabc1">No hay entrenamientos confirmados para mañana.</td></tr>`;
  const dashboardUrl = "https://miembros.rubengomezcoaching.com/coach/sessions";
  const subject = input.sessions.length
    ? `Agenda RG de mañana · ${input.sessions.length} entrenamiento${input.sessions.length === 1 ? "" : "s"}`
    : "Agenda RG de mañana · sin entrenamientos";
  const textLines = input.sessions.map((session) => {
    const time = new Intl.DateTimeFormat("es-ES", { timeZone: input.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(session.starts_at));
    return `${time} · ${session.member_profiles?.full_name ?? "Cliente"} · ${session.location ?? "Lugar pendiente"}`;
  });
  return {
    subject,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#eef2f8;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:38px 14px"><table role="presentation" width="100%" style="max-width:620px;background:#050914;border:1px solid #1b2940;border-radius:22px;overflow:hidden"><tr><td style="height:5px;background:linear-gradient(90deg,#2f6bff,#00d4ff)"></td></tr><tr><td style="padding:36px 40px"><img src="${RG_LOGO_URL}" width="250" alt="RG Coach" style="max-width:100%;height:auto"><p style="margin:30px 0 8px;color:#00d4ff;font-size:11px;font-weight:800;letter-spacing:1.5px">RESUMEN AUTOMÁTICO · 22:00</p><h1 style="margin:0;color:#fff;font-size:34px">Tu agenda de mañana.</h1><p style="color:#9cabc1;font-size:15px;text-transform:capitalize">${escapeHtml(dateLabel)}</p><table role="presentation" width="100%" style="margin-top:22px;border-collapse:collapse">${sessionRows}</table>${input.pendingChanges ? `<p style="margin:24px 0 0;padding:15px;border:1px solid #38537a;border-radius:12px;background:#0e1b30;color:#dbe8ff"><strong style="color:#78a8ff">${input.pendingChanges} solicitud${input.pendingChanges === 1 ? "" : "es"} de cambio pendiente${input.pendingChanges === 1 ? "" : "s"}</strong><br><span style="font-size:13px;color:#9cabc1">Revísala antes de cerrar el día.</span></p>` : ""}<a href="${dashboardUrl}" style="display:inline-block;margin-top:26px;padding:14px 20px;border-radius:11px;background:#2f6bff;color:#fff;text-decoration:none;font-weight:800">ABRIR AGENDA →</a><p style="margin:30px 0 0;color:#64748b;font-size:11px;line-height:1.5">Envío automático de RG Coach. Se genera una sola vez cada día a las 22:00, hora de Miami.</p></td></tr></table></td></tr></table></body></html>`,
    text: [`Agenda RG · ${dateLabel}`, "", ...(textLines.length ? textLines : ["Sin entrenamientos confirmados."]), "", `${input.pendingChanges} solicitudes de cambio pendientes.`, dashboardUrl].join("\n"),
  };
}

async function sendDigest(input: { to: string; localDate: string; timezone: string; sessions: AgendaSession[]; pendingChanges: number }) {
  const apiKey = process.env.RG_COACH_RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RG_COACH_RESEND_FROM?.trim() ?? "";
  if (!apiKey || !from) return { ok: false as const, error: "email_not_configured" };
  const message = agendaEmail(input);
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "rg-coach-agenda-automation/1.0" },
      body: JSON.stringify({ from, to: [input.to], subject: message.subject, html: message.html, text: message.text, tags: [{ name: "workspace", value: "rg-coach" }, { name: "message_type", value: "coach_agenda_digest" }] }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false as const, error: `provider_${response.status}` };
    const data = await response.json() as { id?: string };
    return { ok: true as const, id: data.id ?? null };
  } catch {
    return { ok: false as const, error: "provider_unreachable" };
  }
}

export type CoachAgendaAutomationResult = { ok: boolean; checked: number; due: number; sent: number; failed: number };

export async function runCoachAgendaAutomations(now = new Date()): Promise<CoachAgendaAutomationResult> {
  const db: SupabaseClient = createServiceSupabaseClient();
  const configResult = await db.from("coach_agenda_automation_configs").select("workspace_id,timezone,delivery_hour,recipient_email,workspaces(name,app_name)").eq("enabled", true);
  if (configResult.error) throw new Error(`Unable to load coach agenda automation configs: ${configResult.error.message}`);
  const configs = (configResult.data ?? []) as unknown as AutomationConfig[];
  const result: CoachAgendaAutomationResult = { ok: true, checked: configs.length, due: 0, sent: 0, failed: 0 };

  for (const config of configs) {
    const parts = zonedParts(now, config.timezone);
    if (Number(parts.hour) !== config.delivery_hour) continue;
    result.due += 1;
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    const claim = await db.rpc("claim_coach_agenda_digest", { p_workspace_id: config.workspace_id, p_local_date: localDate });
    if (claim.error) throw new Error(`Unable to claim coach agenda digest: ${claim.error.message}`);
    const deliveryId = claim.data as string | null;
    if (!deliveryId) continue;

    const tomorrow = addCalendarDays(localDate, 1);
    const dayAfter = addCalendarDays(localDate, 2);
    const from = localDateTimeToUtc(`${tomorrow}T00:00`, config.timezone);
    const to = localDateTimeToUtc(`${dayAfter}T00:00`, config.timezone);
    const [sessionsResult, changesResult] = await Promise.all([
      db.from("personal_training_sessions").select("id,starts_at,ends_at,timezone,location,member_profiles(full_name)").eq("workspace_id", config.workspace_id).eq("status", "scheduled").gte("starts_at", from).lt("starts_at", to).order("starts_at", { ascending: true }),
      db.from("personal_training_session_change_requests").select("id", { count: "exact", head: true }).eq("workspace_id", config.workspace_id).eq("status", "pending"),
    ]);
    if (sessionsResult.error || changesResult.error) {
      await db.from("coach_agenda_digest_deliveries").update({ status: "failed", error_code: "agenda_query_failed", updated_at: new Date().toISOString() }).eq("id", deliveryId);
      result.failed += 1;
      continue;
    }
    const sessions = (sessionsResult.data ?? []) as unknown as AgendaSession[];
    const pendingChanges = changesResult.count ?? 0;
    const delivery = await sendDigest({ to: config.recipient_email, localDate: tomorrow, timezone: config.timezone, sessions, pendingChanges });
    await db.from("coach_agenda_digest_deliveries").update(delivery.ok ? {
      status: "sent", sent_at: new Date().toISOString(), provider_message_id: delivery.id, session_count: sessions.length, pending_change_count: pendingChanges, updated_at: new Date().toISOString(),
    } : {
      status: "failed", error_code: delivery.error, session_count: sessions.length, pending_change_count: pendingChanges, updated_at: new Date().toISOString(),
    }).eq("id", deliveryId);
    if (delivery.ok) result.sent += 1;
    else result.failed += 1;
  }

  result.ok = result.failed === 0;
  return result;
}
