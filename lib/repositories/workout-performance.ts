import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type WorkoutSetLogInput = {
  templateExerciseId: string;
  exerciseId: string;
  setNumber: number;
  plannedReps: string;
  actualReps: number | null;
  weightKg: number | null;
  rir: number | null;
  rpe: number | null;
  notes: string;
};

export type WorkoutSessionLogInput = {
  workspaceId: string;
  templateId: string;
  dayId: string;
  perceivedEffort: number | null;
  durationMinutes: number | null;
  notes: string;
  sets: WorkoutSetLogInput[];
};

export type WorkoutPerformanceSummary = {
  sessionsThisWeek: number;
  totalSetsThisWeek: number;
  totalVolumeKgThisWeek: number;
  bestSet: {
    exerciseName: string;
    weightKg: number;
    reps: number;
  } | null;
  recentSessions: Array<{
    date: string;
    status: string;
    sets: number;
    volumeKg: number;
  }>;
};

function parseNumber(value: unknown) {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

async function getDefaultMemberProfileId(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function createWorkoutSessionLog(input: WorkoutSessionLogInput) {
  if (!input.workspaceId || !input.templateId || !input.dayId) {
    throw new Error("Falta la sesion de entrenamiento.");
  }

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  const completedSets = input.sets.filter((set) => set.actualReps || set.weightKg || set.rir || set.rpe || set.notes);
  const status = completedSets.length >= input.sets.length * 0.8 ? "completed" : completedSets.length ? "partial" : "planned";

  const sessionResult = await (supabase as any)
    .from("workout_session_logs")
    .insert({
      workspace_id: input.workspaceId,
      member_profile_id: memberProfileId,
      template_id: input.templateId,
      day_id: input.dayId,
      status,
      perceived_effort: input.perceivedEffort,
      duration_minutes: input.durationMinutes,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (sessionResult.error || !sessionResult.data) {
    throw new Error(`No se pudo guardar la sesion: ${sessionResult.error?.message ?? "sin respuesta"}`);
  }

  if (!completedSets.length) {
    return { sessionId: sessionResult.data.id, setsLogged: 0 };
  }

  const setPayload = completedSets.map((set) => ({
    session_log_id: sessionResult.data.id,
    template_exercise_id: set.templateExerciseId || null,
    exercise_id: set.exerciseId || null,
    set_number: set.setNumber,
    planned_reps: set.plannedReps || null,
    actual_reps: set.actualReps,
    weight_kg: set.weightKg,
    rir: set.rir,
    rpe: set.rpe,
    completed: true,
    notes: set.notes.trim() || null,
  }));

  const setResult = await (supabase as any).from("workout_set_logs").insert(setPayload);
  if (setResult.error) {
    throw new Error(`Se guardo la sesion, pero no los sets: ${setResult.error.message}`);
  }

  return { sessionId: sessionResult.data.id, setsLogged: completedSets.length };
}

export async function getWorkoutPerformanceSummary(workspaceId?: string): Promise<WorkoutPerformanceSummary> {
  const empty: WorkoutPerformanceSummary = {
    sessionsThisWeek: 0,
    totalSetsThisWeek: 0,
    totalVolumeKgThisWeek: 0,
    bestSet: null,
    recentSessions: [],
  };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return empty;

  const supabase = createServiceSupabaseClient();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const sessions = await (supabase as any)
    .from("workout_session_logs")
    .select("id,session_date,status")
    .eq("workspace_id", workspaceId)
    .gte("session_date", fromDate.toISOString().slice(0, 10))
    .order("session_date", { ascending: false })
    .limit(12);

  if (sessions.error || !sessions.data?.length) {
    return empty;
  }

  const sessionIds = sessions.data.map((session: { id: string }) => session.id);
  const sets = await (supabase as any)
    .from("workout_set_logs")
    .select("session_log_id,actual_reps,weight_kg,set_number,exercises(name)")
    .in("session_log_id", sessionIds);

  if (sets.error) {
    console.error("Unable to load workout set summary", sets.error.message);
    return empty;
  }

  const volumeBySession = new Map<string, { sets: number; volumeKg: number }>();
  let bestSet: WorkoutPerformanceSummary["bestSet"] = null;
  for (const set of sets.data ?? []) {
    const reps = parseNumber(set.actual_reps) ?? 0;
    const weight = parseNumber(Number(set.weight_kg)) ?? 0;
    const volume = reps * weight;
    const current = volumeBySession.get(set.session_log_id) ?? { sets: 0, volumeKg: 0 };
    current.sets += 1;
    current.volumeKg += volume;
    volumeBySession.set(set.session_log_id, current);

    if (weight > 0 && reps > 0 && (!bestSet || weight * reps > bestSet.weightKg * bestSet.reps)) {
      bestSet = {
        exerciseName: set.exercises?.name ?? "Ejercicio",
        weightKg: weight,
        reps,
      };
    }
  }

  const recentSessions: WorkoutPerformanceSummary["recentSessions"] = sessions.data.map((session: { id: string; session_date: string; status: string }) => ({
    date: session.session_date,
    status: session.status,
    sets: volumeBySession.get(session.id)?.sets ?? 0,
    volumeKg: Math.round(volumeBySession.get(session.id)?.volumeKg ?? 0),
  }));

  return {
    sessionsThisWeek: sessions.data.length,
    totalSetsThisWeek: recentSessions.reduce((total: number, session) => total + session.sets, 0),
    totalVolumeKgThisWeek: recentSessions.reduce((total: number, session) => total + session.volumeKg, 0),
    bestSet,
    recentSessions,
  };
}
