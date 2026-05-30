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

/**
 * When the magic link carries no explicit destination (common — the redirect
 * query can be dropped), pick where to land by role: a member-only user goes to
 * their app, everyone else to the console. Avoids members landing in /console.
 */
async function destinationForUser(userId: string, explicit: string | null) {
  if (explicit) return explicit;
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
  const body = await request.json().catch(() => ({}));
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
  const expiresIn = typeof body.expiresIn === "number" && Number.isFinite(body.expiresIn) ? body.expiresIn : 60 * 60;
  const explicitNext = explicitNextPath(body.next);

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Falta token de invitación." }, { status: 400 });
  }

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return NextResponse.json({ error: `Faltan variables públicas: ${env.missing.join(", ")}` }, { status: 500 });
  }

  const supabase = createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.id) {
    return NextResponse.json({ error: "La invitación no es válida o ha expirado." }, { status: 401 });
  }

  const email = data.user.email?.toLowerCase() ?? "";
  if (email) {
    await acceptPendingTeamInvitationsForUser({ userId: data.user.id, email });
  }

  await recordSecurityAuditEvent({
    actorUserId: data.user.id,
    action: "auth.invite_session_activated",
    entityType: "auth",
    metadata: {
      email_domain: emailDomain(email),
      email_hash: hashSensitiveValue(email || data.user.id),
      source: "supabase_invite_hash",
    },
  });

  const nextPath = await destinationForUser(data.user.id, explicitNext);
  const response = NextResponse.json({ ok: true, nextPath });
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
