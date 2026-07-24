import { sendTenantMagicLinkIfConfigured } from "@/lib/auth/tenant-magic-link";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type MemberInvitationResult =
  | { status: "sent" }
  | { status: "suppressed" }
  | { status: "failed"; reason: string };

/**
 * Envía (o reenvía) la invitación al aula de un miembro ya provisionado por el
 * coach: magic link de un solo uso con la marca del workspace y encuadre de
 * invitación (identidad del coach + 3 pasos + 1 CTA, D-12). Sella
 * invitation_sent_at para que la consola muestre el estado y permita reenvíos
 * informados. La aceptación no crea nada nuevo: el perfil ya existe (UC2 — la
 * invitación del coach ES el alta; no hay página pública).
 */
export async function sendMemberInvitation(input: {
  workspaceId: string;
  memberProfileId: string;
}): Promise<MemberInvitationResult> {
  if (!getSupabaseServiceEnv().ok) return { status: "failed", reason: "supabase_not_configured" };
  const supabase = createServiceSupabaseClient();

  const profile = await supabase
    .from("member_profiles")
    .select("id,user_id,workspace_id")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.memberProfileId)
    .maybeSingle();
  if (!profile.data?.user_id) return { status: "failed", reason: "member_without_auth_user" };

  const user = await supabase.auth.admin.getUserById(profile.data.user_id);
  const email = user.data.user?.email?.trim().toLowerCase() ?? "";
  if (!email) return { status: "failed", reason: "member_without_email" };

  const brand = await getWorkspaceBrand(input.workspaceId);
  const memberHost = brand?.memberDomain || brand?.fallbackSubdomain || "";
  if (!brand || !memberHost) return { status: "failed", reason: "member_domain_not_configured" };

  const delivery = await sendTenantMagicLinkIfConfigured({
    workspace: brand,
    email,
    callbackUrl: `https://${memberHost}/auth/callback`,
    intent: "invitation",
  });

  if (!delivery.handled) return { status: "failed", reason: "workspace_transport_not_configured" };
  if (delivery.status === "failed") return { status: "failed", reason: `${delivery.failure.stage}:${delivery.failure.code}` };
  if (delivery.status === "suppressed") return { status: "suppressed" };

  await supabase
    .from("member_profiles")
    .update({ invitation_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.memberProfileId);

  return { status: "sent" };
}
