"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { checkLoginRateLimit, clearLoginRateLimit, recordFailedLogin } from "@/lib/auth/login-rate-limit";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import { acceptPendingTeamInvitationsForUser, recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeRedirectPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/console";
  }

  return value;
}

function hashSensitiveValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function emailDomain(email: string) {
  return email.includes("@") ? email.split("@").pop() || "unknown" : "unknown";
}

function forwardedIp(headerValue: string | null) {
  return headerValue?.split(",")[0]?.trim() || "";
}

async function getLoginSecurityContext(email: string) {
  const headerStore = await headers();
  const ip = forwardedIp(headerStore.get("x-forwarded-for"))
    || headerStore.get("x-real-ip")
    || headerStore.get("cf-connecting-ip")
    || "unknown";
  const userAgent = headerStore.get("user-agent") || "unknown";
  const normalizedEmail = email || "unknown";

  return {
    rateLimitKey: `${ip}:${normalizedEmail}`,
    auditMetadata: {
      email_domain: emailDomain(normalizedEmail),
      email_hash: hashSensitiveValue(normalizedEmail),
      ip_hash: hashSensitiveValue(ip),
      user_agent: userAgent.slice(0, 180),
    },
  };
}

function createAuthClient() {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    throw new Error(`Faltan variables públicas: ${env.missing.join(", ")}`);
  }

  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function signInAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");
  const nextPath = safeRedirectPath(readText(formData, "next"));
  const securityContext = await getLoginSecurityContext(email);
  const rateLimit = checkLoginRateLimit(securityContext.rateLimitKey);

  if (!rateLimit.allowed) {
    await recordSecurityAuditEvent({
      action: "auth.sign_in_rate_limited",
      entityType: "auth",
      metadata: {
        ...securityContext.auditMetadata,
        retry_after_seconds: rateLimit.retryAfterSeconds,
      },
    });
    redirect(`/login?error=${encodeURIComponent(`Demasiados intentos. Espera ${rateLimit.retryAfterSeconds} segundos antes de volver a probar.`)}`);
  }

  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    const failedAttempt = recordFailedLogin(securityContext.rateLimitKey);
    await recordSecurityAuditEvent({
      action: "auth.sign_in_failed",
      entityType: "auth",
      metadata: {
        ...securityContext.auditMetadata,
        remaining_attempts: failedAttempt.remaining,
        blocked: !failedAttempt.allowed,
        retry_after_seconds: failedAttempt.retryAfterSeconds,
      },
    });
    redirect(`/login?error=${encodeURIComponent("No hemos podido iniciar sesión con esos datos.")}`);
  }

  clearLoginRateLimit(securityContext.rateLimitKey);
  await acceptPendingTeamInvitationsForUser({
    userId: data.user.id,
    email,
  });
  await recordSecurityAuditEvent({
    actorUserId: data.user?.id ?? null,
    action: "auth.sign_in_success",
    entityType: "auth",
    metadata: securityContext.auditMetadata,
  });

  await setAuthCookies({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  });

  redirect(nextPath);
}

/**
 * Member access via magic link (passwordless). Members are created by their
 * coach without a password, so they get in with a one-time email link that the
 * global AuthHashBridge turns into a session and lands them in /app.
 * `shouldCreateUser: false` means we never create accounts here, and we always
 * return the same generic message so the form can't be used to probe emails.
 */
export async function requestMemberAccessLinkAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const genericSuccess = "/acceso?success=" + encodeURIComponent("Si tu email tiene acceso, te hemos enviado un enlace para entrar. Revisa tu correo.");

  if (!email || !email.includes("@")) {
    redirect("/acceso?error=" + encodeURIComponent("Escribe un email válido."));
  }

  const securityContext = await getLoginSecurityContext(email);
  const rateLimit = checkLoginRateLimit(securityContext.rateLimitKey);
  if (!rateLimit.allowed) {
    redirect("/acceso?error=" + encodeURIComponent(`Demasiados intentos. Espera ${rateLimit.retryAfterSeconds} segundos.`));
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const proto = headerStore.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    const supabase = createAuthClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${proto}://${host}/auth/callback?next=/app`,
      },
    });
  }

  await recordSecurityAuditEvent({
    action: "auth.member_link_requested",
    entityType: "auth",
    metadata: securityContext.auditMetadata,
  });

  redirect(genericSuccess);
}

export async function signUpAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  await recordSecurityAuditEvent({
    action: "access.requested",
    entityType: "access_request",
    metadata: {
      email_hash: hashSensitiveValue(email),
      email_domain: emailDomain(email),
      source: "blocked_signup_action",
    },
  });

  redirect("/registro?success=Solicitud recibida. El acceso real se activa por invitación del equipo PerformLabs.");
}

export async function requestAccessAction(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const fullName = readText(formData, "fullName");
  const brandName = readText(formData, "brandName");
  const notes = readText(formData, "notes");
  const ref = readText(formData, "ref");

  await recordSecurityAuditEvent({
    action: "access.requested",
    entityType: "access_request",
    metadata: {
      email_hash: hashSensitiveValue(email),
      email_domain: emailDomain(email),
      full_name: fullName,
      brand_name: brandName,
      notes,
      referred_by: ref || null,
      source: "registro",
    },
  });

  redirect("/registro?success=Solicitud recibida. Si el acceso está confirmado, te enviaremos una invitación segura.");
}

export async function signOutAction() {
  await clearAuthCookies();
  redirect("/login");
}
