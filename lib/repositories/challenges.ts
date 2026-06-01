import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type ChallengeMetric = "workouts" | "habits" | "checkins";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  metric: ChallengeMetric;
  goal: number;
  startsOn: string;
  endsOn: string;
  status: "draft" | "active" | "ended";
};

export type LeaderboardEntry = { memberProfileId: string; name: string; count: number; rank: number };

export type MemberChallenge = Challenge & {
  joined: boolean;
  myCount: number;
  myRank: number | null;
  participants: number;
  leaderboard: LeaderboardEntry[];
};

export type CoachChallenge = Challenge & { participants: number; leaderboard: LeaderboardEntry[] };

const METRIC_LABEL: Record<ChallengeMetric, string> = {
  workouts: "entrenos",
  habits: "hábitos",
  checkins: "check-ins",
};

export function metricLabel(metric: ChallengeMetric): string {
  return METRIC_LABEL[metric] ?? metric;
}

async function getDefaultMember(workspaceId: string) {
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return { id: context.memberProfileId, full_name: context.fullName };
}

function mapRow(row: any): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    metric: (["workouts", "habits", "checkins"].includes(row.metric) ? row.metric : "workouts") as ChallengeMetric,
    goal: row.goal ?? 0,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    status: row.status,
  };
}

/** Counts the challenge metric per member within the window. */
async function countMetric(workspaceId: string, challenge: Challenge, memberIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!memberIds.length) return counts;
  const supabase = createServiceSupabaseClient();

  // The source table and date column depend on the metric. Query each with a
  // statically-typed builder instead of a runtime table name supabase-js can't type.
  let rows: Array<{ member_profile_id: string | null }> = [];
  if (challenge.metric === "workouts") {
    const { data } = await supabase
      .from("workout_session_logs")
      .select("member_profile_id")
      .eq("workspace_id", workspaceId)
      .in("member_profile_id", memberIds)
      .gte("session_date", challenge.startsOn)
      .lte("session_date", challenge.endsOn)
      .limit(20000);
    rows = data ?? [];
  } else if (challenge.metric === "habits") {
    const { data } = await supabase
      .from("member_habit_logs")
      .select("member_profile_id")
      .eq("workspace_id", workspaceId)
      .in("member_profile_id", memberIds)
      .gte("logged_on", challenge.startsOn)
      .lte("logged_on", challenge.endsOn)
      .limit(20000);
    rows = data ?? [];
  } else {
    const { data } = await supabase
      .from("customer_checkins")
      .select("member_profile_id")
      .eq("workspace_id", workspaceId)
      .in("member_profile_id", memberIds)
      .gte("created_at", challenge.startsOn)
      .lte("created_at", `${challenge.endsOn}T23:59:59`)
      .limit(20000);
    rows = data ?? [];
  }

  for (const row of rows) {
    if (row.member_profile_id) counts.set(row.member_profile_id, (counts.get(row.member_profile_id) ?? 0) + 1);
  }
  return counts;
}

async function buildLeaderboard(workspaceId: string, challenge: Challenge): Promise<{ leaderboard: LeaderboardEntry[]; participants: number }> {
  const supabase = createServiceSupabaseClient();
  const partResult = await supabase
    .from("challenge_participants")
    .select("member_profile_id,member_profiles(full_name)")
    .eq("challenge_id", challenge.id)
    .limit(2000);

  const parts = (partResult.data ?? []) as Array<{ member_profile_id: string; member_profiles?: { full_name?: string } | null }>;
  const memberIds = parts.map((p) => p.member_profile_id).filter(Boolean);
  const counts = await countMetric(workspaceId, challenge, memberIds);

  const leaderboard: LeaderboardEntry[] = parts
    .map((p) => ({
      memberProfileId: p.member_profile_id,
      name: p.member_profiles?.full_name || "Cliente",
      count: counts.get(p.member_profile_id) ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.count - a.count);
  leaderboard.forEach((entry, index) => (entry.rank = index + 1));

  return { leaderboard, participants: parts.length };
}

export async function listMemberChallenges(workspaceId?: string): Promise<MemberChallenge[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("id,title,description,metric,goal,starts_on,ends_on,status")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("ends_on", { ascending: true })
    .limit(20);

  if (error || !data?.length) return [];
  const member = await getDefaultMember(workspaceId);

  const result: MemberChallenge[] = [];
  for (const row of data) {
    const challenge = mapRow(row);
    const { leaderboard, participants } = await buildLeaderboard(workspaceId, challenge);
    const mine = member ? leaderboard.find((e) => e.memberProfileId === member.id) : undefined;
    result.push({
      ...challenge,
      joined: Boolean(mine),
      myCount: mine?.count ?? 0,
      myRank: mine?.rank ?? null,
      participants,
      leaderboard: leaderboard.slice(0, 5),
    });
  }
  return result;
}

export async function listCoachChallenges(workspaceId?: string): Promise<CoachChallenge[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("id,title,description,metric,goal,starts_on,ends_on,status")
    .eq("workspace_id", workspaceId)
    .neq("status", "draft")
    .order("ends_on", { ascending: false })
    .limit(30);

  if (error || !data?.length) return [];
  const result: CoachChallenge[] = [];
  for (const row of data) {
    const challenge = mapRow(row);
    const { leaderboard, participants } = await buildLeaderboard(workspaceId, challenge);
    result.push({ ...challenge, participants, leaderboard: leaderboard.slice(0, 5) });
  }
  return result;
}

export async function createChallenge(input: {
  workspaceId: string;
  title: string;
  description: string;
  metric: ChallengeMetric;
  goal: number;
  startsOn: string;
  endsOn: string;
}): Promise<void> {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la marca.");
  if (!input.title.trim()) throw new Error("El reto necesita un título.");
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("challenges").insert({
    workspace_id: input.workspaceId,
    title: input.title.trim().slice(0, 120),
    description: input.description.trim().slice(0, 600),
    metric: ["workouts", "habits", "checkins"].includes(input.metric) ? input.metric : "workouts",
    goal: Math.max(1, Math.min(1000, input.goal || 12)),
    starts_on: input.startsOn || new Date().toISOString().slice(0, 10),
    ends_on: input.endsOn || new Date(Date.now() + 28 * 86_400_000).toISOString().slice(0, 10),
    status: "active",
  });
  if (error) throw new Error(`No se pudo crear el reto: ${error.message}`);
}

export async function joinChallenge(workspaceId: string, challengeId: string): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(challengeId)) return;
  const member = await getDefaultMember(workspaceId);
  if (!member) return;
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("challenge_participants")
    .upsert(
      { challenge_id: challengeId, workspace_id: workspaceId, member_profile_id: member.id },
      { onConflict: "challenge_id,member_profile_id" },
    );
}

export async function setChallengeStatus(workspaceId: string, challengeId: string, status: "active" | "ended"): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(challengeId)) return;
  const supabase = createServiceSupabaseClient();
  await supabase.from("challenges").update({ status }).eq("workspace_id", workspaceId).eq("id", challengeId);
}
