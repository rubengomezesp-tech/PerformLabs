import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CoachDashboardStat = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "good" | "warning" | "danger";
};

export type CoachAttentionItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  area: string;
  href: string;
  severity: "high" | "medium" | "low";
};

export type CoachBriefingSummary = {
  id: string;
  memberProfileId: string;
  memberName: string;
  goal: string;
  trainingDaysPerWeek: number | null;
  trainingLocation: string;
  sessionMinutes: number | null;
  mealsPerDay: number | null;
  submittedAt: string;
  reviewedAt: string;
  status: string;
  highlights: string[];
};

export type CoachRecentActivity = {
  id: string;
  memberName: string;
  label: string;
  detail: string;
  source: string;
  occurredAt: string;
};

export type CoachDashboard = {
  stats: CoachDashboardStat[];
  attentionQueue: CoachAttentionItem[];
  briefings: CoachBriefingSummary[];
  recentActivity: CoachRecentActivity[];
};

type MemberRelation = {
  full_name?: string | null;
} | null;

type MemberRow = {
  id: string;
  full_name: string;
  goal: string | null;
  subscription_status: string;
  onboarding_status: string;
  created_at: string;
};

type OnboardingRow = {
  id: string;
  member_profile_id: string;
  goal: string | null;
  training_days_per_week: number | null;
  training_location: string | null;
  session_minutes: number | null;
  meals_per_day: number | null;
  status: string;
  onboarding_payload: Json;
  submitted_at: string;
  reviewed_at: string | null;
  member_profiles?: MemberRelation | MemberRelation[];
};

type MealLogRow = {
  id: string;
  member_profile_id: string | null;
  meal_title: string;
  meal_slot: string;
  status: string;
  notes: string | null;
  logged_on: string;
  created_at: string;
  member_profiles?: MemberRelation | MemberRelation[];
};

type CheckinRow = {
  id: string;
  member_profile_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  member_profiles?: MemberRelation | MemberRelation[];
};

type WorkoutPlanRow = {
  id: string;
  member_profile_id: string;
  name: string;
  next_review_on: string | null;
  review_status: string;
  member_profiles?: MemberRelation | MemberRelation[];
};

type SessionRow = {
  id: string;
  member_profile_id: string | null;
  session_date: string;
  status: string;
};

