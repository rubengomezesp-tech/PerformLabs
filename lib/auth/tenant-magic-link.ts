import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
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

function brandedEmail(workspace: WorkspaceBrand, actionLink: string) {
  const brandName = (workspace.appName || workspace.name || "Tu coach").trim().slice(0, 80);
  const safeBrandName = escapeHtml(brandName);
  const safeActionLink = escapeHtml(actionLink);
  const accentColor = /^#[0-9a-f]{6}$/i.test(workspace.accentColor) ? workspace.accentColor : "#078df2";
  const supportEmail = emailAddress(workspace.supportEmail);
  const supportLine = supportEmail
    ? `<p style="margin:24px 0 0;color:#64748b;font-size:13px">¿Necesitas ayuda? <a href="mailto:${escapeHtml(supportEmail)}" style="color:${accentColor}">${escapeHtml(supportEmail)}</a></p>`
    : "";

  return {
    subject: `Tu acceso a ${brandName}`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:36px"><p style="margin:0 0 12px;color:${accentColor};font-size:14px;font-weight:700">${safeBrandName}</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Tu enlace de acceso</h1><p style="margin:0 0 28px;color:#475569;line-height:1.6">Pulsa el botón para entrar de forma segura. Este enlace es personal y de un solo uso.</p><a href="${safeActionLink}" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px">Entrar en ${safeBrandName}</a><p style="margin:28px 0 0;color:#64748b;font-size:13px;line-height:1.5">Si no solicitaste este acceso, puedes ignorar este correo.</p>${supportLine}</div></div></body></html>`,
    text: `${brandName}\n\nTu enlace de acceso:\n${actionLink}\n\nEste enlace es personal y de un solo uso. Si no lo solicitaste, puedes ignorar este correo.${supportEmail ? `\n\nSoporte: ${supportEmail}` : ""}`,
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
export async function sendTenantMagicLinkIfConfigured(input: {
  workspace: WorkspaceBrand;
  email: string;
  callbackUrl: string;
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

  const message = brandedEmail(input.workspace, actionLink);
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
