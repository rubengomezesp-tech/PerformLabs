import { getMemberContext } from "@/lib/auth/member-access";
import { recordSecurityAuditEvent } from "@/lib/repositories/security-management";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "no-session" | "admin-blocked" | "error" };

/**
 * GDPR right-to-erasure for a member: permanently delete the authenticated
 * member's account and personal data.
 *
 * Safety:
 * - Resolves the member from their VERIFIED session (never a client-supplied id),
 *   so a member can only ever delete their OWN account.
 * - Refuses for platform admins/owners — their auth user owns the platform and
 *   must never be deleted from the member app.
 *
 * What it removes:
 * - The member's own content that FKs would otherwise only SET NULL (their
 *   community posts, AI/coach chat and support messages — these carry PII).
 * - The `member_profiles` row, whose ON DELETE CASCADE removes the bulk of the
 *   member's data (assigned plans, logs, diary, habits, progress, preferences,
 *   check-ins, subscriptions, devices, push subscriptions, …).
 * - The Supabase auth user, so the email can never sign in again.
 */
export async function deleteMemberAccount(workspaceIdHint?: string): Promise<DeleteAccountResult> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return { ok: false, reason: "error" };

  const context = await getMemberContext(workspaceIdHint ?? "");
  if (!context || !context.userId) return { ok: false, reason: "no-session" };
  if (context.isAdmin) return { ok: false, reason: "admin-blocked" };

  const supabase = createServiceSupabaseClient();
  const memberProfileId = context.memberProfileId;
  const userId = context.userId;

  // 1) Erase the member's own content the FK would only de-link (SET NULL).
  //    Order matters: messages before their parent conversations.
  await supabase.from("coach_ai_messages").delete().eq("member_profile_id", memberProfileId);
  await supabase.from("support_messages").delete().eq("member_profile_id", memberProfileId);
  await supabase.from("support_conversations").delete().eq("member_profile_id", memberProfileId);
  await supabase.from("community_posts").delete().eq("member_profile_id", memberProfileId);

  // 2) Delete the profile — cascades the rest of the member's data.
  const { error: profileError } = await supabase
    .from("member_profiles")
    .delete()
    .eq("id", memberProfileId)
    .eq("user_id", userId);
  if (profileError) {
    console.error("deleteMemberAccount: profile delete failed", profileError.message);
    return { ok: false, reason: "error" };
  }

  // 3) Remove the auth user. Non-fatal if it fails — the member already has no
  //    accessible data; surface for manual cleanup instead of blocking the user.
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("deleteMemberAccount: auth user delete failed", authError.message);
  }

  await recordSecurityAuditEvent({
    actorUserId: userId,
    action: "auth.member_account_deleted",
    entityType: "auth",
    metadata: { workspace_id: context.workspaceId, auth_user_removed: !authError },
  });

  return { ok: true };
}
