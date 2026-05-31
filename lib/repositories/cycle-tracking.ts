import { getMemberContext } from "@/lib/auth/member-access";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CycleFlow = "light" | "medium" | "heavy";
export type CycleEntryType = "period_start" | "spotting" | "symptom";

export type CycleLogEntry = {
  id: string;
  loggedOn: string;
  entryType: CycleEntryType;
  flow: CycleFlow | null;
  symptoms: string[];
  notes: string;
};

export type CycleOverview = {
  entries: CycleLogEntry[];
  /** Average gap (days) between the last few period starts, when computable. */
  averageCycleLength: number | null;
  /** ISO date of the most recent logged period start. */
  lastPeriodStart: string | null;
  /** ISO date predicted for the next period (lastPeriodStart + averageCycleLength). */
  nextPredictedStart: string | null;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The member's REAL scope from their verified session. Mirrors the
 * resolveMemberScope pattern in nutrition-tracking: never trust the raw workspace
 * hint for queries, so a flaky brand id can't hide the member's own data.
 */
async function resolveMemberScope(
  workspaceIdHint?: string,
): Promise<{ workspaceId: string; memberProfileId: string } | null> {
  const context = await getMemberContext(workspaceIdHint ?? "");
  if (!context) return null;
  return { workspaceId: context.workspaceId, memberProfileId: context.memberProfileId };
}

function daysBetweenIso(fromIso: string, toIso: string) {
  const from = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / 86_400_000);
}

function addDaysIso(fromIso: string, days: number) {
  const base = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(base)) return null;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** Returns the member's cycle history plus a light prediction. Empty + safe when no session. */
export async function getCycleOverview(workspaceId?: string, limit = 24): Promise<CycleOverview> {
  const empty: CycleOverview = {
    entries: [],
    averageCycleLength: null,
    lastPeriodStart: null,
    nextPredictedStart: null,
  };
  const env = getSupabaseServiceEnv();
  if (!env.ok) return empty;

  const supabase = createServiceSupabaseClient();
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) return empty;

  const { data, error } = await (supabase as any)
    .from("member_cycle_logs")
    .select("id,logged_on,entry_type,flow,symptoms,notes")
    .eq("member_profile_id", scope.memberProfileId)
    .order("logged_on", { ascending: false })
    .limit(limit);

  if (error || !data) return empty;

  const entries: CycleLogEntry[] = data.map((row: any) => ({
    id: row.id,
    loggedOn: row.logged_on,
    entryType: (row.entry_type ?? "period_start") as CycleEntryType,
    flow: (row.flow ?? null) as CycleFlow | null,
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    notes: row.notes ?? "",
  }));

  // Period starts, newest first, for cycle-length math.
  const starts = entries.filter((entry) => entry.entryType === "period_start").map((entry) => entry.loggedOn);
  const lastPeriodStart = starts[0] ?? null;

  const gaps: number[] = [];
  for (let i = 0; i < starts.length - 1; i += 1) {
    const gap = daysBetweenIso(starts[i + 1], starts[i]);
    if (gap !== null && gap > 0 && gap < 90) gaps.push(gap);
  }
  const averageCycleLength = gaps.length
    ? Math.round(gaps.slice(0, 6).reduce((sum, gap) => sum + gap, 0) / Math.min(6, gaps.length))
    : null;

  const nextPredictedStart =
    lastPeriodStart && averageCycleLength ? addDaysIso(lastPeriodStart, averageCycleLength) : null;

  return { entries, averageCycleLength, lastPeriodStart, nextPredictedStart };
}

export async function upsertCycleLog(input: {
  workspaceId: string;
  date?: string;
  entryType: CycleEntryType;
  flow: CycleFlow | null;
  symptoms: string[];
  notes: string;
}) {
  const scope = await resolveMemberScope(input.workspaceId);
  if (!scope) {
    throw new Error("Todavía no hay perfil de cliente.");
  }
  const { workspaceId: ws, memberProfileId } = scope;

  const date = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayIso();
  const entryType: CycleEntryType = ["period_start", "spotting", "symptom"].includes(input.entryType)
    ? input.entryType
    : "period_start";
  const flow = input.flow && ["light", "medium", "heavy"].includes(input.flow) ? input.flow : null;

  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any)
    .from("member_cycle_logs")
    .upsert(
      {
        workspace_id: ws,
        member_profile_id: memberProfileId,
        logged_on: date,
        entry_type: entryType,
        flow,
        symptoms: input.symptoms.map((symptom) => symptom.trim()).filter(Boolean).slice(0, 12),
        notes: input.notes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_profile_id,logged_on" },
    );

  if (error) {
    throw new Error(`No se pudo guardar el registro: ${error.message}`);
  }
}

export async function deleteCycleLog(workspaceId: string, entryId: string) {
  const scope = await resolveMemberScope(workspaceId);
  if (!scope) {
    throw new Error("Todavía no hay perfil de cliente.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any)
    .from("member_cycle_logs")
    .delete()
    .eq("id", entryId)
    .eq("member_profile_id", scope.memberProfileId);

  if (error) {
    throw new Error(`No se pudo eliminar el registro: ${error.message}`);
  }
}
