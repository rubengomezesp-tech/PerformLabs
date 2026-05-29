import type { GeneratedWorkoutPlan, PlanBrief } from "@/lib/ai/plan-generator";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type PlanDraft = {
  id: string;
  kind: string;
  title: string;
  status: "draft" | "approved" | "discarded";
  brief: Partial<PlanBrief>;
  plan: GeneratedWorkoutPlan;
  templateId: string | null;
  createdAt: string;
};

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "ejercicio";
}

function parseRestSeconds(rest: string): number {
  const text = rest.toLowerCase();
  const num = parseFloat(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num)) return 90;
  if (text.includes("min")) return Math.round(num * 60);
  return Math.round(num);
}

export async function createWorkoutPlanDraft(input: {
  workspaceId: string;
  brief: PlanBrief;
  plan: GeneratedWorkoutPlan;
}): Promise<string | null> {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la marca.");
  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("coach_ai_plan_drafts")
    .insert({
      workspace_id: input.workspaceId,
      kind: "workout",
      title: input.plan.name,
      brief: input.brief,
      content: input.plan,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo guardar el borrador: ${error.message}`);
  return data?.id ?? null;
}

export async function listPlanDrafts(workspaceId?: string, limit = 12): Promise<PlanDraft[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("coach_ai_plan_drafts")
    .select("id,kind,title,status,brief,content,template_id,created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "discarded")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    brief: row.brief ?? {},
    plan: row.content ?? { name: row.title, summary: "", progression: "", days: [] },
    templateId: row.template_id ?? null,
    createdAt: row.created_at,
  }));
}

async function getDraftRow(workspaceId: string, draftId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await (supabase as any)
    .from("coach_ai_plan_drafts")
    .select("id,status,content,template_id")
    .eq("workspace_id", workspaceId)
    .eq("id", draftId)
    .maybeSingle();
  return data ?? null;
}

export async function discardPlanDraft(workspaceId: string, draftId: string) {
  if (!isUuid(workspaceId) || !isUuid(draftId)) throw new Error("Borrador no válido.");
  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any)
    .from("coach_ai_plan_drafts")
    .update({ status: "discarded" })
    .eq("workspace_id", workspaceId)
    .eq("id", draftId);
  if (error) throw new Error(`No se pudo descartar: ${error.message}`);
}

/**
 * Coach-in-the-loop approval: turns an AI draft into a real workout_template
 * (status draft) with structured days and exercises that show up for members.
 * Exercise names are matched against the library; unmatched ones become new
 * brand-owned exercises so nothing is lost.
 */
export async function approvePlanDraft(workspaceId: string, draftId: string): Promise<{ templateId: string }> {
  if (!isUuid(workspaceId) || !isUuid(draftId)) throw new Error("Borrador no válido.");
  const supabase = createServiceSupabaseClient();

  const draft = await getDraftRow(workspaceId, draftId);
  if (!draft) throw new Error("No se encontró el borrador.");
  if (draft.status === "approved" && draft.template_id) {
    return { templateId: draft.template_id };
  }

  const plan = (draft.content ?? {}) as GeneratedWorkoutPlan;
  const days = Array.isArray(plan.days) ? plan.days : [];
  if (!days.length) throw new Error("El borrador no tiene días que aprobar.");

  // 1) Template
  const templateResult = await supabase
    .from("workout_templates")
    .insert({
      workspace_id: workspaceId,
      name: plan.name?.slice(0, 120) || "Plan IA",
      goal: (plan.summary || "").slice(0, 200) || null,
      level: null,
      days_per_week: Math.max(1, Math.min(7, days.length)),
      status: "draft",
    })
    .select("id")
    .single();
  if (templateResult.error || !templateResult.data) {
    throw new Error(`No se pudo crear la rutina: ${templateResult.error?.message ?? "sin respuesta"}`);
  }
  const templateId = templateResult.data.id as string;

  // 2) Days
  const daysPayload = days.map((day, index) => ({
    template_id: templateId,
    week_number: 1,
    day_number: day.day || index + 1,
    title: (day.title || `Día ${index + 1}`).slice(0, 120),
    notes: [day.focus, index === 0 && plan.progression ? `Progresión: ${plan.progression}` : ""].filter(Boolean).join("\n").slice(0, 1000),
  }));
  const daysResult = await supabase
    .from("workout_template_days")
    .insert(daysPayload)
    .select("id,day_number");
  if (daysResult.error || !daysResult.data) {
    throw new Error(`Se creó la rutina, pero no sus días: ${daysResult.error?.message ?? "sin respuesta"}`);
  }
  const dayIdByNumber = new Map<number, string>();
  for (const row of daysResult.data) dayIdByNumber.set(row.day_number, row.id);

  // 3) Resolve exercises (match library, else create brand-owned)
  const names = [...new Set(days.flatMap((day) => day.exercises.map((ex) => ex.name.trim())).filter(Boolean))];
  const idByName = new Map<string, string>();
  if (names.length) {
    const existing = await supabase
      .from("exercises")
      .select("id,name")
      .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
      .limit(500);
    for (const row of existing.data ?? []) {
      idByName.set(String(row.name).trim().toLowerCase(), row.id);
    }
    const missing = names.filter((name) => !idByName.has(name.toLowerCase()));
    if (missing.length) {
      const newRows = missing.map((name) => ({
        workspace_id: workspaceId,
        name: name.slice(0, 120),
        slug: `${slugify(name)}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
        muscle_groups: [],
        equipment: [],
        locations: [],
        is_base_library: false,
      }));
      const created = await supabase.from("exercises").insert(newRows).select("id,name");
      for (const row of created.data ?? []) {
        idByName.set(String(row.name).trim().toLowerCase(), row.id);
      }
    }
  }

  // 4) Exercises per day
  const exercisePayload = days.flatMap((day, index) => {
    const dayId = dayIdByNumber.get(day.day || index + 1);
    if (!dayId) return [];
    return day.exercises
      .map((ex, exIndex) => {
        const exerciseId = idByName.get(ex.name.trim().toLowerCase());
        if (!exerciseId) return null;
        return {
          day_id: dayId,
          exercise_id: exerciseId,
          sort_order: exIndex + 1,
          sets: parseInt(ex.sets, 10) || 3,
          reps: ex.reps?.slice(0, 30) || "10",
          rest_seconds: parseRestSeconds(ex.rest || ""),
          notes: ex.notes?.slice(0, 300) || null,
          swap_rules: { source: "coach_ai", editable: true },
        };
      })
      .filter(Boolean);
  });
  if (exercisePayload.length) {
    const insertedExercises = await supabase.from("workout_template_exercises").insert(exercisePayload as any[]);
    if (insertedExercises.error) {
      console.error("Unable to insert AI plan exercises", insertedExercises.error.message);
    }
  }

  // 5) Mark draft approved
  await (supabase as any)
    .from("coach_ai_plan_drafts")
    .update({ status: "approved", template_id: templateId, approved_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", draftId);

  return { templateId };
}
