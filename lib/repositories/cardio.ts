import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CardioModality = "caminar" | "correr" | "bici" | "eliptica" | "hiit" | "remo";

export type CardioSession = {
  id: string;
  loggedOn: string;
  modality: string;
  minutes: number | null;
  intensity: string | null;
  distanceKm: number | null;
  calories: number | null;
  avgHr: number | null;
  notes: string | null;
};

export type CardioWeekSummary = {
  sessions: number;
  totalMinutes: number;
};

export type CardioOverview = {
  recent: CardioSession[];
  week: CardioWeekSummary;
};

export type LogCardioInput = {
  workspaceId: string;
  modality: string;
  minutes?: number | null;
  intensity?: string | null;
  distanceKm?: number | null;
  calories?: number | null;
  avgHr?: number | null;
  notes?: string | null;
  loggedOn?: string | null;
};

const VALID_MODALITIES = new Set<string>(["caminar", "correr", "bici", "eliptica", "hiit", "remo"]);
const VALID_INTENSITIES = new Set<string>(["baja", "media", "alta"]);

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeDate(value?: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayIso();
}

/** Optional positive integer, clamped to a sane upper bound; null otherwise. */
function optInt(value: number | null | undefined, max: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded <= 0) return null;
  return Math.min(rounded, max);
}

/** Optional positive number with one decimal; null otherwise. */
function optNumber(value: number | null | undefined, max: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(Math.round(value * 100) / 100, max);
}

async function getDefaultMemberProfileId(workspaceId: string) {
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
}

function daysAgoIso(days: number) {
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - days);
  return cursor.toISOString().slice(0, 10);
}

function mapRow(row: {
  id: string;
  logged_on: string;
  modality: string;
  minutes: number | null;
  intensity: string | null;
  distance_km: number | null;
  calories: number | null;
  avg_hr: number | null;
  notes: string | null;
}): CardioSession {
  return {
    id: row.id,
    loggedOn: row.logged_on,
    modality: row.modality,
    minutes: row.minutes,
    intensity: row.intensity,
    distanceKm: row.distance_km,
    calories: row.calories,
    avgHr: row.avg_hr,
    notes: row.notes,
  };
}

/** Recent cardio sessions for the member, plus a rolling 7-day summary. */
export async function listCardioSessions(workspaceId?: string, limit = 8): Promise<CardioOverview> {
  const empty: CardioOverview = { recent: [], week: { sessions: 0, totalMinutes: 0 } };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return empty;

  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 8, 1), 50);
  const result = await (supabase as any)
    .from("cardio_session_logs")
    .select("id,logged_on,modality,minutes,intensity,distance_km,calories,avg_hr,notes")
    .eq("member_profile_id", memberProfileId)
    .order("logged_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (result.error || !result.data?.length) return empty;

  const recent: CardioSession[] = result.data.map(mapRow);
  const weekStart = daysAgoIso(6); // today + previous 6 days
  const weekSessions = recent.filter((session) => session.loggedOn >= weekStart);
  const week: CardioWeekSummary = {
    sessions: weekSessions.length,
    totalMinutes: weekSessions.reduce((sum, session) => sum + (session.minutes ?? 0), 0),
  };

  return { recent, week };
}

/** Insert a cardio session for the current member (service-role write, validated). */
export async function logCardioSession(input: LogCardioInput) {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la app del cliente.");

  const modality = input.modality?.trim().toLowerCase();
  if (!modality || !VALID_MODALITIES.has(modality)) {
    throw new Error("Elige un tipo de cardio válido.");
  }

  const intensityRaw = input.intensity?.trim().toLowerCase();
  const intensity = intensityRaw && VALID_INTENSITIES.has(intensityRaw) ? intensityRaw : null;

  const supabase = createServiceSupabaseClient();
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente.");

  const minutes = optInt(input.minutes, 600);
  const notes = input.notes?.trim() ? input.notes.trim().slice(0, 500) : null;

  const { error } = await (supabase as any).from("cardio_session_logs").insert({
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    logged_on: safeDate(input.loggedOn),
    modality,
    minutes,
    intensity,
    distance_km: optNumber(input.distanceKm, 1000),
    calories: optInt(input.calories, 5000),
    avg_hr: optInt(input.avgHr, 240),
    notes,
  });

  if (error) throw new Error(`No se pudo registrar la sesión: ${error.message}`);
}
