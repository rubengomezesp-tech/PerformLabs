import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RG_EMAIL_LOGO_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/rg-lockup-horizontal-white-1024.png";
const RG_EMAIL_SIGNATURE_URL = "https://miembros.rubengomezcoaching.com/brand/rg-coach/ruben-gomez-signature-white-512.png";
const USER_PAGE_SIZE = 200;
const MAX_USER_PAGES = 10;
const ACCESSIBLE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type DeliveryFailure = {
  stage: "configuration" | "directory" | "membership" | "link" | "provider";
  code: string;
  status?: number;
};

export type TenantMagicLinkDelivery =
  | { handled: false }
  | { handled: true; status: "sent" | "suppressed" }
  | { handled: true; status: "failed"; failure: DeliveryFailure };

type RgCoachResendConfig = {
  apiKey: string;
  from: string;
};

function rgCoachResendConfig(workspaceId: string):
  | { targeted: false }
  | { targeted: true; config: RgCoachResendConfig | null; missing: string[] } {
  const configuredWorkspaceId = process.env.RG_COACH_MAGIC_LINK_WORKSPACE_ID?.trim() ?? "";
  if (!configuredWorkspaceId || configuredWorkspaceId !== workspaceId) {
    return { targeted: false };
  }

  const apiKey = process.env.RG_COACH_RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RG_COACH_RESEND_FROM?.trim() ?? "";
  const missing = [
    !apiKey ? "RG_COACH_RESEND_API_KEY" : null,
    !from ? "RG_COACH_RESEND_FROM" : null,
  ].filter(Boolean) as string[];

  return {
    targeted: true,
    config: missing.length ? null : { apiKey, from },
    missing,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailAddress(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

function brandedEmail(workspace: WorkspaceBrand, actionLink: string, intent: "access" | "invitation" = "access") {
  const isInvitation = intent === "invitation";
  const brandName = (workspace.appName || workspace.name || "Tu coach")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const safeBrandName = escapeHtml(brandName);
  const safeActionLink = escapeHtml(actionLink);
  const supportEmail = emailAddress(workspace.supportEmail);
  const supportBlock = supportEmail
    ? `¿Necesitas ayuda? <a href="mailto:${escapeHtml(supportEmail)}" style="color:#00d4ff;text-decoration:underline">Escribe directamente a Rubén</a>.`
    : "Si necesitas ayuda, responde a este correo.";

  const invitationSteps = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px">
                      <tr><td style="padding:10px 0;border-bottom:1px solid #1a263b"><span style="color:#00d4ff;font-weight:900;font-size:13px">1&nbsp;&nbsp;</span><span style="color:#d7deea;font-size:14px">Entra con tu enlace personal (un toque, sin contraseña)</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #1a263b"><span style="color:#00d4ff;font-weight:900;font-size:13px">2&nbsp;&nbsp;</span><span style="color:#d7deea;font-size:14px">Completa tu valoración inicial (3–5 minutos)</span></td></tr>
                      <tr><td style="padding:10px 0"><span style="color:#00d4ff;font-weight:900;font-size:13px">3&nbsp;&nbsp;</span><span style="color:#d7deea;font-size:14px">Rubén revisa tus respuestas y publica tu plan personalizado</span></td></tr>
                    </table>`;

  return {
    subject: isInvitation ? `Rubén Gómez te invita a ${brandName}` : `Tu acceso a ${brandName}`,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Tu acceso a ${safeBrandName}</title>
  <style>@media only screen and (max-width:620px){.rg-shell{padding:20px 10px!important}.rg-card{border-radius:18px!important}.rg-main{padding:32px 24px 28px!important}.rg-title{font-size:32px!important}.rg-metric{font-size:10px!important;letter-spacing:.4px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#eef2f8;color:#f8fafc;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Tu espacio RG está listo. Entra para ver tu plan de hoy.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef2f8" style="width:100%;background:#eef2f8">
    <tr>
      <td class="rg-shell" align="center" style="padding:42px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px">
          <tr>
            <td align="center" style="padding:0 0 14px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:2px">ACCESO PRIVADO · RG COACH</td>
          </tr>
          <tr>
            <td class="rg-card" bgcolor="#050914" style="background:#050914;border:1px solid #182338;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(5,9,20,.18)">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="68%" height="5" bgcolor="#2f6bff" style="height:5px;background:#2f6bff;font-size:0;line-height:0">&nbsp;</td>
                  <td width="32%" height="5" bgcolor="#00d4ff" style="height:5px;background:#00d4ff;font-size:0;line-height:0">&nbsp;</td>
                </tr>
                <tr>
                  <td class="rg-main" colspan="2" style="padding:40px 44px 34px">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td valign="middle">
                          <img src="${RG_EMAIL_LOGO_URL}" width="270" alt="Rubén Gómez Coaching" style="display:block;width:270px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none">
                          <div style="margin-top:10px;color:#ffffff;font-size:13px;font-weight:800;line-height:1.2">${safeBrandName}</div>
                          <div style="margin-top:4px;color:#7f8ca3;font-size:10px;font-weight:700;letter-spacing:1.5px">COACHING · MIAMI + ONLINE</div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top:38px;color:#00d4ff;font-size:11px;font-weight:800;letter-spacing:1.8px">${isInvitation ? "INVITACIÓN PERSONAL" : "TU ESPACIO DE CLIENTE"}</div>
                    <h1 class="rg-title" style="margin:10px 0 14px;color:#ffffff;font-size:38px;line-height:1.08;letter-spacing:-1.2px">${isInvitation ? "Tu coach te ha<br>invitado a su aula." : "Tu espacio<br>está listo."}</h1>
                    <p style="margin:0;color:#a9b4c7;font-size:16px;line-height:1.65">${isInvitation ? "Rubén te ha preparado un espacio privado con tu entrenamiento, tu nutrición y tu seguimiento. Así empieza:" : "Entra en tu app privada para ver tu entrenamiento, nutrición y seguimiento. Este acceso es personal y de un solo uso."}</p>${isInvitation ? invitationSteps : ""}

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px">
                      <tr>
                        <td bgcolor="#2f6bff" style="background:#2f6bff;border-radius:12px;mso-padding-alt:16px 24px">
                          <a href="${safeActionLink}" style="display:inline-block;padding:16px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:.3px">${isInvitation ? "ACEPTAR INVITACIÓN" : "ABRIR MI APP RG"}&nbsp;&nbsp;→</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;color:#69778f;font-size:11px;line-height:1.5">Enlace seguro · válido para un solo acceso</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px;border-top:1px solid #1a263b;border-bottom:1px solid #1a263b">
                      <tr>
                        <td class="rg-metric" align="left" style="padding:15px 0;color:#8e9bb0;font-size:11px;font-weight:800;letter-spacing:.8px">ENTRENAMIENTO</td>
                        <td class="rg-metric" align="center" style="padding:15px 5px;color:#8e9bb0;font-size:11px;font-weight:800;letter-spacing:.8px">NUTRICIÓN</td>
                        <td class="rg-metric" align="right" style="padding:15px 0;color:#8e9bb0;font-size:11px;font-weight:800;letter-spacing:.8px">PROGRESO</td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px">
                      <tr>
                        <td bgcolor="#0b1323" style="background:#0b1323;border-left:3px solid #00d4ff;border-radius:0 12px 12px 0;padding:18px 20px">
                          <div style="color:#00d4ff;font-size:10px;font-weight:800;letter-spacing:1.4px">UN MENSAJE DE RUBÉN</div>
                          <p style="margin:9px 0 0;color:#d7deea;font-size:14px;line-height:1.6">Aquí tienes todo lo que trabajamos, organizado para que sepas qué toca hoy. Nos vemos dentro.</p>
                          <img src="${RG_EMAIL_SIGNATURE_URL}" width="176" alt="Firma de Rubén Gómez" style="display:block;width:176px;max-width:55%;height:auto;margin-top:14px;border:0;outline:none;text-decoration:none">
                          <p style="margin:10px 0 0;color:#ffffff;font-size:13px;font-weight:700">Rubén Gómez · Tu coach</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" bgcolor="#080d19" style="background:#080d19;border-top:1px solid #182338;padding:22px 44px 26px">
                    <p style="margin:0;color:#758198;font-size:12px;line-height:1.6">${supportBlock}</p>
                    <p style="margin:8px 0 0;color:#536076;font-size:11px;line-height:1.5">Si no pediste este acceso, puedes ignorar este correo con tranquilidad.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 20px 0;color:#7b8799;font-size:11px;line-height:1.5">RG Coach · Entrenamiento personal en Miami y online<br><a href="https://rubengomezcoaching.com" style="color:#64748b;text-decoration:underline">rubengomezcoaching.com</a></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: isInvitation
      ? `${brandName}\n\nRubén Gómez te ha invitado a su aula privada.\n\n1. Entra con tu enlace personal: ${actionLink}\n2. Completa tu valoración inicial (3-5 minutos)\n3. Rubén revisa tus respuestas y publica tu plan personalizado\n\nEl enlace es personal y de un solo uso.\n\nRubén Gómez · Tu coach${supportEmail ? `\n\n¿Necesitas ayuda? ${supportEmail}` : ""}`
      : `${brandName}\n\nTu espacio está listo.\n\nEntra en tu app privada para ver tu entrenamiento, nutrición y seguimiento:\n${actionLink}\n\nEste enlace es personal y de un solo uso.\n\nAquí tienes todo lo que trabajamos, organizado para que sepas qué toca hoy. Nos vemos dentro.\nRubén Gómez · Tu coach${supportEmail ? `\n\n¿Necesitas ayuda? ${supportEmail}` : ""}\n\nSi no pediste este acceso, puedes ignorar este correo.`,
  };
}

function isExpectedMagicLink(actionLink: string, callbackUrl: string) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const link = new URL(actionLink);
    const types = link.searchParams.getAll("type");
    const redirects = link.searchParams.getAll("redirect_to");

    return link.origin === supabaseUrl.origin
      && link.pathname === "/auth/v1/verify"
      && types.length === 1
      && types[0] === "magiclink"
      && redirects.length === 1
      && redirects[0] === callbackUrl;
  } catch {
    return false;
  }
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  email: string,
): Promise<{ userId: string | null; error: { code: string; status?: number } | null }> {
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE });
    if (result.error) {
      return {
        userId: null,
        error: {
          code: result.error.code ?? "list_users_failed",
          status: result.error.status,
        },
      };
    }

    const users = result.data.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email);
    if (match) return { userId: match.id, error: null };
    if (users.length < USER_PAGE_SIZE) break;
  }

  return { userId: null, error: null };
}

/**
 * Delivers a magic link through RG Coach's isolated Resend account when the
 * resolved workspace matches the server-only workspace id. Other tenants are
 * explicitly left unhandled so their existing transport remains unchanged.
 */
export type TenantMagicLinkIntent = "access" | "invitation";

export async function sendTenantMagicLinkIfConfigured(input: {
  workspace: WorkspaceBrand;
  email: string;
  callbackUrl: string;
  /** "invitation" = primer contacto ("tu coach te ha invitado"); "access" = re-entrada. */
  intent?: TenantMagicLinkIntent;
}): Promise<TenantMagicLinkDelivery> {
  const configured = rgCoachResendConfig(input.workspace.id);
  if (!configured.targeted) return { handled: false };
  if (!configured.config) {
    return {
      handled: true,
      status: "failed",
      failure: { stage: "configuration", code: `missing:${configured.missing.join(",")}` },
    };
  }

  const supabase = createServiceSupabaseClient();
  const userLookup = await findAuthUserIdByEmail(supabase, input.email);
  if (userLookup.error) {
    return {
      handled: true,
      status: "failed",
      failure: { stage: "directory", ...userLookup.error },
    };
  }
  if (!userLookup.userId) return { handled: true, status: "suppressed" };

  const membership = await supabase
    .from("member_profiles")
    .select("id,subscription_status")
    .eq("workspace_id", input.workspace.id)
    .eq("user_id", userLookup.userId)
    .maybeSingle();
  if (membership.error) {
    return {
      handled: true,
      status: "failed",
      failure: { stage: "membership", code: membership.error.code ?? "membership_lookup_failed" },
    };
  }
  if (!membership.data || !ACCESSIBLE_SUBSCRIPTION_STATUSES.has(membership.data.subscription_status)) {
    return { handled: true, status: "suppressed" };
  }

  const generated = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: { redirectTo: input.callbackUrl },
  });
  if (generated.error) {
    if (generated.error.code === "user_not_found") {
      return { handled: true, status: "suppressed" };
    }
    return {
      handled: true,
      status: "failed",
      failure: {
        stage: "link",
        code: generated.error.code ?? "generate_link_failed",
        status: generated.error.status,
      },
    };
  }

  const actionLink = generated.data.properties?.action_link;
  if (!actionLink || !isExpectedMagicLink(actionLink, input.callbackUrl)) {
    return {
      handled: true,
      status: "failed",
      failure: { stage: "link", code: actionLink ? "invalid_action_link" : "missing_action_link" },
    };
  }

  const message = brandedEmail(input.workspace, actionLink, input.intent ?? "access");
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configured.config.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "rg-coach-member-auth/1.0",
      },
      body: JSON.stringify({
        from: configured.config.from,
        to: [input.email],
        reply_to: emailAddress(input.workspace.supportEmail) || undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
        tags: [{ name: "workspace", value: "rg-coach" }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return {
        handled: true,
        status: "failed",
        failure: { stage: "provider", code: "resend_rejected", status: response.status },
      };
    }
  } catch {
    return {
      handled: true,
      status: "failed",
      failure: { stage: "provider", code: "resend_unreachable" },
    };
  }

  return { handled: true, status: "sent" };
}
