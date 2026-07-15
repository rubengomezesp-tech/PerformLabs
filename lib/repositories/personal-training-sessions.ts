import { getMemberContext } from "@/lib/auth/member-access";
import type { PersonalTrainingStatus } from "@/lib/domain/personal-training-schedule";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type PersonalTrainingSession = {
  id: string;
  workspaceId: string;
  memberProfileId: string;
  memberName: string;
  memberTimezone: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  location: string | null;
  memberNotes: string | null;
  cancellationWindowHours: number;
  status: PersonalTrainingStatus;
  creditState: "reserved" | "consumed" | "released";
  createdAt: string;
};

export type SessionOperationResult = {
  sessionId: string;
  balance: number;
  reserved: number;
  available: number;
  changed?: boolean;
};

type SessionRow = {
  id: string;
  workspace_id: string;
  member_profile_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location: string | null;
  member_notes: string | null;
  cancellation_window_hours: number;
  status: string;
  credit_state: string;
  created_at: string;
  member_profiles: { full_name: string; timezone: string } | null;
};

function toSession(row: SessionRow): PersonalTrainingSession {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    memberProfileId: row.member_profile_id,
    memberName: row.member_profiles?.full_name ?? "Cliente",
    memberTimezone: row.member_profiles?.timezone ?? row.timezone,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    location: row.location,
    memberNotes: row.member_notes,
    cancellationWindowHours: row.cancellation_window_hours,
    status: row.status as PersonalTrainingStatus,
    creditState: row.credit_state as PersonalTrainingSession["creditState"],
    createdAt: row.created_at,
  };
}

const SESSION_SELECT = "id,workspace_id,member_profile_id,starts_at,ends_at,timezone,location,member_notes,cancellation_window_hours,status,credit_state,created_at,member_profiles(full_name,timezone)";

export async function listManagedPersonalTrainingSessions(
  workspaceId: string,
  options: { from?: string; to?: string; memberProfileId?: string; limit?: number } = {},
): Promise<PersonalTrainingSession[]> {
  if (!getSupabaseServiceEnv().ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("personal_training_sessions")
    .select(SESSION_SELECT)
    .eq("workspace_id", workspaceId)
    .order("starts_at", { ascending: true })
    .limit(options.limit ?? 250);
  if (options.from) query = query.gte("starts_at", options.from);
  if (options.to) query = query.lt("starts_at", options.to);
  if (options.memberProfileId) query = query.eq("member_profile_id", options.memberProfileId);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load personal training agenda: ${error.message}`);
  return ((data ?? []) as unknown as SessionRow[]).map(toSession);
}

export async function listMemberPersonalTrainingSessions(
  workspaceIdHint?: string,
  limit = 40,
): Promise<PersonalTrainingSession[]> {
  const context = await getMemberContext(workspaceIdHint);
  if (!context) return [];
  return listManagedPersonalTrainingSessions(context.workspaceId, {
    memberProfileId: context.memberProfileId,
    limit,
  });
}

export async function getManagedPersonalTrainingSession(
  workspaceId: string,
  sessionId: string,
): Promise<PersonalTrainingSession | null> {
  if (!getSupabaseServiceEnv().ok || !isUuid(workspaceId) || !isUuid(sessionId)) return null;
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("personal_training_sessions")
    .select(SESSION_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load personal training session: ${error.message}`);
  return data ? toSession(data as unknown as SessionRow) : null;
}

export async function scheduleManagedPersonalTrainingSession(input: {
  workspaceId: string;
  memberProfileId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  location?: string | null;
  memberNotes?: string | null;
  cancellationWindowHours: number;
  actorUserId?: string | null;
  eventId: string;
}): Promise<SessionOperationResult> {
  if (!isUuid(input.workspaceId) || !isUuid(input.memberProfileId)) throw new Error("Invalid session scope");
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("schedule_personal_training_session", {
    p_workspace_id: input.workspaceId,
    p_member_profile_id: input.memberProfileId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_timezone: input.timezone,
    p_location: input.location ?? "",
    p_member_notes: input.memberNotes ?? "",
    p_cancellation_window_hours: input.cancellationWindowHours,
    p_actor_user_id: input.actorUserId ?? (null as unknown as string),
    p_external_event_id: input.eventId,
  });
  if (error) throw new Error(`Unable to schedule personal training session: ${error.message}`);
  const result = data?.[0];
  if (!result) throw new Error("Schedule operation returned no result");
  return {
    sessionId: result.session_id,
    balance: result.balance,
    reserved: result.reserved,
    available: result.available,
  };
}

export async function transitionManagedPersonalTrainingSession(input: {
  workspaceId: string;
  sessionId: string;
  status: Exclude<PersonalTrainingStatus, "scheduled">;
  note?: string | null;
  actorUserId?: string | null;
  eventId: string;
}): Promise<SessionOperationResult> {
  if (!isUuid(input.workspaceId) || !isUuid(input.sessionId)) throw new Error("Invalid session scope");
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("transition_personal_training_session", {
    p_workspace_id: input.workspaceId,
    p_session_id: input.sessionId,
    p_next_status: input.status,
    p_note: input.note ?? "",
    p_actor_user_id: input.actorUserId ?? (null as unknown as string),
    p_external_event_id: input.eventId,
  });
  if (error) throw new Error(`Unable to resolve personal training session: ${error.message}`);
  const result = data?.[0];
  if (!result) throw new Error("Session transition returned no result");
  return {
    sessionId: result.session_id,
    balance: result.balance,
    reserved: result.reserved,
    available: result.available,
    changed: result.changed,
  };
}

export async function rescheduleManagedPersonalTrainingSession(input: {
  workspaceId: string;
  sessionId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  location?: string | null;
  memberNotes?: string | null;
  actorUserId?: string | null;
  eventId: string;
}): Promise<string> {
  if (!isUuid(input.workspaceId) || !isUuid(input.sessionId)) throw new Error("Invalid session scope");
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.rpc("reschedule_personal_training_session", {
    p_workspace_id: input.workspaceId,
    p_session_id: input.sessionId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_timezone: input.timezone,
    p_location: input.location ?? "",
    p_member_notes: input.memberNotes ?? "",
    p_actor_user_id: input.actorUserId ?? (null as unknown as string),
    p_external_event_id: input.eventId,
  });
  if (error) throw new Error(`Unable to reschedule personal training session: ${error.message}`);
  return data;
}
