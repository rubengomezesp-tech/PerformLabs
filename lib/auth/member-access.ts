import { redirect } from "next/navigation";
import { getConsoleSession, getVerifiedUser } from "@/lib/auth/access-control";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
import { platformRoles, roleAllowed } from "@/lib/auth/role-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * The authenticated member behind a `/app` request.
 *
 * Two modes mirror the console (`getConsoleSession`):
 * - **open** (local/demo, `!isConsoleAuthRequired()`): resolves the first member
 *   profile of the hinted workspace, preserving the zero-auth demo experience.
 * - **authenticated** (production): resolves the member from the verified auth
 *   user (`member_profiles.user_id`), NOT "the first profile in the workspace".
 *
 * `membershipActive` gates the app: only `active`/`trialing` members get in.
 * Platform admins are comped — full access without a subscription, and can
 * preview any brand's app.
 */
export type MemberContext = {
  mode: "open" | "authenticated";
  userId: string | null;
  workspaceId: string;
  memberProfileId: string;
  fullName: string;
  membershipActive: boolean;
  isAdmin: boolean;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function isOwnerEmail(email: string | null | undefined): boolean {
  const ownerEmail = process.env.COACHOS_OWNER_EMAIL?.trim().toLowerCase();
  return !!ownerEmail && (email ?? "").toLowerCase() === ownerEmail;
}

async function isPlatformAdminUser(userId: string, email: string | null | undefined): Promise<boolean> {
  if (isOwnerEmail(email)) {
    return true;
  }

  const session = await getConsoleSession();
  return !!session && session.user.id === userId && roleAllowed(session.topRole, platformRoles);
}

async function firstProfileOfWorkspace(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id,workspace_id,full_name,subscription_status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getMemberContext(workspaceIdHint?: string): Promise<MemberContext | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return null;
  const supabase = createServiceSupabaseClient();

  // Open/demo mode: first profile of this workspace, always treated as active.
  if (!isConsoleAuthRequired()) {
    if (!workspaceIdHint) return null;
    const data = await firstProfileOfWorkspace(workspaceIdHint);
    if (!data) return null;
    return {
      mode: "open",
      userId: null,
      workspaceId: data.workspace_id,
      memberProfileId: data.id,
      fullName: data.full_name ?? "",
      membershipActive: true,
      isAdmin: true,
    };
  }

  // Production: the member is whoever holds the verified session token.
  const user = await getVerifiedUser();
  if (!user) {
    console.error("[memberctx] no verified user from cookie", { hint: workspaceIdHint });
    return null;
  }
  const isAdmin = await isPlatformAdminUser(user.id, user.email);
  console.error("[memberctx] resolved", JSON.stringify({ userId: user.id, email: user.email, isAdmin, hint: workspaceIdHint }));

  const { data, error } = await supabase
    .from("member_profiles")
    .select("id,workspace_id,full_name,subscription_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to resolve member profile", error.message);
    return null;
  }

  // Admin (owner) with no member profile: comp preview of the hinted brand.
  if (!data?.length) {
    if (isAdmin && workspaceIdHint) {
      const preview = await firstProfileOfWorkspace(workspaceIdHint);
      if (preview) {
        return {
          mode: "authenticated",
          userId: user.id,
          workspaceId: preview.workspace_id,
          memberProfileId: preview.id,
          fullName: preview.full_name ?? "",
          membershipActive: true,
          isAdmin: true,
        };
      }
    }
    return null;
  }

  // Prefer the hinted workspace when the member actually belongs to it.
  const chosen = (workspaceIdHint && data.find((profile) => profile.workspace_id === workspaceIdHint)) || data[0];
  const status = (chosen as { subscription_status?: string | null }).subscription_status ?? "";
  return {
    mode: "authenticated",
    userId: user.id,
    workspaceId: chosen.workspace_id,
    memberProfileId: chosen.id,
    fullName: chosen.full_name ?? "",
    membershipActive: isAdmin || ACTIVE_STATUSES.has(status),
    isAdmin,
  };
}

/**
 * Gate for `/app`: in production require an authenticated member with an active
 * membership (owner is comped). Inactive members are sent to a clear message;
 * unauthenticated visitors to the passwordless entry. Open/demo mode never
 * redirects so the local fallback keeps working.
 */
export async function requireMemberContext(workspaceIdHint?: string): Promise<MemberContext | null> {
  const context = await getMemberContext(workspaceIdHint);

  if (context && (context.membershipActive || context.isAdmin)) {
    return context;
  }

  if (!isConsoleAuthRequired()) {
    return context;
  }

  if (context && !context.membershipActive) {
    redirect("/acceso?error=" + encodeURIComponent("Tu membresía no está activa. Habla con tu entrenador para reactivarla."));
  }

  redirect("/acceso?error=" + encodeURIComponent("Inicia sesión para acceder a tu app."));
}
