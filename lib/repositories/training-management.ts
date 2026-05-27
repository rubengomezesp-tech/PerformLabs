import { exerciseLibrary, workouts } from "@/lib/data";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type ManagedExercise = {
  id: string;
  name: string;
  slug: string;
  muscleGroups: string[];
  equipment: string[];
  locations: string[];
  difficulty: string;
  instructions: string;
  defaultVideoUrl: string;
  isBaseLibrary: boolean;
  source: string;
};

export type ManagedWorkoutTemplate = {
  id: string;
  name: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  status: string;
  days: Array<{
    id: string;
    title: string;
    weekNumber: number;
    dayNumber: number;
    notes: string;
    exercises: Array<{
      id: string;
      exerciseName: string;
      sets: number | null;
      reps: string;
      restSeconds: number | null;
      sortOrder: number;
    }>;
  }>;
};

export type ExerciseInput = {
  workspaceId?: string;
  name: string;
  muscleGroups: string;
  equipment: string;
  locations: string;
  difficulty: string;
  instructions: string;
  defaultVideoUrl: string;
  isBaseLibrary: boolean;
};

export type WorkoutTemplateInput = {
  workspaceId: string;
  name: string;
  goal: string;
  level: string;
  daysPerWeek: string;
};

export type WorkoutDayInput = {
  templateId: string;
  weekNumber: string;
  dayNumber: string;
  title: string;
  notes: string;
};

export type WorkoutExerciseInput = {
  dayId: string;
  exerciseId: string;
  sets: string;
  reps: string;
  restSeconds: string;
  notes: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isUuid(value?: string): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function fallbackExercises(): ManagedExercise[] {
  return exerciseLibrary.map((exercise) => ({
    id: exercise.name,
    name: exercise.name,
    slug: slugify(exercise.name),
    muscleGroups: splitList(exercise.muscles),
    equipment: splitList(exercise.equipment),
    locations: [],
    difficulty: "",
    instructions: "",
    defaultVideoUrl: "",
    isBaseLibrary: exercise.source === "Biblioteca global",
    source: exercise.source,
  }));
}

function fallbackWorkoutTemplates(): ManagedWorkoutTemplate[] {
  return workouts.map((workout, index) => ({
    id: workout.title,
    name: workout.title,
    goal: "Hipertrofia",
    level: "Intermedio",
    daysPerWeek: workouts.length,
    status: "draft",
    days: [
      {
        id: workout.day,
        title: workout.day,
        weekNumber: 1,
        dayNumber: index + 1,
        notes: workout.exercises.join(", "),
        exercises: workout.exercises.map((exercise, exerciseIndex) => ({
          id: `${workout.day}-${exercise}`,
          exerciseName: exercise,
          sets: 3,
          reps: "8-12",
          restSeconds: 90,
          sortOrder: exerciseIndex + 1,
        })),
      },
    ],
  }));
}

export async function listManagedExercises(workspaceId?: string): Promise<ManagedExercise[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || (workspaceId && !isUuid(workspaceId))) {
    return fallbackExercises();
  }

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("exercises")
    .select("id,name,slug,muscle_groups,equipment,locations,difficulty,instructions,default_video_url,is_base_library,workspace_id,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (workspaceId) {
    query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to load exercises", error.message);
    return fallbackExercises();
  }

  if (!data?.length) {
    return fallbackExercises();
  }

  return data.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    slug: exercise.slug,
    muscleGroups: exercise.muscle_groups,
    equipment: exercise.equipment,
    locations: exercise.locations,
    difficulty: exercise.difficulty ?? "",
    instructions: exercise.instructions ?? "",
    defaultVideoUrl: exercise.default_video_url ?? "",
    isBaseLibrary: exercise.is_base_library,
    source: exercise.workspace_id ? "Marca" : "Biblioteca global",
  }));
}

export async function createManagedExercise(input: ExerciseInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del ejercicio es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("exercises").insert({
    workspace_id: input.isBaseLibrary ? null : input.workspaceId || null,
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    muscle_groups: splitList(input.muscleGroups),
    equipment: splitList(input.equipment),
    locations: splitList(input.locations),
    difficulty: input.difficulty.trim() || null,
    instructions: input.instructions.trim() || null,
    default_video_url: input.defaultVideoUrl.trim() || null,
    is_base_library: input.isBaseLibrary,
  });

  if (error) {
    throw new Error(`No se pudo crear el ejercicio: ${error.message}`);
  }
}

