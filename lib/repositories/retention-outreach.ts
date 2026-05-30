import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type RetentionOutreach = {
  id: string;
  memberProfileId: string;
  riskScore: number;
  reason: string;
  message: string;
  status: "draft" | "sent" | "dismissed";
  createdAt: string;
};

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function createOutreachDraft(input: {
  workspaceId: string;
  memberProfileId: string;
  riskScore: number;
  reason: string;
  message: string;
}): Promise<void> {
  if (!isUuid(input.workspaceId) || !isUuid(input.memberProfileId)) return;
  const supabase = createServiceSupabaseClient();
  // Replace any previous draft for this member so the radar stays clean.
  await (supabase as any)
    .from("retention_outreach")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .eq("status", "draft");
  await (supabase as any).from("retention_outreach").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    risk_score: input.riskScore,
    reason: input.reason.slice(0, 500),
    message: input.message.slice(0, 2000),
    status: "draft",
  });
}

/** Map of member_profile_id -> their active draft, for rendering on the radar. */
export async function listOutreachDrafts(workspaceId?: string): Promise<Map<string, RetentionOutreach>> {
  const map = new Map<string, RetentionOutreach>();
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return map;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("retention_outreach")
    .select("id,member_profile_id,risk_score,reason,message,status,created_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return map;
  for (const row of data as Array<any>) {
    if (!map.has(row.member_profile_id)) {
      map.set(row.member_profile_id, {
        id: row.id,
        memberProfileId: row.member_profile_id,
        riskScore: row.risk_score,
        reason: row.reason,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
      });
    }
  }
  return map;
}

export type OutreachStats = { sent: number; drafts: number };

export async function getOutreachStats(workspaceId?: string): Promise<OutreachStats> {
  const empty: OutreachStats = { sent: 0, drafts: 0 };
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("retention_outreach")
    .select("status")
    .eq("workspace_id", workspaceId)
    .limit(5000);
  if (error || !data) return empty;
  let sent = 0;
  let drafts = 0;
  for (const row of data as Array<{ status: string }>) {
    if (row.status === "sent") sent += 1;
    else if (row.status === "draft") drafts += 1;
  }
  return { sent, drafts };
}

export async function setOutreachStatus(workspaceId: string, outreachId: string, status: "sent" | "dismissed"): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(outreachId)) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any)
    .from("retention_outreach")
    .update({ status, acted_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", outreachId);
}
