import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { assignWorkoutTemplateToMember } from "@/lib/repositories/member-management";
import { listManagedWorkoutTemplates, type ManagedWorkoutTemplate } from "@/lib/repositories/training-management";

export type MemberAssignedWorkoutExercise = {
  id: string;
  sourceTemplateExerciseId: string | null;
  exerciseId: string;
  exerciseName: string;
  videoUrl: string;
  thumbnailUrl: string;
  sets: number | null;
  reps: string;
  tempo: string;
  restSeconds: number | null;
  targetRir: string;
  notes: string;
  sortOrder: number;
};

export type MemberAssignedWorkoutDay = {
  id: string;
  sourceTemplateDayId: string | null;
  assignedPlanId: string;
  title: string;
  weekNumber: number;
  monthNumber: number;
  dayNumber: number;
  scheduledOn: string;
  status: string;
  focus: string;
  notes: string;
  estimatedMinutes: number | null;
  exercises: MemberAssignedWorkoutExercise[];
};

export type MemberOnboardingInput = {
  workspaceId: string;
  fullName: string;
  goal: string;
  heightCm: string;
  weightKg: string;
  birthDate: string;
  timezone: string;
  injuries: string;
  trainingLocation: string;
  daysPerWeek: string;
  sessionMinutes: string;
};

export type MemberTrainingContext = {
  memberProfileId: string | null;
  preferredDaysPerWeek: number | null;
  activeAssignment: {
    id: string;
    name: string;
    sourceTemplateId: string | null;
    startsOn: string;
    endsOn: string;
    version: number;
    currentWeek: number;
    currentMonth: number;
    daysPerWeek: number | null;
  } | null;
  activeTemplate: ManagedWorkoutTemplate | null;
  assignedDays: MemberAssignedWorkoutDay[];
  activeAssignedDay: MemberAssignedWorkoutDay | null;
};

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function daysBetween(fromIso?: string | null, toIso = new Date().toISOString().slice(0, 10)) {
  if (!fromIso) return 0;
  const from = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

async function getDefaultMemberProfile(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("member_profiles")
    .select("id,full_name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo localizar el perfil del cliente: ${error.message}`);
  }

  return data ?? null;
}

function findQuarterlyTemplate(templates: ManagedWorkoutTemplate[], daysPerWeek: number) {
  const expectedName = `Modulo 3 meses · ${daysPerWeek} dias/semana`;
  return templates.find((template) => template.name === expectedName)
    ?? templates.find((template) => template.daysPerWeek === daysPerWeek && template.days.length >= daysPerWeek * 8)
    ?? templates.find((template) => template.daysPerWeek === daysPerWeek)
    ?? null;
}

export async function assignQuarterlyWorkoutModule(input: {
  workspaceId: string;
  memberProfileId: string;
  daysPerWeek: number;
}) {
  const supabase = createServiceSupabaseClient();
  const templates = await listManagedWorkoutTemplates(input.workspaceId);
  const template = findQuarterlyTemplate(templates, input.daysPerWeek);

  if (!template) {
    throw new Error(`No existe todavia el modulo de ${input.daysPerWeek} dias/semana. Crealo desde Programas antes de asignarlo.`);
  }

  const latest = await supabase
    .from("assigned_workout_plans")
    .select("version,source_template_id,status")
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error) {
    throw new Error(`No se pudo revisar la asignacion actual: ${latest.error.message}`);
  }

  if (latest.data?.source_template_id === template.id && latest.data.status === "active") {
    return { templateId: template.id, assignmentCreated: false };
  }

  const assignment = await assignWorkoutTemplateToMember({
    workspaceId: input.workspaceId,
    memberProfileId: input.memberProfileId,
    workoutTemplateId: template.id,
    assignmentGoal: template.goal,
    currentMonth: "1",
    currentWeek: "1",
  });

  return { templateId: template.id, assignmentCreated: Boolean(assignment?.assignmentId) };
}

