import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

export type MemberHabit = {
  id: string;
  name: string;
  icon: string;
  targetPerDay: number;
  done: boolean;
};

export type SuggestedHabit = {
  name: string;
  icon: string;
};

export type HabitDay = {
  date: string;
  habits: MemberHabit[];
  streak: number;
  completedToday: number;
  hasHabits: boolean;
};

/** Default habits a coach-grade app suggests; activated on demand by the member. */
export const SUGGESTED_HABITS: SuggestedHabit[] = [
  { name: "Beber 2L de agua", icon: "droplets" },
  { name: "10.000 pasos", icon: "footprints" },
  { name: "Dormir 7h o más", icon: "moon" },
  { name: "Proteína en cada comida", icon: "drumstick" },
  { name: "Entrenar hoy", icon: "dumbbell" },
  { name: "10 min de movilidad", icon: "activity" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayIso();
}

async function getDefaultMemberProfileId(workspaceId: string) {
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
}

/** Consecutive days (ending today, or yesterday if today is still empty) with ≥1 habit logged. */
function computeStreak(loggedDates: Set<string>) {
  if (!loggedDates.size) return 0;
  const cursor = new Date();
  if (!loggedDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!loggedDates.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  while (loggedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getMemberHabitDay(workspaceId?: string, dateInput?: string): Promise<HabitDay> {
  const date = safeDate(dateInput);
  const empty: HabitDay = { date, habits: [], streak: 0, completedToday: 0, hasHabits: false };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return empty;

  const habitsResult = await supabase
    .from("member_habits")
    .select("id,name,icon,target_per_day,sort_order")
    .eq("member_profile_id", memberProfileId)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (habitsResult.error || !habitsResult.data?.length) {
    return empty;
  }

  const habitIds = habitsResult.data.map((habit: { id: string }) => habit.id);
  const [todayLogs, streakLogs] = await Promise.all([
    supabase
      .from("member_habit_logs")
      .select("habit_id")
      .eq("member_profile_id", memberProfileId)
      .eq("logged_on", date),
    supabase
      .from("member_habit_logs")
      .select("logged_on")
      .eq("member_profile_id", memberProfileId)
      .order("logged_on", { ascending: false })
      .limit(120),
  ]);

  const doneHabitIds = new Set<string>((todayLogs.data ?? []).map((log: { habit_id: string }) => log.habit_id));
  const loggedDates = new Set<string>((streakLogs.data ?? []).map((log: { logged_on: string }) => log.logged_on));

  const habits: MemberHabit[] = habitsResult.data.map((habit: { id: string; name: string; icon: string | null; target_per_day: number }) => ({
    id: habit.id,
    name: habit.name,
    icon: habit.icon ?? "check",
    targetPerDay: habit.target_per_day ?? 1,
    done: doneHabitIds.has(habit.id),
  }));

  return {
    date,
    habits,
    streak: computeStreak(loggedDates),
    completedToday: habits.filter((habit) => habit.done).length,
    hasHabits: true,
  };
}

export async function activateSuggestedHabits(workspaceId: string) {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la app del cliente.");
  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente.");

  const payload = SUGGESTED_HABITS.map((habit, index) => ({
    workspace_id: workspaceId,
    member_profile_id: memberProfileId,
    name: habit.name,
    icon: habit.icon,
    is_suggested: true,
    sort_order: index,
  }));

  const { error } = await supabase.from("member_habits").insert(payload);
  if (error) throw new Error(`No se pudieron activar los hábitos: ${error.message}`);
}

/**
 * Idempotently seed the recovery/habit set for a specific member at the end of
 * onboarding, so the quiz produces a ready recovery plan (sueño/pasos/agua…) with no
 * manual activation. No-op if the member already has habits.
 */
export async function seedSuggestedHabitsForMember(workspaceId: string, memberProfileId: string) {
  if (!isUuid(workspaceId) || !isUuid(memberProfileId)) return;
  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("member_habits")
    .select("id")
    .eq("member_profile_id", memberProfileId)
    .limit(1);
  if (existing.data?.length) return;

  const payload = SUGGESTED_HABITS.map((habit, index) => ({
    workspace_id: workspaceId,
    member_profile_id: memberProfileId,
    name: habit.name,
    icon: habit.icon,
    is_suggested: true,
    sort_order: index,
  }));
  const { error } = await supabase.from("member_habits").insert(payload);
  if (error) console.error("Unable to seed suggested habits", error.message);
}

/**
 * Adds coach-selected habits without deleting or overwriting anything the
 * member already tracks. This makes publication idempotent and protects prior
 * logs when a plan is revised.
 */
export async function ensureManagedMemberHabits(
  workspaceId: string,
  memberProfileId: string,
  names: string[],
) {
  if (!isUuid(workspaceId) || !isUuid(memberProfileId)) return { created: 0 };
  const cleanNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 12);
  if (!cleanNames.length) return { created: 0 };

  const supabase = createServiceSupabaseClient();
  const member = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", memberProfileId)
    .maybeSingle();
  if (member.error || !member.data) throw new Error("Ese cliente no pertenece a tu marca.");

  const existing = await supabase
    .from("member_habits")
    .select("name")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId);
  if (existing.error) throw new Error(`No se pudieron leer los hábitos: ${existing.error.message}`);
  const existingNames = new Set((existing.data ?? []).map((habit) => habit.name.trim().toLocaleLowerCase("es")));
  const iconByName = new Map(SUGGESTED_HABITS.map((habit) => [habit.name.toLocaleLowerCase("es"), habit.icon]));
  const missing = cleanNames.filter((name) => !existingNames.has(name.toLocaleLowerCase("es")));
  if (!missing.length) return { created: 0 };

  const result = await supabase.from("member_habits").insert(missing.map((name, index) => ({
    workspace_id: workspaceId,
    member_profile_id: memberProfileId,
    name,
    icon: iconByName.get(name.toLocaleLowerCase("es")) ?? "check",
    is_suggested: iconByName.has(name.toLocaleLowerCase("es")),
    sort_order: 20 + index,
  })));
  if (result.error) throw new Error(`No se pudieron activar los hábitos: ${result.error.message}`);
  return { created: missing.length };
}

export async function createCustomHabit(workspaceId: string, name: string) {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la app del cliente.");
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Escribe un nombre para el hábito.");

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente.");

  const { error } = await supabase.from("member_habits").insert({
    workspace_id: workspaceId,
    member_profile_id: memberProfileId,
    name: cleanName,
    icon: "check",
    sort_order: 100,
  });
  if (error) throw new Error(`No se pudo crear el hábito: ${error.message}`);
}

export async function toggleHabitForDay(workspaceId: string, habitId: string, dateInput?: string) {
  if (!isUuid(workspaceId) || !isUuid(habitId)) throw new Error("Hábito no válido.");
  const date = safeDate(dateInput);
  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente.");

  // Guard: the habit must belong to this member.
  const owned = await supabase
    .from("member_habits")
    .select("id")
    .eq("id", habitId)
    .eq("member_profile_id", memberProfileId)
    .maybeSingle();
  if (owned.error || !owned.data) throw new Error("Ese hábito no es tuyo.");

  const existing = await supabase
    .from("member_habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("logged_on", date)
    .maybeSingle();

  if (existing.data?.id) {
    const { error } = await supabase.from("member_habit_logs").delete().eq("id", existing.data.id);
    if (error) throw new Error(`No se pudo actualizar el hábito: ${error.message}`);
    return { done: false };
  }

  const { error } = await supabase.from("member_habit_logs").insert({
    habit_id: habitId,
    member_profile_id: memberProfileId,
    workspace_id: workspaceId,
    logged_on: date,
    count: 1,
  });
  if (error) throw new Error(`No se pudo marcar el hábito: ${error.message}`);
  return { done: true };
}

export async function archiveHabit(workspaceId: string, habitId: string) {
  if (!isUuid(workspaceId) || !isUuid(habitId)) throw new Error("Hábito no válido.");
  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente.");

  const { error } = await supabase
    .from("member_habits")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("member_profile_id", memberProfileId);
  if (error) throw new Error(`No se pudo archivar el hábito: ${error.message}`);
}
