import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberHome, MemberHomeRepository, TodayWorkout } from "@/src/domain/member-home";
import { todayKey } from "@/src/domain/member-home";

type Row = Record<string, unknown>;

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Atleta";
}

function activeRows(rows: Row[] | null): Row[] {
  return (rows ?? []).filter((row) => textValue(row.status, "active") === "active");
}

export class SupabaseMemberHomeRepository implements MemberHomeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: string): Promise<MemberHome> {
    const profileResult = await this.client
      .from("member_profiles")
      .select("id,workspace_id,full_name")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileResult.error) throw profileResult.error;
    if (!profileResult.data) throw new Error("MEMBER_PROFILE_NOT_FOUND");

    const profile = profileResult.data as Row;
    const memberProfileId = textValue(profile.id);
    const workspaceId = textValue(profile.workspace_id);
    const date = todayKey();
    const now = new Date().toISOString();

    const [programResult, dayResult, nutritionResult, habitsResult, logsResult, packsResult, sessionResult] = await Promise.all([
      this.client
        .from("assigned_workout_plans")
        .select("id,name,current_week,next_review_on,status,algorithm_snapshot,created_at")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.client
        .from("assigned_workout_days")
        .select("id,title,focus,scheduled_on,estimated_minutes,status")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .gte("scheduled_on", date)
        .order("scheduled_on", { ascending: true })
        .limit(1)
        .maybeSingle(),
      this.client
        .from("assigned_meal_plans")
        .select("id,name,meals_per_day,target_calories,target_protein_g,status,created_at")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.client
        .from("member_habits")
        .select("id,name,sort_order")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("archived", false)
        .order("sort_order", { ascending: true }),
      this.client
        .from("member_habit_logs")
        .select("habit_id,count")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("logged_on", date),
      this.client
        .from("member_session_packs")
        .select("total_sessions,remaining_sessions,expires_at,status")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("status", "active"),
      this.client
        .from("personal_training_sessions")
        .select("id,starts_at,location,status")
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("status", "scheduled")
        .gte("ends_at", now)
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const requiredError = programResult.error ?? dayResult.error ?? nutritionResult.error ?? habitsResult.error ?? logsResult.error ?? packsResult.error ?? sessionResult.error;
    if (requiredError) throw requiredError;

    const program = programResult.data as Row | null;
    const day = dayResult.data as Row | null;
    const nutrition = nutritionResult.data as Row | null;
    const session = sessionResult.data as Row | null;
    const habitLogs = new Map(((logsResult.data ?? []) as Row[]).map((log) => [textValue(log.habit_id), numberValue(log.count)]));
    const packs = activeRows((packsResult.data ?? []) as Row[]);
    const nextExpiry = packs
      .map((pack) => textValue(pack.expires_at))
      .filter(Boolean)
      .sort()[0] ?? null;

    let exerciseCount = 0;
    if (day) {
      const countResult = await this.client
        .from("assigned_workout_exercises")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("member_profile_id", memberProfileId)
        .eq("assigned_workout_day_id", textValue(day.id));
      if (countResult.error) throw countResult.error;
      exerciseCount = countResult.count ?? 0;
    }

    const fullName = textValue(profile.full_name, "Atleta");
    const snapshot = program?.algorithm_snapshot && typeof program.algorithm_snapshot === "object"
      ? program.algorithm_snapshot as Record<string, unknown>
      : {};

    return {
      source: "live",
      updatedAt: new Date().toISOString(),
      member: { id: memberProfileId, workspaceId, fullName, firstName: firstName(fullName) },
      program: program ? {
        id: textValue(program.id),
        name: textValue(program.name, "Programa personalizado"),
        currentWeek: numberValue(program.current_week, 1),
        totalWeeks: numberValue(snapshot.durationWeeks, 12),
        nextReviewOn: textValue(program.next_review_on) || null,
      } : null,
      todayWorkout: day ? {
        id: textValue(day.id),
        title: textValue(day.title, "Entrenamiento"),
        focus: textValue(day.focus) || null,
        scheduledOn: textValue(day.scheduled_on) || null,
        minutes: numberValue(day.estimated_minutes, 60),
        exerciseCount,
        status: textValue(day.status, "scheduled") as TodayWorkout["status"],
      } : null,
      nutrition: nutrition ? {
        id: textValue(nutrition.id),
        name: textValue(nutrition.name, "Plan de alimentación"),
        mealsPerDay: numberValue(nutrition.meals_per_day, 0),
        targetCalories: nutrition.target_calories === null ? null : numberValue(nutrition.target_calories),
        targetProteinG: nutrition.target_protein_g === null ? null : numberValue(nutrition.target_protein_g),
      } : null,
      habits: ((habitsResult.data ?? []) as Row[]).map((habit) => ({
        id: textValue(habit.id),
        name: textValue(habit.name, "Hábito"),
        done: (habitLogs.get(textValue(habit.id)) ?? 0) > 0,
      })),
      sessionBalance: {
        remaining: packs.reduce((sum, pack) => sum + numberValue(pack.remaining_sessions), 0),
        purchased: packs.reduce((sum, pack) => sum + numberValue(pack.total_sessions), 0),
        nextExpiry,
      },
      nextSession: session ? {
        id: textValue(session.id),
        startsAt: textValue(session.starts_at),
        location: textValue(session.location) || null,
      } : null,
    };
  }

  async toggleHabit(member: MemberHome["member"], habitId: string, date: string, done: boolean): Promise<void> {
    if (done) {
      const result = await this.client.from("member_habit_logs").upsert({
        workspace_id: member.workspaceId,
        member_profile_id: member.id,
        habit_id: habitId,
        logged_on: date,
        count: 1,
      }, { onConflict: "habit_id,logged_on" });
      if (result.error) throw result.error;
      return;
    }

    const result = await this.client
      .from("member_habit_logs")
      .delete()
      .eq("workspace_id", member.workspaceId)
      .eq("member_profile_id", member.id)
      .eq("habit_id", habitId)
      .eq("logged_on", date);
    if (result.error) throw result.error;
  }
}
