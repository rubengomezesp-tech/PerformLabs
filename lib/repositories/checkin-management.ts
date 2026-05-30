import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type MemberCheckinInput = {
  workspaceId: string;
  weightKg: string;
  bodyFatPercent: string;
  waistCm: string;
  chestCm: string;
  hipCm: string;
  energy: string;
  sleepQuality: string;
  digestion: string;
  trainingAdherence: string;
  nutritionAdherence: string;
  notes: string;
  photosAvailable: boolean;
};

export type CoachCheckinReviewInput = {
  workspaceId: string;
  checkinId: string;
  resultStatus: string;
  coachFeedback: string;
  nextActions: string;
  reviewedBy?: string | null;
};

export type ManagedCheckin = {
  id: string;
  memberProfileId: string;
  memberName: string;
  status: string;
  resultsStatus: string;
  photosAvailable: boolean;
  submittedAt: string;
  reviewedAt: string;
  values: {
    weightKg?: number | null;
    bodyFatPercent?: number | null;
    waistCm?: number | null;
    chestCm?: number | null;
    hipCm?: number | null;
    energy?: string;
    trainingAdherence?: string;
    nutritionAdherence?: string;
    notes?: string;
    coachFeedback?: string;
    nextActions?: string;
  };
};

export type MeasurementKey = "weightKg" | "bodyFatPercent" | "waistCm" | "chestCm" | "hipCm";

export type MeasurementSummary = {
  key: MeasurementKey;
  label: string;
  unit: string;
  /** null when this measurement has a lower-is-better reading (fat, waist); used to colour the delta. */
  goodWhenDown: boolean | null;
  current: number | null;
  /** current minus the previous check-in that carried this measurement. */
  delta: number | null;
  /** oldest-first series for sparklines. */
  trend: Array<{ date: string; value: number }>;
};

const MEASUREMENT_META: Array<Pick<MeasurementSummary, "key" | "label" | "unit" | "goodWhenDown">> = [
  { key: "weightKg", label: "Peso", unit: "kg", goodWhenDown: true },
  { key: "bodyFatPercent", label: "Grasa", unit: "%", goodWhenDown: true },
  { key: "waistCm", label: "Cintura", unit: "cm", goodWhenDown: true },
  { key: "chestCm", label: "Pecho", unit: "cm", goodWhenDown: null },
  { key: "hipCm", label: "Cadera", unit: "cm", goodWhenDown: null },
];

export type CoachAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  area: "checkin" | "training" | "nutrition" | "member";
  actionHref: string;
};

function parseNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const text = (value as Record<string, unknown>)[key];
  return typeof text === "string" ? text : "";
}

function jsonNumber(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>)[key];
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") return parseNumber(raw);
  return null;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
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

export async function createMemberCheckin(input: MemberCheckinInput) {
  if (!input.workspaceId) throw new Error("Falta la marca.");
  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  if (!memberProfileId) throw new Error("Crea primero un miembro para guardar check-ins.");

  const keyValues = {
    weightKg: parseNumber(input.weightKg),
    bodyFatPercent: parseNumber(input.bodyFatPercent),
    waistCm: parseNumber(input.waistCm),
    chestCm: parseNumber(input.chestCm),
    hipCm: parseNumber(input.hipCm),
    energy: input.energy.trim(),
    sleepQuality: input.sleepQuality.trim(),
    digestion: input.digestion.trim(),
    trainingAdherence: input.trainingAdherence.trim(),
    nutritionAdherence: input.nutritionAdherence.trim(),
    notes: input.notes.trim(),
  };

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("customer_checkins").insert({
    workspace_id: input.workspaceId,
    member_profile_id: memberProfileId,
    status: "submitted",
    results_status: "pending_review",
    photos_available: input.photosAvailable,
    key_values: keyValues,
    submitted_at: new Date().toISOString(),
  });

  if (error) throw new Error(`No se pudo guardar el check-in: ${error.message}`);
}

export async function reviewMemberCheckin(input: CoachCheckinReviewInput) {
  if (!input.workspaceId || !input.checkinId) throw new Error("Falta check-in.");
  const supabase = createServiceSupabaseClient();

  const existing = await supabase
    .from("customer_checkins")
    .select("key_values")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.checkinId)
    .maybeSingle();

  if (existing.error) throw new Error(`No se pudo leer el check-in: ${existing.error.message}`);

  const keyValues = {
    ...((existing.data?.key_values && typeof existing.data.key_values === "object" && !Array.isArray(existing.data.key_values))
      ? existing.data.key_values as Record<string, unknown>
      : {}),
    coachFeedback: input.coachFeedback.trim(),
    nextActions: input.nextActions.trim(),
  };

  const { error } = await supabase
    .from("customer_checkins")
    .update({
      status: "reviewed",
      results_status: input.resultStatus || "on_track",
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewedBy ?? null,
      key_values: keyValues,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.checkinId);

  if (error) throw new Error(`No se pudo revisar el check-in: ${error.message}`);
}

