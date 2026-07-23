import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type CoachEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

/**
 * Los preview deployments de Vercel comparten env vars con producción: sin este
 * gate, un QA en preview enviaría emails al coach real. Local (VERCEL_ENV
 * ausente) se permite — las claves de Resend normalmente solo existen en Vercel.
 */
export function shouldSendCoachEmails(env: Record<string, string | undefined> = process.env): boolean {
  const vercelEnv = env.VERCEL_ENV?.trim();
  if (!vercelEnv) return true;
  return vercelEnv === "production";
}

/**
 * Destinatario del email inmediato al coach: la misma fuente que el digest
 * nocturno (coach_agenda_automation_configs), con fallback a env var para
 * workspaces sin automatización configurada.
 */
export async function resolveCoachRecipient(workspaceId: string): Promise<string | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("coach_agenda_automation_configs")
    .select("recipient_email")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const configured = typeof data?.recipient_email === "string" ? data.recipient_email.trim() : "";
  if (configured) return configured;
  const fallback = process.env.RG_COACH_NOTIFY_EMAIL?.trim() ?? "";
  return fallback || null;
}

/**
 * Transporte Resend compartido (extraído del digest de agenda). Nunca lanza:
 * devuelve un resultado tipado para que el llamador lo registre en su ledger.
 */
export async function sendCoachEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  messageType: string;
}): Promise<CoachEmailResult> {
  const apiKey = process.env.RG_COACH_RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RG_COACH_RESEND_FROM?.trim() ?? "";
  if (!apiKey || !from) return { ok: false, error: "email_not_configured" };
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "rg-coach-notifications/1.0" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: [{ name: "workspace", value: "rg-coach" }, { name: "message_type", value: input.messageType }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, error: `provider_${response.status}` };
    const data = await response.json() as { id?: string };
    return { ok: true, id: data.id ?? null };
  } catch {
    return { ok: false, error: "provider_unreachable" };
  }
}
