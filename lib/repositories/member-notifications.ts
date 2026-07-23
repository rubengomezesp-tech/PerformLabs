import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type MemberNotificationKind = "checkin_reviewed" | "plan_published" | "consent_request" | "general";

export type MemberNotification = {
  id: string;
  kind: MemberNotificationKind;
  title: string;
  body: string;
  url: string;
  createdAt: string;
};

/**
 * Fila de la bandeja in-app del miembro. Es el canal día-1 en la app nativa
 * (donde no hay web-push) y el fallback web cuando el cliente no dio permiso.
 * Best-effort: nunca lanza.
 */
export async function createMemberNotification(input: {
  workspaceId: string;
  memberProfileId: string;
  kind: MemberNotificationKind;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  try {
    if (!getSupabaseServiceEnv().ok || !input.workspaceId || !input.memberProfileId) return;
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("member_notifications").insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      url: input.url ?? "/app",
    });
    if (error) console.error("createMemberNotification failed", input.kind, error.message);
  } catch (error) {
    console.error("createMemberNotification failed", input.kind, (error as Error).message);
  }
}

/** Notificaciones sin leer del miembro autenticado (para la bandeja de /app). */
export async function listUnreadMemberNotifications(workspaceId: string, limit = 3): Promise<{ items: MemberNotification[]; total: number }> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return { items: [], total: 0 };
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return { items: [], total: 0 };
  const supabase = createServiceSupabaseClient();
  const { data, error, count } = await supabase
    .from("member_notifications")
    .select("id,kind,title,body,url,created_at", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", context.memberProfileId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return { items: [], total: 0 };
  return {
    items: data.map((row) => ({
      id: row.id as string,
      kind: row.kind as MemberNotificationKind,
      title: (row.title as string) ?? "",
      body: (row.body as string) ?? "",
      url: (row.url as string) ?? "/app",
      createdAt: (row.created_at as string) ?? "",
    })),
    total: count ?? 0,
  };
}

/** Marca como leída una notificación del miembro autenticado (vía RPC con guard de dueño). */
export async function markMemberNotificationRead(workspaceId: string, notificationId: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !workspaceId || !notificationId) return;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return;
  const supabase = createServiceSupabaseClient();
  // Guard adicional en servidor: la RPC valida dueño vía RLS helper, pero desde
  // el service-role reforzamos el scoping explícito por perfil de la sesión.
  const { error } = await supabase
    .from("member_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("member_profile_id", context.memberProfileId)
    .is("read_at", null);
  if (error) console.error("markMemberNotificationRead failed", notificationId, error.message);
}
