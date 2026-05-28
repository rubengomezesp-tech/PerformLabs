import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { listManagedWorkoutTemplates, type ManagedWorkoutTemplate } from "@/lib/repositories/training-management";

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
    startsOn: string;
    endsOn: string;
    version: number;
  } | null;
  activeTemplate: ManagedWorkoutTemplate | null;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
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

  const today = new Date();
  const startsOn = today.toISOString().slice(0, 10);
  const endsOn = addDays(today, 84);
  const nextVersion = (latest.data?.version ?? 0) + 1;

  const archive = await supabase
    .from("assigned_workout_plans")
    .update({ status: "archived" })
    .eq("workspace_id", input.workspaceId)
    .eq("member_profile_id", input.memberProfileId)
    .eq("status", "active");

  if (archive.error) {
    throw new Error(`No se pudo cerrar el modulo anterior: ${archive.error.message}`);
  }

  const insert = await supabase.from("assigned_workout_plans").insert({
    workspace_id: input.workspaceId,
    member_profile_id: input.memberProfileId,
    source_template_id: template.id,
    name: template.name,
    starts_on: startsOn,
    ends_on: endsOn,
    version: nextVersion,
    status: "active",
  });

  if (insert.error) {
    throw new Error(`No se pudo asignar el modulo trimestral: ${insert.error.message}`);
  }

  return { templateId: template.id, assignmentCreated: true };
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
      .select("id,name,source_template_id,starts_on,ends_on,version")
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

  return {
    memberProfileId: member.id,
    preferredDaysPerWeek,
    activeAssignment: assignment.data
      ? {
          id: assignment.data.id,
          name: assignment.data.name,
          startsOn: assignment.data.starts_on ?? "",
          endsOn: assignment.data.ends_on ?? "",
          version: assignment.data.version,
        }
      : null,
    activeTemplate,
  };
}
