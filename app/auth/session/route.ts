import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consoleRoles } from "@/lib/auth/role-access";
import { authAccessCookie, authRefreshCookie } from "@/lib/auth/session";
import { acceptPendingTeamInvitationsForUser, recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

function explicitNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }
  return value;
}

/** A trainer's own subdomain/custom domain — i.e. a member-facing host. */
function isTenantHost(host: string): boolean {
  const value = host.split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!value || value === "performlabs.app" || value === "localhost" || value === "127.0.0.1") return false;
  return !value.endsWith(".vercel.app");
}

/**
 * Where to land after a magic link. Priority:
 * 1. An explicit, valid `next` (e.g. ?next=/app).
 * 2. On a trainer's domain (member host) → always the member app, even for the
 *    owner testing it (a tenant domain is for members, never the console).
 * 3. On the platform apex → by role: member-only → app, staff → console.
 */
async function destinationForUser(userId: string, explicit: string | null, host: string) {
  if (explicit) return explicit;
  if (isTenantHost(host)) return "/app";
  if (!getSupabaseServiceEnv().ok) return "/console/security";
  const supabase = createServiceSupabaseClient();
  const [memberships, profile] = await Promise.all([
    supabase.from("workspace_memberships").select("id").eq("user_id", userId).in("role", consoleRoles).limit(1),
    supabase.from("member_profiles").select("id").eq("user_id", userId).limit(1),
  ]);
  const hasConsole = (memberships.data?.length ?? 0) > 0;
  const isMember = (profile.data?.length ?? 0) > 0;
  return !hasConsole && isMember ? "/app" : "/console/security";
}

function hashSensitiveValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function emailDomain(email: string) {
  return email.includes("@") ? email.split("@").pop() || "unknown" : "unknown";
}

export async function POST(request: Request) {
  // Form-encoded POST (a real navigation) so the browser reliably applies the
  // Set-Cookie on the redirect response before requesting the destination.
  const form = await request.formData().catch(() => null);
  const field = (key: string) => {
    const value = form?.get(key);
    return typeof value === "string" ? value : "";
  };
  const accessToken = field("accessToken");
  const refreshToken = field("refreshToken");
  const expiresInRaw = Number.parseInt(field("expiresIn"), 10);
  const expiresIn = Number.isFinite(expiresInRaw) && expiresInRaw > 0 ? expiresInRaw : 60 * 60;
  const explicitNext = explicitNextPath(field("next"));

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, origin), 303);

  if (!accessToken || !refreshToken) {
    return redirectTo("/acceso?error=" + encodeURIComponent("No se pudo activar la sesión."));
  }

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return redirectTo("/acceso?error=" + encodeURIComponent("Configuración incompleta."));
  }

  const supabase = createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.id) {
    return redirectTo("/acceso?error=" + encodeURIComponent("La sesión no es válida o ha expirado."));
  }

  const email = data.user.email?.toLowerCase() ?? "";
  if (email) {
    await acceptPendingTeamInvitationsForUser({ userId: data.user.id, email });
  }

  await recordSecurityAuditEvent({
    actorUserId: data.user.id,
    action: "auth.session_activated",
    entityType: "auth",
    metadata: {
      email_domain: emailDomain(email),
      email_hash: hashSensitiveValue(email || data.user.id),
    },
  });

  const nextPath = await destinationForUser(data.user.id, explicitNext, host);
  const response = redirectTo(nextPath);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(authAccessCookie, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: expiresIn,
  });
  response.cookies.set(authRefreshCookie, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