export async function saveMemberOnboarding(input: MemberOnboardingInput) {
  if (!input.workspaceId) {
    throw new Error("Falta la marca para guardar el onboarding.");
  }

  const member = await getDefaultMemberProfile(input.workspaceId);
  if (!member) {
    throw new Error("Todavia no hay perfil de cliente en este workspace para asignar el modulo.");
  }

  const supabase = createServiceSupabaseClient();
  const daysPerWeek = parseInteger(input.daysPerWeek, 4, 3, 7);
  const sessionMinutes = parseInteger(input.sessionMinutes, 60, 30, 150);
  const fullName = input.fullName.trim() || member.full_name;

  const profileUpdate = await supabase
    .from("member_profiles")
    .update({
      full_name: fullName,
      goal: input.goal.trim() || null,
      height_cm: parseNumber(input.heightCm),
      starting_weight_kg: parseNumber(input.weightKg),
      birth_date: input.birthDate || null,
      timezone: input.timezone.trim() || "Europe/Madrid",
      onboarding_status: "training_module_assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("workspace_id", input.workspaceId);

  if (profileUpdate.error) {
    throw new Error(`No se pudo guardar el perfil: ${profileUpdate.error.message}`);
  }

  const preferences = await supabase
    .from("member_fitness_preferences")
    .upsert({
      member_profile_id: member.id,
      location: input.trainingLocation.trim() || "gym",
      available_equipment: [],
      injuries: splitList(input.injuries),
      days_per_week: daysPerWeek,
      session_minutes: sessionMinutes,
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_profile_id" });

  if (preferences.error) {
    throw new Error(`No se pudieron guardar las preferencias: ${preferences.error.message}`);
  }

  const assignment = await assignQuarterlyWorkoutModule({
    workspaceId: input.workspaceId,
    memberProfileId: member.id,
    daysPerWeek,
  });

  return { memberProfileId: member.id, daysPerWeek, ...assignment };
}

export async function getMemberTrainingContext(workspaceId?: string): Promise<MemberTrainingContext> {
  const empty: MemberTrainingContext = {
    memberProfileId: null,
    preferredDaysPerWeek: null,
    activeAssignment: null,
    activeTemplate: null,
    assignedDays: [],
    activeAssignedDay: null,
  };

  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return empty;

  const member = await getDefaultMemberProfile(workspaceId);
  if (!member) return empty;

  const supabase = createServiceSupabaseClient();
  const [preferences, assignment, templates] = await Promise.all([
    supabase
      .from("member_fitness_preferences")
      .select("days_per_week")
      .eq("member_profile_id", member.id)
      .maybeSingle(),
    supabase
      .from("assigned_workout_plans")
      .select("id,name,source_template_id,starts_on,ends_on,version,current_week,current_month,days_per_week")
      .eq("workspace_id", workspaceId)
      .eq("member_profile_id", member.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    listManagedWorkoutTemplates(workspaceId),
  ]);

  const preferredDaysPerWeek = preferences.data?.days_per_week ?? null;
  const assignedTemplateId = assignment.data?.source_template_id ?? null;
  const activeTemplate = assignedTemplateId
    ? templates.find((template) => template.id === assignedTemplateId) ?? null
    : findQuarterlyTemplate(templates, preferredDaysPerWeek ?? 4) ?? templates[0] ?? null;
  let assignedDays: MemberAssignedWorkoutDay[] = [];

  if (assignment.data?.id) {
    const daysResult = await supabase
      .from("assigned_workout_days")
      .select("id,assigned_workout_plan_id,source_template_day_id,week_number,month_number,day_number,scheduled_on,title,focus,instructions,estimated_minutes,status")
      .eq("workspace_id", workspaceId)
      .eq("assigned_workout_plan_id", assignment.data.id)
      .order("week_number", { ascending: true })
      .order("day_number", { ascending: true });

    if (daysResult.error) {
      console.error("Unable to load assigned workout days", daysResult.error.message);
    }

    const dayRows = daysResult.data ?? [];
    const dayIds = dayRows.map((day) => day.id);
    const exercisesResult = dayIds.length
      ? await supabase
          .from("assigned_workout_exercises")
          .select("id,assigned_workout_day_id,source_template_exercise_id,exercise_id,title,video_url,sets,reps,tempo,rest_seconds,target_rir,notes,sort_order")
          .in("assigned_workout_day_id", dayIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

    if (exercisesResult.error) {
      console.error("Unable to load assigned workout exercises", exercisesResult.error.message);
    }

    const exercisesByDay = new Map<string, MemberAssignedWorkoutExercise[]>();
    for (const exercise of exercisesResult.data ?? []) {
      const list = exercisesByDay.get(exercise.assigned_workout_day_id) ?? [];
      list.push({
        id: exercise.id,
        sourceTemplateExerciseId: exercise.source_template_exercise_id,
        exerciseId: exercise.exercise_id ?? "",
        exerciseName: exercise.title,
        videoUrl: exercise.video_url ?? "",
        thumbnailUrl: "",
        sets: exercise.sets,
        reps: exercise.reps ?? "",
        tempo: exercise.tempo ?? "",
        restSeconds: exercise.rest_seconds,
        targetRir: exercise.target_rir ?? "",
        notes: exercise.notes ?? "",
        sortOrder: exercise.sort_order,
      });
      exercisesByDay.set(exercise.assigned_workout_day_id, list);
    }

    assignedDays = dayRows.map((day) => ({
      id: day.id,
      sourceTemplateDayId: day.source_template_day_id,
      assignedPlanId: day.assigned_workout_plan_id,
      title: day.title,
      weekNumber: day.week_number,
      monthNumber: day.month_number,
      dayNumber: day.day_number,
      scheduledOn: day.scheduled_on ?? "",
      status: day.status,
      focus: day.focus ?? "",
      notes: day.instructions ?? "",
      estimatedMinutes: day.estimated_minutes,
      exercises: exercisesByDay.get(day.id) ?? [],
    }));
  }

  const activeAssignedDay = assignedDays.find((day) => day.status !== "completed" && day.weekNumber === (assignment.data?.current_week ?? 1))
    ?? assignedDays.find((day) => day.status !== "completed" && daysBetween(assignment.data?.starts_on) <= (day.weekNumber - 1) * 7 + Math.max(0, day.dayNumber - 1))
    ?? assignedDays.find((day) => day.status !== "completed")
    ?? assignedDays[0]
    ?? null;

  return {
    memberProfileId: member.id,
    preferredDaysPerWeek,
    activeAssignment: assignment.data
        ? {
            id: assignment.data.id,
            name: assignment.data.name,
            sourceTemplateId: assignment.data.source_template_id,
            startsOn: assignment.data.starts_on ?? "",
            endsOn: assignment.data.ends_on ?? "",
            version: assignment.data.version,
            currentWeek: assignment.data.current_week,
            currentMonth: assignment.data.current_month,
            daysPerWeek: assignment.data.days_per_week,
          }
        : null,
    activeTemplate,
    assignedDays,
    activeAssignedDay,
  };
}