export async function listManagedWorkoutTemplates(workspaceId?: string): Promise<ManagedWorkoutTemplate[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return fallbackWorkoutTemplates();
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id,name,goal,level,days_per_week,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load workout templates", error.message);
    return fallbackWorkoutTemplates();
  }

  if (!data?.length) {
    return [];
  }

  const templateIds = data.map((template) => template.id);
  const daysResult = await supabase
    .from("workout_template_days")
    .select("id,template_id,title,week_number,day_number,notes")
    .in("template_id", templateIds)
    .order("week_number", { ascending: true })
    .order("day_number", { ascending: true });

  const dayIds = (daysResult.data ?? []).map((day) => day.id);
  const exerciseResult = dayIds.length
    ? await supabase
        .from("workout_template_exercises")
        .select("id,day_id,sets,reps,rest_seconds,sort_order,exercises(name)")
        .in("day_id", dayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  const exercisesByDay = new Map<string, ManagedWorkoutTemplate["days"][number]["exercises"]>();
  for (const item of exerciseResult.data ?? []) {
    const current = exercisesByDay.get(item.day_id) ?? [];
    const exerciseRelation = item.exercises as { name?: string } | null;
    current.push({
      id: item.id,
      exerciseName: exerciseRelation?.name ?? "Ejercicio",
      sets: item.sets,
      reps: item.reps ?? "",
      restSeconds: item.rest_seconds,
      sortOrder: item.sort_order,
    });
    exercisesByDay.set(item.day_id, current);
  }

  const daysByTemplate = new Map<string, ManagedWorkoutTemplate["days"]>();
  for (const day of daysResult.data ?? []) {
    const current = daysByTemplate.get(day.template_id) ?? [];
    current.push({
      id: day.id,
      title: day.title,
      weekNumber: day.week_number,
      dayNumber: day.day_number,
      notes: day.notes ?? "",
      exercises: exercisesByDay.get(day.id) ?? [],
    });
    daysByTemplate.set(day.template_id, current);
  }

  return data.map((template) => ({
    id: template.id,
    name: template.name,
    goal: template.goal ?? "",
    level: template.level ?? "",
    daysPerWeek: template.days_per_week,
    status: template.status,
    days: daysByTemplate.get(template.id) ?? [],
  }));
}

export async function createManagedWorkoutExercise(input: WorkoutExerciseInput) {
  if (!input.dayId || !input.exerciseId) throw new Error("Falta dia o ejercicio.");
  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("workout_template_exercises")
    .select("id")
    .eq("day_id", input.dayId);

  const { error } = await supabase.from("workout_template_exercises").insert({
    day_id: input.dayId,
    exercise_id: input.exerciseId,
    sort_order: (existing.data?.length ?? 0) + 1,
    sets: parseInteger(input.sets, 3),
    reps: input.reps.trim() || "8-12",
    rest_seconds: parseInteger(input.restSeconds, 90),
    notes: input.notes.trim() || null,
  });

  if (error) throw new Error(`No se pudo añadir el ejercicio: ${error.message}`);
}

export async function createManagedWorkoutTemplate(input: WorkoutTemplateInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de crear una rutina.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre de la rutina es obligatorio.");
  }

  const daysPerWeek = Math.max(1, Math.min(7, parseInteger(input.daysPerWeek, 3)));
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("workout_templates").insert({
    workspace_id: input.workspaceId,
    name,
    goal: input.goal.trim() || null,
    level: input.level.trim() || null,
    days_per_week: daysPerWeek,
    status: "draft",
  });

  if (error) {
    throw new Error(`No se pudo crear la rutina: ${error.message}`);
  }
}

export async function createManagedWorkoutDay(input: WorkoutDayInput) {
  if (!input.templateId) {
    throw new Error("Falta la rutina.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("El titulo del dia es obligatorio.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("workout_template_days").insert({
    template_id: input.templateId,
    week_number: parseInteger(input.weekNumber, 1),
    day_number: parseInteger(input.dayNumber, 1),
    title,
    notes: input.notes.trim() || null,
  });

  if (error) {
    throw new Error(`No se pudo crear el dia de rutina: ${error.message}`);
  }
}
