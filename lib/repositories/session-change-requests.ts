import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/auth/member-access";
import { isUuid } from "@/lib/utils/uuid";

export type SessionChangeRequest = {
  id: string;
  workspaceId: string;
  memberProfileId: string;
  sessionId: string;
  memberName: string;
  currentStartsAt: string;
  currentEndsAt: string;
  requestedStartsAt: string;
  requestedEndsAt: string;
  timezone: string;
  message: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  resolutionNote: string | null;
  createdAt: string;
};

type ChangeRequestRow = {
  id: string;
  workspace_id: string;
  member_profile_id: string;
  session_id: string;
  requested_starts_at: string;
  requested_ends_at: string;
  timezone: string;
  message: string | null;
  status: SessionChangeRequest["status"];
  resolution_note: string | null;
  created_at: string;
  member_profiles: { full_name: string } | null;
  personal_training_sessions: { starts_at: string; ends_at: string } | null;
};

const SELECT = "id,workspace_id,member_profile_id,session_id,requested_starts_at,requested_ends_at,timezone,message,status,resolution_note,created_at,member_profiles(full_name),personal_training_sessions(starts_at,ends_at)";

function toRequest(row: ChangeRequestRow): SessionChangeRequest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    memberProfileId: row.member_profile_id,
    sessionId: row.session_id,
    memberName: row.member_profiles?.full_name ?? "Cliente",
    currentStartsAt: row.personal_training_sessions?.starts_at ?? "",
    currentEndsAt: row.personal_training_sessions?.ends_at ?? "",
    requestedStartsAt: row.requested_starts_at,
    requestedEndsAt: row.requested_ends_at,
    timezone: row.timezone,
    message: row.message,
    status: row.status,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
  };
}

export async function listManagedSessionChangeRequests(
  workspaceId: string,
  options: { status?: SessionChangeRequest["status"]; limit?: number } = {},
): Promise<SessionChangeRequest[]> {
  if (!isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("personal_training_session_change_requests" as never)
    .select(SELECT)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(options.limit ?? 100);
  if (options.status) query = query.eq("status", options.status);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load session change requests: ${error.message}`);
  return ((data ?? []) as unknown as ChangeRequestRow[]).map(toRequest);
}

export async function listMemberSessionChangeRequests(workspaceIdHint?: string): Promise<SessionChangeRequest[]> {
  const context = await getMemberContext(workspaceIdHint);
  if (!context) return [];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("personal_training_session_change_requests" as never)
    .select(SELECT)
    .eq("workspace_id", context.workspaceId)
    .eq("member_profile_id", context.memberProfileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Unable to load member session change requests: ${error.message}`);
  return ((data ?? []) as unknown as ChangeRequestRow[]).map(toRequest);
}

export async function createMemberSessionChangeRequest(input: {
  workspaceId: string;
  memberProfileId: string;
  sessionId: string;
  requestedStartsAt: string;
  requestedEndsAt: string;
  timezone: string;
  message?: string | null;
}): Promise<string> {
  if (!isUuid(input.workspaceId) || !isUuid(input.memberProfileId) || !isUuid(input.sessionId)) {
    throw new Error("Invalid session change scope");
  }
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("personal_training_session_change_requests" as never)
    .insert({
      workspace_id: input.workspaceId,
      member_profile_id: input.memberProfileId,
      session_id: input.sessionId,
      requested_starts_at: input.requestedStartsAt,
      requested_ends_at: input.requestedEndsAt,
      timezone: input.timezone,
      message: input.message?.trim() || null,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Ya hay una solicitud pendiente para esta sesión");
    throw new Error(`Unable to create session change request: ${error.message}`);
  }
  return (data as { id: string }).id;
}

export async function getManagedSessionChangeRequest(workspaceId: string, requestId: string) {
  if (!isUuid(workspaceId) || !isUuid(requestId)) return null;
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("personal_training_session_change_requests" as never)
    .select(SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load session change request: ${error.message}`);
  return data ? toRequest(data as unknown as ChangeRequestRow) : null;
}

export async function resolveManagedSessionChangeRequest(input: {
  workspaceId: string;
  requestId: string;
  status: "approved" | "declined";
  resolvedBy?: string | null;
  resolutionNote?: string | null;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("personal_training_session_change_requests" as never)
    .update({
      status: input.status,
      resolved_by: input.resolvedBy ?? null,
      resolved_at: new Date().toISOString(),
      resolution_note: input.resolutionNote?.trim() || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Unable to resolve session change request: ${error.message}`);
  if (!data) throw new Error("La solicitud ya había sido resuelta");
}