export async function listManagedCheckins(workspaceId?: string): Promise<ManagedCheckin[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_checkins")
    .select("id,member_profile_id,status,photos_available,results_status,key_values,submitted_at,reviewed_at,created_at,member_profiles(full_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Unable to load check-ins", error.message);
    return [];
  }

  return (data ?? []).map((checkin) => ({
    id: checkin.id,
    memberProfileId: checkin.member_profile_id,
    memberName: checkin.member_profiles?.full_name ?? "Cliente",
    status: checkin.status,
    resultsStatus: checkin.results_status ?? "pending_review",
    photosAvailable: checkin.photos_available,
    submittedAt: checkin.submitted_at ?? checkin.created_at,
    reviewedAt: checkin.reviewed_at ?? "",
    values: {
      weightKg: jsonNumber(checkin.key_values, "weightKg"),
      bodyFatPercent: jsonNumber(checkin.key_values, "bodyFatPercent"),
      waistCm: jsonNumber(checkin.key_values, "waistCm"),
      chestCm: jsonNumber(checkin.key_values, "chestCm"),
      hipCm: jsonNumber(checkin.key_values, "hipCm"),
      energy: jsonText(checkin.key_values, "energy"),
      trainingAdherence: jsonText(checkin.key_values, "trainingAdherence"),
      nutritionAdherence: jsonText(checkin.key_values, "nutritionAdherence"),
      notes: jsonText(checkin.key_values, "notes"),
      coachFeedback: jsonText(checkin.key_values, "coachFeedback"),
      nextActions: jsonText(checkin.key_values, "nextActions"),
    },
  }));
}

export async function getMemberCheckinSummary(workspaceId?: string) {
  const checkins = await listManagedCheckins(workspaceId);
  const latest = checkins[0] ?? null;

  // listManagedCheckins is newest-first. For each tracked measurement build an
  // oldest-first series plus the delta against the previous check-in that
  // carried it, so the client can surface real composition progress, not weight
  // alone.
  const measurements: MeasurementSummary[] = MEASUREMENT_META.map((meta) => {
    const series = checkins
      .filter((checkin) => typeof checkin.values[meta.key] === "number")
      .map((checkin) => ({
        date: checkin.submittedAt ? checkin.submittedAt.slice(0, 10) : "",
        value: checkin.values[meta.key] as number,
      }));
    const current = series[0]?.value ?? null;
    const previous = series[1]?.value ?? null;
    return {
      ...meta,
      current,
      delta: current !== null && previous !== null ? Number((current - previous).toFixed(2)) : null,
      trend: series.slice().reverse(),
    };
  });

  const weightTrend = (measurements.find((measurement) => measurement.key === "weightKg")?.trend ?? []).map((point) => ({
    date: point.date,
    weightKg: point.value,
  }));

  return {
    latest,
    total: checkins.length,
    pendingCoachReview: checkins.filter((checkin) => checkin.status !== "reviewed").length,
    reviewed: checkins.filter((checkin) => checkin.status === "reviewed").length,
    weightTrend,
    measurements,
  };
}

export async function getCoachIntelligenceAlerts(workspaceId?: string): Promise<CoachAlert[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const alerts: CoachAlert[] = [];
  const [members, pendingCheckins, activePlans, recentSessions] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("id,full_name,onboarding_status,subscription_status,created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("customer_checkins")
      .select("id,member_profile_id,status,submitted_at,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .neq("status", "reviewed")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("assigned_workout_plans")
      .select("id,member_profile_id,next_review_on,review_status,name,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
    (supabase as any)
      .from("workout_session_logs")
      .select("id,member_profile_id,session_date,status")
      .eq("workspace_id", workspaceId)
      .gte("session_date", daysAgo(7).slice(0, 10)),
  ]);

  for (const checkin of pendingCheckins.data ?? []) {
    alerts.push({
      id: `checkin-${checkin.id}`,
      title: `${checkin.member_profiles?.full_name ?? "Cliente"} espera revisión`,
      detail: `Check-in enviado ${checkin.submitted_at ? checkin.submitted_at.slice(0, 10) : "sin fecha"}.`,
      severity: "high",
      area: "checkin",
      actionHref: "/coach/checkins",
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const plan of activePlans.data ?? []) {
    if (plan.next_review_on && plan.next_review_on <= today && plan.review_status !== "completed") {
      alerts.push({
        id: `review-${plan.id}`,
        title: `${plan.member_profiles?.full_name ?? "Cliente"} necesita revisión de plan`,
        detail: `${plan.name} tiene revisión marcada para ${plan.next_review_on}.`,
        severity: "medium",
        area: "training",
        actionHref: "/coach/members",
      });
    }
  }

  const activeMemberIds = new Set((recentSessions.data ?? []).map((session: { member_profile_id: string | null }) => session.member_profile_id).filter(Boolean));
  for (const member of members.data ?? []) {
    if (member.subscription_status !== "active" && member.subscription_status !== "trialing") continue;
    if (!activeMemberIds.has(member.id)) {
      alerts.push({
        id: `inactive-${member.id}`,
        title: `${member.full_name} sin entreno registrado`,
        detail: "No hay sesiones guardadas en los últimos 7 días.",
        severity: "medium",
        area: "training",
        actionHref: "/coach/members",
      });
    }
    if (member.onboarding_status !== "completed") {
      alerts.push({
        id: `onboarding-${member.id}`,
        title: `${member.full_name} tiene onboarding pendiente`,
        detail: "Completar datos mejora asignación de entreno, nutrición y check-ins.",
        severity: "low",
        area: "member",
        actionHref: "/coach/members",
      });
    }
  }

  return alerts.slice(0, 12);
}
