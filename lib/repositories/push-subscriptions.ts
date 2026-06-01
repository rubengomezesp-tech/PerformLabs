import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type PushSubscriptionRow = {
  id: string;
  memberProfileId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function savePushSubscription(input: {
  workspaceId: string;
  memberProfileId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<void> {
  if (!isUuid(input.workspaceId) || !input.endpoint || !input.p256dh || !input.auth) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("push_subscriptions").upsert(
    {
      workspace_id: input.workspaceId,
      member_profile_id: isUuid(input.memberProfileId) ? input.memberProfileId : null,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
      enabled: true,
    },
    { onConflict: "endpoint" },
  );
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** Active subscriptions for a workspace that haven't been notified within `cooldownDays`. */
export async function listNudgeableSubscriptions(workspaceId: string, cooldownDays = 3): Promise<PushSubscriptionRow[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  const cutoff = new Date(Date.now() - cooldownDays * 86_400_000).toISOString();

  const { data, error } = await (supabase as any)
    .from("push_subscriptions")
    .select("id,member_profile_id,endpoint,p256dh,auth,last_notified_at")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
    .limit(2000);

  if (error || !data) return [];
  return (data as Array<any>)
    .filter((row) => !row.last_notified_at || row.last_notified_at < cutoff)
    .map((row) => ({
      id: row.id,
      memberProfileId: row.member_profile_id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    }));
}

/** All enabled push subscriptions for a workspace (audience = its members who opted in). */
export async function listActiveSubscriptions(workspaceId: string): Promise<PushSubscriptionRow[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("push_subscriptions")
    .select("id,member_profile_id,endpoint,p256dh,auth")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
    .limit(5000);
  if (error || !data) return [];
  return (data as Array<any>).map((row) => ({
    id: row.id,
    memberProfileId: row.member_profile_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  }));
}

export async function markSubscriptionNotified(id: string): Promise<void> {
  if (!isUuid(id)) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("push_subscriptions").update({ last_notified_at: new Date().toISOString() }).eq("id", id);
}

export async function countActiveSubscriptions(workspaceId?: string): Promise<number> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return 0;
  const supabase = createServiceSupabaseClient();
  const { count } = await (supabase as any)
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);
  return count ?? 0;
}
