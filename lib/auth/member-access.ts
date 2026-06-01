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

/**
 * The authenticated member's REAL workspace id, for member write actions.
 * Member write forms historically posted the host-resolved brand id, which can be
 * the zero-UUID fallback brand (wrong host / missing cookie) and made repositories
 * throw a 500 on the first tap. Resolving from the session here is the safe source
 * of truth; the optional hint only helps pick the right profile when a member
 * belongs to several workspaces. Redirects to /acceso when there is no member.
 */
export async function requireMemberWorkspaceId(hint?: string): Promise<string> {
  const context = await getMemberContext(hint);
  if (!context) redirect("/acceso");
  return context.workspaceId;
}

/**
 * Find-or-create the admin's own comped member profile in a workspace they are
 * previewing. Lets the owner open and fully use any brand's app (including
 * brand-new ones with no clients) without hand-creating a member. Idempotent via
 * the (workspace_id, user_id) unique constraint, so a lost insert race just
 * re-reads the row the other request created.
 */
async function ensureAdminPreviewProfile(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  workspaceId: string,
  userId: string,
  email: string | null | undefined,
): Promise<{ id: string; full_name: string } | null> {
  const existing = await supabase
    .from("member_profiles")
    .select("id,full_name")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) return existing.data;

  const fullName = (email?.split("@")[0] || "Vista previa").trim();
  // Upsert (not insert) so a concurrent first-load race resolves to the same row
  // via the (workspace_id, user_id) unique key instead of throwing.
  const upserted = await supabase
    .from("member_profiles")
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        full_name: fullName,
        subscription_status: "active",
        onboarding_status: "not_started",
        timezone: "Europe/Madrid",
      },
      { onConflict: "workspace_id,user_id" },
    )
    .select("id,full_name")
    .maybeSingle();
  if (upserted.data) return upserted.data;

  // Never fail silently: surface the real reason (it was invisible before) and
  // make one last attempt to read a row a racing request may have created.
  if (upserted.error) {
    console.error("ensureAdminPreviewProfile: could not provision preview profile", {
      workspaceId,
      message: upserted.error.message,
    });
  }
  const retry = await supabase
    .from("member_profiles")
    .select("id,full_name")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return retry.data ?? null;
}

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
    return null;
  }
  const isAdmin = await isPlatformAdminUser(user.id, user.email);

  const { data, error } = await supabase
    .from("member_profiles")
    .select("id,workspace_id,full_name,subscription_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to resolve member profile", error.message);
    return null;
  }

  // Prefer a profile the member actually owns in the hinted workspace.
  let chosen = (workspaceIdHint && data?.find((profile) => profile.workspace_id === workspaceIdHint)) || null;

  // Admin (owner) previewing a brand where they have no profile yet: provision a
  // real, comped member profile so the preview is fully interactive — onboarding
  // and every other write path operate on a real row (a synthetic id would
  // violate member_profile_id foreign keys). Idempotent via the
  // (workspace_id, user_id) unique constraint; self-heals on the next load.
  if (!chosen && isAdmin && workspaceIdHint) {
    const provisioned = await ensureAdminPreviewProfile(supabase, workspaceIdHint, user.id, user.email);
    if (provisioned) {
      return {
        mode: "authenticated",
        userId: user.id,
        workspaceId: workspaceIdHint,
        memberProfileId: provisioned.id,
        fullName: provisioned.full_name ?? "",
        membershipActive: true,
        isAdmin: true,
      };
    }
  }

  // Otherwise fall back to the member's own first profile.
  chosen = chosen || data?.[0] || null;
  if (!chosen) {
    return null;
  }

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