type ActivityRow = {
  id: string;
  event_type: string;
  source: string;
  metadata: Json;
  occurred_at: string;
  created_at: string;
  member_profiles?: MemberRelation | MemberRelation[];
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function memberName(row: { member_profiles?: MemberRelation | MemberRelation[] }, fallback = "Cliente") {
  return relationOne(row.member_profiles)?.full_name ?? fallback;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function firstWords(value: string, maxLength = 96) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}...` : value;
}

function locationLabel(value?: string | null) {
  if (value === "home") return "Casa";
  if (value === "outdoor") return "Exterior";
  if (value === "gym") return "Gimnasio";
  return "Sin ubicacion";
}

function sourceLabel(value: string) {
  if (value === "member_app") return "App cliente";
  if (value === "coach_console") return "Consola coach";
  return "Sistema";
}

function activityCopy(row: ActivityRow) {
  const metadata = toRecord(row.metadata);
  const mealTitle = typeof metadata.mealTitle === "string" ? metadata.mealTitle : "";
  const status = typeof metadata.status === "string" ? metadata.status : "";
  const setsLogged = typeof metadata.setsLogged === "number" ? metadata.setsLogged : null;
  const daysPerWeek = typeof metadata.daysPerWeek === "number" ? metadata.daysPerWeek : null;
  const mealsPerDay = typeof metadata.mealsPerDay === "number" ? metadata.mealsPerDay : null;

  if (row.event_type === "onboarding_submitted") {
    return {
      label: "Briefing recibido",
      detail: `${daysPerWeek ?? "-"} dias de entreno y ${mealsPerDay ?? "-"} comidas al dia.`,
    };
  }

  if (row.event_type === "workout_session_logged") {
    return {
      label: "Entreno registrado",
      detail: setsLogged ? `${setsLogged} sets guardados por el cliente.` : "Sesion guardada por el cliente.",
    };
  }

  if (row.event_type === "workout_issue_reported") {
    const reason = typeof metadata.reason === "string" ? metadata.reason : "Motivo pendiente";
    return {
      label: "Incidencia de entreno",
      detail: reason,
    };
  }

  if (row.event_type === "meal_logged") {
    const requestReason = typeof metadata.requestReason === "string" ? metadata.requestReason : "";
    return {
      label: status === "swap_requested" ? "Incidencia de comida" : "Comida registrada",
      detail: requestReason || mealTitle || "Movimiento nutricional guardado.",
    };
  }

  if (row.event_type === "nutrition_day_logged") {
    return {
      label: "Seguimiento nutricional",
      detail: "Agua, hambre, energia o notas actualizadas.",
    };
  }

  if (row.event_type === "workout_plan_assigned") {
    return {
      label: "Entrenamiento asignado",
      detail: "Plan publicado para el cliente.",
    };
  }

  if (row.event_type === "meal_plan_assigned") {
    return {
      label: "Nutricion asignada",
      detail: "Plan de comidas publicado para el cliente.",
    };
  }

  return {
    label: "Actividad",
    detail: row.event_type.replaceAll("_", " "),
  };
}

function briefingHighlights(row: OnboardingRow) {
  const payload = toRecord(row.onboarding_payload);
  const training = toRecord(payload.training);
  const nutrition = toRecord(payload.nutrition);
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
  const injuries = textList(training.injuries);
  const allergies = textList(nutrition.allergies);
  const dislikedFoods = textList(nutrition.dislikedFoods);

  return [
    row.goal ? `Objetivo: ${row.goal}` : null,
    row.training_days_per_week ? `${row.training_days_per_week} dias/semana` : null,
    row.session_minutes ? `${row.session_minutes} min por sesion` : null,
    row.meals_per_day ? `${row.meals_per_day} comidas al dia` : null,
    injuries.length ? `Molestias: ${injuries.slice(0, 2).join(", ")}` : null,
    allergies.length ? `Alergias: ${allergies.slice(0, 2).join(", ")}` : null,
    dislikedFoods.length ? `Evita: ${dislikedFoods.slice(0, 2).join(", ")}` : null,
    notes ? `Notas: ${firstWords(notes)}` : null,
  ].filter(Boolean) as string[];
}

function emptyDashboard(): CoachDashboard {
  return {
    stats: [
      { label: "Miembros activos", value: "0", detail: "Sin datos conectados todavia", tone: "neutral" },
      { label: "Briefings nuevos", value: "0", detail: "Sin formularios pendientes", tone: "good" },
      { label: "Entrenos 7 dias", value: "0", detail: "Sin sesiones registradas", tone: "neutral" },
      { label: "Cambios de comida", value: "0", detail: "Sin solicitudes abiertas", tone: "good" },
    ],
    attentionQueue: [],
    briefings: [],
    recentActivity: [],
  };
}

export async function getCoachDashboard(workspaceId?: string): Promise<CoachDashboard> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return emptyDashboard();

  const supabase = createServiceSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const since7Date = daysAgo(7).slice(0, 10);
  const since30Iso = daysAgo(30);

  const [
    membersResult,
    onboardingResult,
    mealSwapsResult,
    checkinsResult,
    plansResult,
    sessionsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("id,full_name,goal,subscription_status,onboarding_status,created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    (supabase as any)
      .from("member_onboarding_responses")
      .select("id,member_profile_id,goal,training_days_per_week,training_location,session_minutes,meals_per_day,status,onboarding_payload,submitted_at,reviewed_at,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .order("submitted_at", { ascending: false })
      .limit(16),
    (supabase as any)
      .from("member_meal_logs")
      .select("id,member_profile_id,meal_title,meal_slot,status,notes,logged_on,created_at,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .eq("status", "swap_requested")
      .gte("logged_on", since7Date)
      .order("created_at", { ascending: false })
      .limit(16),
    (supabase as any)
      .from("customer_checkins")
      .select("id,member_profile_id,status,submitted_at,created_at,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .neq("status", "reviewed")
      .order("created_at", { ascending: false })
      .limit(16),
    (supabase as any)
      .from("assigned_workout_plans")
      .select("id,member_profile_id,name,next_review_on,review_status,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("next_review_on", { ascending: true }),
    (supabase as any)
      .from("workout_session_logs")
      .select("id,member_profile_id,session_date,status")
      .eq("workspace_id", workspaceId)
      .gte("session_date", since7Date),
    (supabase as any)
      .from("member_activity_events")
      .select("id,event_type,source,metadata,occurred_at,created_at,member_profiles(full_name)")
      .eq("workspace_id", workspaceId)
      .gte("occurred_at", since30Iso)
      .order("occurred_at", { ascending: false })
      .limit(12),
  ]);

  for (const [label, result] of [
    ["members", membersResult],
    ["onboarding", onboardingResult],
    ["meal swaps", mealSwapsResult],
    ["checkins", checkinsResult],
    ["plans", plansResult],
    ["sessions", sessionsResult],
    ["activity", activityResult],
  ] as const) {
    if (result.error) {
      console.error(`Unable to load coach dashboard ${label}`, result.error.message);
    }
  }

  const members = (membersResult.data ?? []) as MemberRow[];
  const onboardingRows = ((onboardingResult.data ?? []) as OnboardingRow[]);
  const pendingBriefings = onboardingRows.filter((row) => !["reviewed", "applied"].includes(row.status));
  const mealSwaps = ((mealSwapsResult.data ?? []) as MealLogRow[]);
  const checkins = ((checkinsResult.data ?? []) as CheckinRow[]);
  const plans = ((plansResult.data ?? []) as WorkoutPlanRow[]);
  const sessions = ((sessionsResult.data ?? []) as SessionRow[]);
  const activityRows = ((activityResult.data ?? []) as ActivityRow[]);
  const workoutIssues = activityRows.filter((row) => row.event_type === "workout_issue_reported");
  const activeMemberIds = new Set(sessions.map((session) => session.member_profile_id).filter(Boolean));
  const activeMembers = members.filter((member) => ["active", "trialing"].includes(member.subscription_status));
  const reviewsDue = plans.filter((plan) => plan.next_review_on && plan.next_review_on <= today && plan.review_status !== "completed");

  const attentionQueue: CoachAttentionItem[] = [];

  for (const briefing of pendingBriefings.slice(0, 5)) {
    attentionQueue.push({
      id: `briefing-${briefing.id}`,
      title: `Revisar briefing de ${memberName(briefing)}`,
      detail: `${briefing.goal || "Objetivo pendiente"} · ${briefing.training_days_per_week ?? "-"} dias · ${briefing.meals_per_day ?? "-"} comidas.`,
      status: "Nuevo",
      area: "Onboarding",
      href: "/coach/members",
      severity: "high",
    });
  }

  for (const meal of mealSwaps.slice(0, 4)) {
    attentionQueue.push({
      id: `meal-${meal.id}`,
      title: `${memberName(meal)} reporto una comida`,
      detail: `${meal.meal_slot}: ${meal.meal_title}${meal.notes ? ` · ${firstWords(meal.notes, 70)}` : ""}`,
      status: "Nutricion",
      area: "Comidas",
      href: "/coach/nutrition",
      severity: "high",
    });
  }

  for (const issue of workoutIssues.slice(0, 4)) {
    const metadata = toRecord(issue.metadata);
    const reason = typeof metadata.reason === "string" ? metadata.reason : "Motivo pendiente";
    const notes = typeof metadata.notes === "string" ? metadata.notes : "";
    attentionQueue.push({
      id: `workout-issue-${issue.id}`,
      title: `${memberName(issue)} reporto una incidencia`,
      detail: `${reason}${notes ? ` · ${firstWords(notes, 70)}` : ""}`,
      status: "Entreno",
      area: "Entreno",
      href: "/coach/members",
      severity: "high",
    });
  }

  for (const checkin of checkins.slice(0, 4)) {
    attentionQueue.push({
      id: `checkin-${checkin.id}`,
      title: `${memberName(checkin)} espera feedback`,
      detail: `Check-in enviado ${checkin.submitted_at ? checkin.submitted_at.slice(0, 10) : checkin.created_at.slice(0, 10)}.`,
      status: "Check-in",
      area: "Progreso",
      href: "/coach/checkins",
      severity: "high",
    });
  }

  for (const plan of reviewsDue.slice(0, 4)) {
    attentionQueue.push({
      id: `review-${plan.id}`,
      title: `${memberName(plan)} necesita revision de plan`,
      detail: `${plan.name} vence ${plan.next_review_on}.`,
      status: "Revision",
      area: "Entreno",
      href: "/coach/members",
      severity: "medium",
    });
  }

  for (const member of activeMembers.slice(0, 12)) {
    if (!activeMemberIds.has(member.id)) {
      attentionQueue.push({
        id: `inactive-${member.id}`,
        title: `${member.full_name} sin sesiones esta semana`,
        detail: member.goal ? `Objetivo: ${member.goal}. Conviene revisar adherencia.` : "Conviene revisar adherencia antes de que se enfrie.",
        status: "Seguimiento",
        area: "Entreno",
        href: "/coach/members",
        severity: "medium",
      });
    }
  }

  const stats: CoachDashboardStat[] = [
    {
      label: "Miembros activos",
      value: String(activeMembers.length),
      detail: `${members.length} perfiles en esta marca`,
      tone: "neutral",
    },
    {
      label: "Briefings nuevos",
      value: String(pendingBriefings.length),
      detail: pendingBriefings.length ? "Listos para planificar" : "Todo revisado",
      tone: pendingBriefings.length ? "warning" : "good",
    },
    {
      label: "Entrenos 7 dias",
      value: String(sessions.length),
      detail: `${activeMemberIds.size} clientes con actividad`,
      tone: sessions.length ? "good" : "neutral",
    },
    {
      label: "Cambios de comida",
      value: String(mealSwaps.length),
      detail: mealSwaps.length ? "Solicitudes abiertas" : "Sin bloqueos de dieta",
      tone: mealSwaps.length ? "danger" : "good",
    },
  ];

  return {
    stats,
    attentionQueue: attentionQueue.slice(0, 12),
    briefings: onboardingRows.slice(0, 6).map((row) => ({
      id: row.id,
      memberProfileId: row.member_profile_id,
      memberName: memberName(row),
      goal: row.goal ?? "Objetivo pendiente",
      trainingDaysPerWeek: row.training_days_per_week,
      trainingLocation: locationLabel(row.training_location),
      sessionMinutes: row.session_minutes,
      mealsPerDay: row.meals_per_day,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at ?? "",
      status: row.status,
      highlights: briefingHighlights(row).slice(0, 6),
    })),
    recentActivity: (activityRows.map((row) => {
      const copy = activityCopy(row);
      return {
        id: row.id,
        memberName: memberName(row),
        label: copy.label,
        detail: copy.detail,
        source: sourceLabel(row.source),
        occurredAt: row.occurred_at ?? row.created_at,
      };
    })),
  };
}

export async function markOnboardingBriefingReviewed(input: {
  workspaceId: string;
  responseId: string;
}) {
  if (!input.workspaceId || !input.responseId) {
    throw new Error("Falta el briefing que quieres marcar como revisado.");
  }

  const supabase = createServiceSupabaseClient();
  const existing = await (supabase as any)
    .from("member_onboarding_responses")
    .select("id,member_profile_id")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`No se pudo leer el briefing: ${existing.error.message}`);
  }

  if (!existing.data?.id) {
    throw new Error("No se encontro el briefing en esta marca.");
  }

  const now = new Date().toISOString();
  const update = await (supabase as any)
    .from("member_onboarding_responses")
    .update({
      status: "reviewed",
      reviewed_at: now,
      updated_at: now,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.responseId);

  if (update.error) {
    throw new Error(`No se pudo marcar como revisado: ${update.error.message}`);
  }

  const profileUpdate = await supabase
    .from("member_profiles")
    .update({
      onboarding_status: "coach_reviewed",
      updated_at: now,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", existing.data.member_profile_id);

  if (profileUpdate.error) {
    throw new Error(`No se pudo actualizar el estado del miembro: ${profileUpdate.error.message}`);
  }
}
