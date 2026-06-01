import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { DAY_MS, daysAgoIso } from "@/lib/utils/dates";
import { isUuid } from "@/lib/utils/uuid";

export type RetentionTier = "high" | "medium" | "low";

export type RetentionMember = {
  id: string;
  fullName: string;
  goal: string;
  subscriptionStatus: string;
  riskScore: number; // 0-100, higher = more likely to churn
  tier: RetentionTier;
  daysSinceActivity: number | null;
  workoutsLast14: number;
  lastCheckinDays: number | null;
  reasons: string[];
  recommendedAction: string;
};

export type RetentionRadar = {
  members: RetentionMember[];
  summary: {
    activeMembers: number;
    atRisk: number;
    watch: number;
    healthy: number;
    avgAdherence: number; // 0-100, share of active members training in last 14d
  };
};

function emptyRadar(): RetentionRadar {
  return { members: [], summary: { activeMembers: 0, atRisk: 0, watch: 0, healthy: 0, avgAdherence: 0 } };
}

function daysBetween(fromIso: string | null, now: number): number | null {
  if (!fromIso) return null;
  const then = new Date(fromIso).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.floor((now - then) / DAY_MS));
}

function tierFor(score: number): RetentionTier {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export async function getRetentionRadar(workspaceId?: string): Promise<RetentionRadar> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return emptyRadar();

  const supabase = createServiceSupabaseClient();
  const now = Date.now();
  const sinceActivity = daysAgoIso(45, now);
  const sinceActivityDate = sinceActivity.slice(0, 10);
  const sinceCheckin = daysAgoIso(120, now);

  const [membersResult, sessionsResult, mealsResult, checkinsResult, activityResult] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("id,full_name,goal,subscription_status,onboarding_status,created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("workout_session_logs")
      .select("member_profile_id,session_date")
      .eq("workspace_id", workspaceId)
      .gte("session_date", sinceActivityDate),
    supabase
      .from("member_meal_logs")
      .select("member_profile_id,logged_on")
      .eq("workspace_id", workspaceId)
      .gte("logged_on", sinceActivityDate),
    supabase
      .from("customer_checkins")
      .select("member_profile_id,created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", sinceCheckin),
    supabase
      .from("member_activity_events")
      .select("member_profile_id,occurred_at")
      .eq("workspace_id", workspaceId)
      .gte("occurred_at", sinceActivity),
  ]);

  const members = (membersResult.data ?? []) as Array<{
    id: string;
    full_name: string | null;
    goal: string | null;
    subscription_status: string | null;
    onboarding_status: string | null;
    created_at: string;
  }>;
  if (!members.length) return emptyRadar();

  // Per-member latest activity + counts.
  const lastActivityMs = new Map<string, number>();
  const workouts14 = new Map<string, number>();
  const lastCheckinMs = new Map<string, number>();
  const fortnightAgo = now - 14 * DAY_MS;

  const noteActivity = (memberId: string | null, iso: string | null) => {
    if (!memberId || !iso) return;
    const ts = new Date(iso).getTime();
    if (!Number.isFinite(ts)) return;
    if (ts > (lastActivityMs.get(memberId) ?? 0)) lastActivityMs.set(memberId, ts);
  };

  for (const row of (sessionsResult.data ?? []) as Array<{ member_profile_id: string | null; session_date: string | null }>) {
    noteActivity(row.member_profile_id, row.session_date);
    const ts = row.session_date ? new Date(row.session_date).getTime() : NaN;
    if (row.member_profile_id && Number.isFinite(ts) && ts >= fortnightAgo) {
      workouts14.set(row.member_profile_id, (workouts14.get(row.member_profile_id) ?? 0) + 1);
    }
  }
  for (const row of (mealsResult.data ?? []) as Array<{ member_profile_id: string | null; logged_on: string | null }>) {
    noteActivity(row.member_profile_id, row.logged_on);
  }
  for (const row of (activityResult.data ?? []) as Array<{ member_profile_id: string | null; occurred_at: string | null }>) {
    noteActivity(row.member_profile_id, row.occurred_at);
  }
  for (const row of (checkinsResult.data ?? []) as Array<{ member_profile_id: string | null; created_at: string | null }>) {
    noteActivity(row.member_profile_id, row.created_at);
    if (!row.member_profile_id || !row.created_at) continue;
    const ts = new Date(row.created_at).getTime();
    if (Number.isFinite(ts) && ts > (lastCheckinMs.get(row.member_profile_id) ?? 0)) {
      lastCheckinMs.set(row.member_profile_id, ts);
    }
  }

  const cancelledStatuses = new Set(["canceled", "cancelled", "paused", "expired"]);
  const inactiveStatuses = new Set([...cancelledStatuses, "past_due", "unpaid"]);

  const scored: RetentionMember[] = members
    .filter((member) => !cancelledStatuses.has((member.subscription_status ?? "").toLowerCase()))
    .map((member) => {
      const status = (member.subscription_status ?? "").toLowerCase();
      const lastMs = lastActivityMs.get(member.id) ?? null;
      const daysSinceActivity = lastMs ? Math.max(0, Math.floor((now - lastMs) / 86_400_000)) : null;
      const workoutsLast14 = workouts14.get(member.id) ?? 0;
      const lastCheckinDays = daysBetween(lastCheckinMs.get(member.id) ? new Date(lastCheckinMs.get(member.id)!).toISOString() : null, now);
      const memberAgeDays = daysBetween(member.created_at, now) ?? 0;

      let score = 0;
      const reasons: string[] = [];

      // Inactivity (strongest churn signal)
      if (daysSinceActivity === null || daysSinceActivity >= 14) {
        score += 40;
        reasons.push(daysSinceActivity === null ? "Sin actividad reciente" : `Sin actividad hace ${daysSinceActivity} días`);
      } else if (daysSinceActivity >= 7) {
        score += 25;
        reasons.push(`Sin actividad hace ${daysSinceActivity} días`);
      } else if (daysSinceActivity >= 3) {
        score += 10;
      }

      // Training adherence
      if (memberAgeDays >= 7) {
        if (workoutsLast14 === 0) {
          score += 20;
          reasons.push("0 entrenos en 2 semanas");
        } else if (workoutsLast14 <= 2) {
          score += 10;
          reasons.push(`Solo ${workoutsLast14} entreno(s) en 2 semanas`);
        }
      }

      // Check-in cadence
      if (memberAgeDays >= 14) {
        if (lastCheckinDays === null) {
          score += 15;
          reasons.push("Nunca ha hecho check-in");
        } else if (lastCheckinDays >= 21) {
          score += 15;
          reasons.push(`Check-in atrasado ${lastCheckinDays} días`);
        } else if (lastCheckinDays >= 14) {
          score += 8;
        }
      }

      // Billing
      if (status === "past_due" || status === "unpaid") {
        score += 25;
        reasons.push("Pago pendiente");
      } else if (status === "trialing") {
        score += 5;
      }

      // Onboarding never completed
      if (memberAgeDays >= 7 && member.onboarding_status && !["complete", "completed", "applied", "reviewed"].includes(member.onboarding_status.toLowerCase())) {
        score += 15;
        reasons.push("Onboarding sin completar");
      }

      score = Math.min(100, score);
      const tier = tierFor(score);

      let recommendedAction = "Todo en orden, mantén el contacto.";
      if (status === "past_due" || status === "unpaid") recommendedAction = "Resuelve el pago y contacta hoy.";
      else if (daysSinceActivity === null || daysSinceActivity >= 14) recommendedAction = "Mensaje de reactivación urgente.";
      else if (workoutsLast14 === 0 && memberAgeDays >= 7) recommendedAction = "Pregúntale qué le frena a entrenar.";
      else if (lastCheckinDays !== null && lastCheckinDays >= 21) recommendedAction = "Programa un check-in esta semana.";
      else if (tier === "medium") recommendedAction = "Mándale un mensaje de seguimiento.";

      return {
        id: member.id,
        fullName: member.full_name || "Cliente",
        goal: member.goal || "",
        subscriptionStatus: member.subscription_status || "",
        riskScore: score,
        tier,
        daysSinceActivity,
        workoutsLast14,
        lastCheckinDays,
        reasons,
        recommendedAction,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const activeForAdherence = scored.filter((member) => !inactiveStatuses.has(member.subscriptionStatus.toLowerCase()));
  const trainingMembers = activeForAdherence.filter((member) => member.workoutsLast14 > 0).length;

  return {
    members: scored,
    summary: {
      activeMembers: scored.length,
      atRisk: scored.filter((member) => member.tier === "high").length,
      watch: scored.filter((member) => member.tier === "medium").length,
      healthy: scored.filter((member) => member.tier === "low").length,
      avgAdherence: activeForAdherence.length ? Math.round((trainingMembers / activeForAdherence.length) * 100) : 0,
    },
  };
}
