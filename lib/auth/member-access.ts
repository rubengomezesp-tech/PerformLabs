import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/access-control";
import { isConsoleAuthRequired } from "@/lib/auth/auth-mode";
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
 *   This is the identity the member app must use for every read and write.
 */
export type MemberContext = {
  mode: "open" | "authenticated";
  userId: string | null;
  workspaceId: string;
  memberProfileId: string;
  fullName: string;
};

export async function getMemberContext(workspaceIdHint?: string): Promise<MemberContext | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return null;
  const supabase = createServiceSupabaseClient();

  // Open/demo mode: keep the existing "first profile of this workspace" behaviour.
  if (!isConsoleAuthRequired()) {
    if (!workspaceIdHint) return null;
    const { data } = await supabase
      .from("member_profiles")
      .select("id,workspace_id,full_name,user_id")
      .eq("workspace_id", workspaceIdHint)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      mode: "open",
      userId: data.user_id,
      workspaceId: data.workspace_id,
      memberProfileId: data.id,
      fullName: data.full_name ?? "",
    };
  }

  // Production: the member is whoever holds the verified session token.
  const user = await getVerifiedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("member_profiles")
    .select("id,workspace_id,full_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to resolve member profile", error.message);
    return null;
  }
  if (!data?.length) return null;

  // Prefer the hinted workspace when the member actually belongs to it.
  const chosen = (workspaceIdHint && data.find((profile) => profile.workspace_id === workspaceIdHint)) || data[0];
  return {
    mode: "authenticated",
    userId: user.id,
    workspaceId: chosen.workspace_id,
    memberProfileId: chosen.id,
    fullName: chosen.full_name ?? "",
  };
}

/**
 * Gate for `/app`: in production require an authenticated member (else redirect
 * to login). In open/demo mode it never redirects, so the local fallback
 * experience keeps working without auth.
 */
export async function requireMemberContext(workspaceIdHint?: string): Promise<MemberContext | null> {
  const context = await getMemberContext(workspaceIdHint);
  if (context) return context;
  if (isConsoleAuthRequired()) {
    redirect("/acceso?error=" + encodeURIComponent("Inicia sesión para acceder a tu app."));
  }
  return null;
}
