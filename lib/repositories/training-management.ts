import { exerciseLibrary, workouts } from "@/lib/data";
import { buildPeriodizedWorkoutPlan, type ExperienceLevel, type TrainingLocation, type WorkoutGoal } from "@/lib/domain/workout-engine";
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
  sourceDataset: string;
  sourceLicense: string;
  imageUrls: string[];
  workspaceVideo?: ManagedExerciseVideo | null;
};

export type ManagedExerciseVideo = {
  id: string;
  exerciseId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  isDefault: boolean;
};

export type ExerciseFilters = {
  query?: string;
  muscle?: string;
  equipment?: string;
  level?: string;
  source?: "all" | "base" | "brand" | "video";
  limit?: number;
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
      exerciseId: string;
      exerciseName: string;
      videoUrl: string;
      videoTitle: string;
      thumbnailUrl: string;
      sets: number | null;
      reps: string;
      tempo: string;
      restSeconds: number | null;
      notes: string;
      intensityTechnique: string;
      targetRir: string;
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

export type ExerciseVideoInput = {
  workspaceId: string;
  exerciseId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  isDefault: boolean;
  createdBy?: string | null;
};

export type WorkoutTemplateInput = {
  workspaceId: string;
  name: string;
  goal: string;
  level: string;
  daysPerWeek: string;
};

export type WorkoutBlueprintInput = {
  workspaceId: string;
  name: string;
  goal: WorkoutGoal;
  level: ExperienceLevel;
  location: TrainingLocation;
  daysPerWeek: string;
  sessionMinutes: string;
  injuries: string;
};

export type QuarterlyModuleLibraryInput = {
  workspaceId: string;
  goal: WorkoutGoal;
  level: ExperienceLevel;
  location: TrainingLocation;
  sessionMinutes: string;
};

type ExerciseCandidate = {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  locations: string[];
  difficulty: string | null;
  is_base_library: boolean;
  workspace_id: string | null;
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
  tempo?: string;
  restSeconds: string;
  targetRir?: string;
  intensityTechnique?: string;
  notes: string;
};

export type WorkoutExerciseUpdateInput = WorkoutExerciseInput & {
  templateExerciseId: string;
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

function cleanFilter(value?: string) {
  return value?.trim() || "";
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const focusMuscleMap: Record<string, string[]> = {
  push: ["pecho", "chest", "hombro", "shoulders", "triceps"],
  pull: ["espalda", "back", "lats", "biceps"],
  legs: ["cuadriceps", "quadriceps", "gluteo", "glutes", "femoral", "hamstrings", "gemelo", "calves"],
  lower: ["cuadriceps", "quadriceps", "gluteo", "glutes", "femoral", "hamstrings", "gemelo", "calves"],
  upper: ["pecho", "chest", "espalda", "back", "hombro", "shoulders", "biceps", "triceps"],
  conditioning: ["core", "cardio", "full body"],
  mobility: ["movilidad", "mobility", "core", "abdominals"],
  full: ["pecho", "chest", "espalda", "back", "cuadriceps", "quadriceps", "gluteo", "glutes", "hombro", "shoulders"],
};

function targetMusclesForFocus(focus: string) {
  const normalizedFocus = normalizeToken(focus);
  const matched = Object.entries(focusMuscleMap).find(([key]) => normalizedFocus.includes(key));
  return matched?.[1] ?? focusMuscleMap.full;
}

// Maps a reported injury/limitation to the muscle-group tokens that should be
// avoided when auto-selecting exercises. Keys are normalized (no accents).
const injuryMuscleMap: Record<string, string[]> = {
  hombro: ["hombros", "pecho"],
  hombros: ["hombros", "pecho"],
  pecho: ["pecho"],
  espalda: ["espalda"],
  lumbar: ["espalda baja", "espalda"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  codo: ["biceps", "triceps", "antebrazo"],
  muneca: ["antebrazo"],
  cadera: ["gluteos", "isquios"],
  gluteos: ["gluteos"],
  rodilla: ["cuadriceps", "isquios"],
  cuadriceps: ["cuadriceps"],
  isquios: ["isquios"],
  tobillo: ["gemelos"],
  gemelos: ["gemelos"],
  cuello: ["trapecio", "hombros"],
  trapecio: ["trapecio"],
};

function musclesToAvoidForInjuries(injuries: string[]) {
  const result = new Set<string>();
  for (const injury of injuries) {
    const token = normalizeToken(injury);
    if (!token) continue;
    const mapped = injuryMuscleMap[token];
    if (mapped) mapped.forEach((muscle) => result.add(muscle));
    else result.add(token);
  }
  return [...result];
}

function exerciseScore(exercise: ExerciseCandidate, input: {
  targetMuscles: string[];
  location: TrainingLocation;
  level: ExperienceLevel;
}) {
  const muscles = exercise.muscle_groups.map(normalizeToken);
  const equipment = exercise.equipment.map(normalizeToken);
  const locations = exercise.locations.map(normalizeToken);
  let score = 0;

  for (const target of input.targetMuscles.map(normalizeToken)) {
    if (muscles.some((muscle) => muscle.includes(target) || target.includes(muscle))) {
      score += 6;
    }
  }

  if (input.location === "home" && equipment.some((item) => ["mancuerna", "banda", "peso corporal", "bodyweight"].some((allowed) => item.includes(allowed)))) {
    score += 3;
  }

  if (input.location === "gym" && equipment.length) {
    score += 2;
  }

  if (locations.some((location) => location.includes(input.location))) {
    score += 2;
  }

  if (exercise.workspace_id) {
    score += 1;
  }

  if (exercise.difficulty && normalizeToken(exercise.difficulty).includes(input.level)) {
    score += 1;
  }

  return score;
}

function prescriptionForExercise(index: number, week: number, goal: WorkoutGoal) {
  const isDeload = week === 12;
  const isMain = index < 2;

  if (isDeload) {
    return {
      sets: isMain ? 2 : 1,
      reps: "10-12",
      restSeconds: isMain ? 90 : 60,
      tempo: "3-1-2",
      notes: "Descarga tecnica: bajar carga, controlar rango y salir fresco.",
    };
  }

  if (goal === "strength") {
    return {
      sets: isMain ? 4 : 3,
      reps: isMain ? "4-6" : "6-10",
      restSeconds: isMain ? 150 : 105,
      tempo: "2-1-1",
      notes: isMain ? "Top set opcional si tecnica perfecta. RIR 1-2." : "Accesorio controlado. RIR 2.",
    };
  }

  if (goal === "fat_loss") {
    return {
      sets: 3,
      reps: isMain ? "8-12" : "12-15",
      restSeconds: isMain ? 75 : 45,
      tempo: "2-0-2",
      notes: "Mantener tecnica y densidad. No sacrificar rango por fatiga.",
    };
  }

  return {
    sets: isMain ? 4 : 3,
    reps: isMain ? "6-10" : "10-15",
    restSeconds: isMain ? 120 : 75,
    tempo: "3-1-1",
    notes: isMain ? "Doble progresion: completar rango alto antes de subir carga." : "Buscar bombeo y control escapular/articular.",
  };
}

function selectExercisesForDay(exercises: ExerciseCandidate[], input: {
  focus: string;
  week: number;
  goal: WorkoutGoal;
  location: TrainingLocation;
  level: ExperienceLevel;
  excludeMuscles?: string[];
}) {
  const targetMuscles = targetMusclesForFocus(input.focus);
  const exclude = (input.excludeMuscles ?? []).map(normalizeToken).filter(Boolean);
  const safeExercises = exclude.length
    ? exercises.filter((exercise) => {
        const muscles = exercise.muscle_groups.map(normalizeToken);
        return !muscles.some((muscle) => exclude.some((target) => muscle.includes(target) || target.includes(muscle)));
      })
    : exercises;
  const picked = safeExercises
    .map((exercise) => ({
      exercise,
      score: exerciseScore(exercise, { targetMuscles, location: input.location, level: input.level }),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, 5);

  return picked.map(({ exercise }, index) => ({
    exercise,
    prescription: prescriptionForExercise(index, input.week, input.goal),
  }));
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
    sourceDataset: "",
    sourceLicense: "",
    imageUrls: [],
    workspaceVideo: null,
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
          exerciseId: exercise,
          exerciseName: exercise,
          videoUrl: "",
          videoTitle: "",
          thumbnailUrl: "",
          sets: 3,
          reps: "8-12",
          tempo: "",
          restSeconds: 90,
          notes: "",
          intensityTechnique: "",
          targetRir: "",
          sortOrder: exerciseIndex + 1,
        })),
      },
    ],
  }));
}

export async function listManagedExercises(workspaceId?: string, filters: ExerciseFilters = {}): Promise<ManagedExercise[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || (workspaceId && !isUuid(workspaceId))) {
    return applyFallbackExerciseFilters(fallbackExercises(), filters);
  }

  const supabase = createServiceSupabaseClient();
  const source = filters.source ?? "all";
  let query = supabase
    .from("exercises")
    .select("id,name,slug,muscle_groups,equipment,locations,difficulty,instructions,default_video_url,is_base_library,workspace_id,source_dataset,source_license,image_urls,created_at")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 96);

  if (workspaceId) {
    query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
  }

  const search = cleanFilter(filters.query);
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const muscle = cleanFilter(filters.muscle);
  if (muscle) {
    query = query.contains("muscle_groups", [muscle]);
  }

  const equipment = cleanFilter(filters.equipment);
  if (equipment) {
    query = query.contains("equipment", [equipment]);
  }

  const level = cleanFilter(filters.level);
  if (level) {
    query = query.eq("difficulty", level);
  }

  if (source === "base") {
    query = query.is("workspace_id", null);
  } else if (source === "brand" && workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to load exercises", error.message);
    return applyFallbackExerciseFilters(fallbackExercises(), filters);
  }

  if (!data?.length) {
    return [];
  }

  const exerciseIds = data.map((exercise) => exercise.id);
  const videoResult = workspaceId && exerciseIds.length
    ? await supabase
        .from("exercise_videos")
        .select("id,exercise_id,title,video_url,thumbnail_url,is_default,created_at")
        .eq("workspace_id", workspaceId)
        .in("exercise_id", exerciseIds)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (videoResult.error) {
    console.error("Unable to load exercise videos", videoResult.error.message);
  }

  const videoByExercise = new Map<string, ManagedExerciseVideo>();
  for (const video of videoResult.data ?? []) {
    if (videoByExercise.has(video.exercise_id)) continue;
    videoByExercise.set(video.exercise_id, {
      id: video.id,
      exerciseId: video.exercise_id,
      title: video.title,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url ?? "",
      isDefault: video.is_default,
    });
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
    source: exercise.source_dataset === "free-exercise-db" ? "Free Exercise DB" : exercise.workspace_id ? "Marca" : "Biblioteca global",
    sourceDataset: exercise.source_dataset ?? "",
    sourceLicense: exercise.source_license ?? "",
    imageUrls: Array.isArray(exercise.image_urls) ? exercise.image_urls.filter((url): url is string => typeof url === "string") : [],
    workspaceVideo: videoByExercise.get(exercise.id) ?? null,
  })).filter((exercise) => source !== "video" || exercise.workspaceVideo);
}

function applyFallbackExerciseFilters(exercises: ManagedExercise[], filters: ExerciseFilters) {
  const query = normalizeToken(cleanFilter(filters.query));
  const muscle = normalizeToken(cleanFilter(filters.muscle));
  const equipment = normalizeToken(cleanFilter(filters.equipment));
  const level = normalizeToken(cleanFilter(filters.level));

  return exercises
    .filter((exercise) => !query || normalizeToken(exercise.name).includes(query) || normalizeToken(exercise.instructions).includes(query))
    .filter((exercise) => !muscle || exercise.muscleGroups.some((item) => normalizeToken(item).includes(muscle)))
    .filter((exercise) => !equipment || exercise.equipment.some((item) => normalizeToken(item).includes(equipment)))
    .filter((exercise) => !level || normalizeToken(exercise.difficulty) === level)
    .slice(0, filters.limit ?? 96);
}

export async function getExerciseLibraryFacets(workspaceId?: string) {
  const exercises = await listManagedExercises(workspaceId, { limit: 1000 });
  const muscles = [...new Set(exercises.flatMap((exercise) => exercise.muscleGroups))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const equipment = [...new Set(exercises.flatMap((exercise) => exercise.equipment))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const levels = [...new Set(exercises.map((exercise) => exercise.difficulty).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return {
    muscles,
    equipment,
    levels,
    total: exercises.length,
    withImages: exercises.filter((exercise) => exercise.imageUrls.length > 0).length,
    withVideo: exercises.filter((exercise) => exercise.workspaceVideo || exercise.defaultVideoUrl).length,
    brandOnly: exercises.filter((exercise) => !exercise.isBaseLibrary).length,
  };
}

function normalizeUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export async function addExerciseVideo(input: ExerciseVideoInput) {
  if (!isUuid(input.workspaceId) || !isUuid(input.exerciseId)) {
    throw new Error("Falta marca o ejercicio valido para guardar el video.");
  }

  const title = input.title.trim();
  const videoUrl = normalizeUrl(input.videoUrl);
  const thumbnailUrl = normalizeUrl(input.thumbnailUrl);
  if (!title) {
    throw new Error("El titulo del video es obligatorio.");
  }
  if (!videoUrl) {
    throw new Error("Introduce una URL de video valida.");
  }

  const supabase = createServiceSupabaseClient();

  if (input.isDefault) {
    const reset = await supabase
      .from("exercise_videos")
      .update({ is_default: false })
      .eq("workspace_id", input.workspaceId)
      .eq("exercise_id", input.exerciseId);

    if (reset.error) {
      throw new Error(`No se pudo preparar el video por defecto: ${reset.error.message}`);
    }
  }

  const { error } = await supabase.from("exercise_videos").insert({
    workspace_id: input.workspaceId,
    exercise_id: input.exerciseId,
    title,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl || null,
    is_default: input.isDefault,
    created_by: input.createdBy ?? null,
  });

  if (error) {
    throw new Error(`No se pudo guardar el video del ejercicio: ${error.message}`);
  }
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

export type WorkoutTemplateGroupSummary = {
  daysPerWeek: number;
  count: number;
};

export async function listWorkoutTemplateGroupSummaries(workspaceId?: string): Promise<WorkoutTemplateGroupSummary[]> {
  const baseGroups = [3, 4, 5, 6, 7].map((daysPerWeek) => ({ daysPerWeek, count: 0 }));
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return baseGroups;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("days_per_week")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Unable to load workout template summaries", error.message);
    return baseGroups;
  }

  const countByDays = new Map<number, number>();
  for (const item of data ?? []) {
    const days = item.days_per_week ?? 0;
    if (![3, 4, 5, 6, 7].includes(days)) continue;
    countByDays.set(days, (countByDays.get(days) ?? 0) + 1);
  }

  return baseGroups.map((group) => ({
    ...group,
    count: countByDays.get(group.daysPerWeek) ?? 0,
  }));
}

export async function listManagedWorkoutTemplates(
  workspaceId?: string,
  options: { daysPerWeek?: number } = {},
): Promise<ManagedWorkoutTemplate[]> {
  const env = getSupabaseServiceEnv();

  if (!env.ok || !isUuid(workspaceId)) {
    return fallbackWorkoutTemplates();
  }

  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("workout_templates")
    .select("id,name,goal,level,days_per_week,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (options.daysPerWeek) {
    query = query.eq("days_per_week", options.daysPerWeek);
  }

  const { data, error } = await query;

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
        .select("id,day_id,exercise_id,sets,reps,tempo,rest_seconds,notes,swap_rules,sort_order,exercises(name,default_video_url)")
        .in("day_id", dayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  const assignedExerciseIds = [...new Set((exerciseResult.data ?? []).map((item) => item.exercise_id))];
  const videoResult = assignedExerciseIds.length
    ? await supabase
        .from("exercise_videos")
        .select("id,exercise_id,title,video_url,thumbnail_url,is_default,created_at")
        .eq("workspace_id", workspaceId)
        .in("exercise_id", assignedExerciseIds)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (videoResult.error) {
    console.error("Unable to load workout exercise videos", videoResult.error.message);
  }

  const videoByExercise = new Map<string, ManagedExerciseVideo>();
  for (const video of videoResult.data ?? []) {
    if (videoByExercise.has(video.exercise_id)) continue;
    videoByExercise.set(video.exercise_id, {
      id: video.id,
      exerciseId: video.exercise_id,
      title: video.title,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url ?? "",
      isDefault: video.is_default,
    });
  }

  const exercisesByDay = new Map<string, ManagedWorkoutTemplate["days"][number]["exercises"]>();
  for (const item of exerciseResult.data ?? []) {
    const current = exercisesByDay.get(item.day_id) ?? [];
    const exerciseRelation = item.exercises as { name?: string; default_video_url?: string | null } | null;
    const workspaceVideo = videoByExercise.get(item.exercise_id);
    const swapRules = item.swap_rules && typeof item.swap_rules === "object" ? item.swap_rules as Record<string, unknown> : {};
    current.push({
      id: item.id,
      exerciseId: item.exercise_id,
      exerciseName: exerciseRelation?.name ?? "Ejercicio",
      videoUrl: workspaceVideo?.videoUrl ?? exerciseRelation?.default_video_url ?? "",
      videoTitle: workspaceVideo?.title ?? "",
      thumbnailUrl: workspaceVideo?.thumbnailUrl ?? "",
      sets: item.sets,
      reps: item.reps ?? "",
      tempo: item.tempo ?? "",
      restSeconds: item.rest_seconds,
      notes: item.notes ?? "",
      intensityTechnique: typeof swapRules.intensityTechnique === "string" ? swapRules.intensityTechnique : "",
      targetRir: typeof swapRules.targetRir === "string" ? swapRules.targetRir : "",
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
    tempo: input.tempo?.trim() || null,
    rest_seconds: parseInteger(input.restSeconds, 90),
    notes: input.notes.trim() || null,
    swap_rules: {
      editable: true,
      targetRir: input.targetRir?.trim() || null,
      intensityTechnique: input.intensityTechnique?.trim() || null,
    },
  });

  if (error) throw new Error(`No se pudo añadir el ejercicio: ${error.message}`);
}

export async function updateManagedWorkoutExercise(input: WorkoutExerciseUpdateInput) {
  if (!input.templateExerciseId || !input.exerciseId) {
    throw new Error("Falta ejercicio de rutina o ejercicio base.");
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("workout_template_exercises")
    .update({
      exercise_id: input.exerciseId,
      sets: parseInteger(input.sets, 3),
      reps: input.reps.trim() || "8-12",
      tempo: input.tempo?.trim() || null,
      rest_seconds: parseInteger(input.restSeconds, 90),
      notes: input.notes.trim() || null,
      swap_rules: {
        editable: true,
        targetRir: input.targetRir?.trim() || null,
        intensityTechnique: input.intensityTechnique?.trim() || null,
      },
    })
    .eq("id", input.templateExerciseId);

  if (error) {
    throw new Error(`No se pudo actualizar el ejercicio: ${error.message}`);
  }
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

export async function createManagedWorkoutBlueprint(input: WorkoutBlueprintInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de generar una rutina.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del bloque es obligatorio.");
  }

  const daysPerWeek = Math.max(1, Math.min(7, parseInteger(input.daysPerWeek, 4)));
  const sessionMinutes = Math.max(35, Math.min(120, parseInteger(input.sessionMinutes, 60)));
  const injuries = splitList(input.injuries);
  const excludeMuscles = musclesToAvoidForInjuries(injuries);
  const plan = buildPeriodizedWorkoutPlan({
    goals: [input.goal],
    weeks: 12,
    daysPerWeek,
    sessionMinutes,
    experience: input.level,
    location: input.location,
    injuries,
  });

  const supabase = createServiceSupabaseClient();
  const templateResult = await supabase.from("workout_templates").insert({
    workspace_id: input.workspaceId,
    name,
    goal: plan.title,
    level: input.level,
    days_per_week: daysPerWeek,
    status: "draft",
  }).select("id").single();

  if (templateResult.error || !templateResult.data) {
    throw new Error(`No se pudo crear el bloque de 12 semanas: ${templateResult.error?.message ?? "sin respuesta"}`);
  }

  const daysPayload = plan.days.map((day) => ({
    template_id: templateResult.data.id,
    week_number: day.week,
    day_number: day.day,
    title: `${day.focus} · ${day.phase}`,
    notes: [
      day.intensity,
      ...day.blocks.map((block) => `${block.type}: ${block.minutes} min · ${block.prescription}`),
    ].filter(Boolean).join("\n"),
  }));

  const daysResult = await supabase
    .from("workout_template_days")
    .insert(daysPayload)
    .select("id,week_number,day_number,title");
  if (daysResult.error || !daysResult.data) {
    throw new Error(`Se creo el programa, pero no sus dias: ${daysResult.error?.message ?? "sin respuesta"}`);
  }

  const exerciseResult = await supabase
    .from("exercises")
    .select("id,name,muscle_groups,equipment,locations,difficulty,is_base_library,workspace_id")
    .or(`workspace_id.eq.${input.workspaceId},workspace_id.is.null`)
    .limit(160);

  let exercisesCreated = 0;
  if (!exerciseResult.error && exerciseResult.data?.length) {
    const exercisePayload = daysResult.data.flatMap((day) => {
      const planDay = plan.days.find((item) => item.week === day.week_number && item.day === day.day_number);
      if (!planDay) return [];

      return selectExercisesForDay(exerciseResult.data as ExerciseCandidate[], {
        focus: planDay.focus,
        week: planDay.week,
        goal: input.goal,
        location: input.location,
        level: input.level,
        excludeMuscles,
      }).map(({ exercise, prescription }, index) => ({
        day_id: day.id,
        exercise_id: exercise.id,
        sort_order: index + 1,
        sets: prescription.sets,
        reps: prescription.reps,
        tempo: prescription.tempo,
        rest_seconds: prescription.restSeconds,
        notes: prescription.notes,
        swap_rules: {
          targetMuscles: targetMusclesForFocus(planDay.focus),
          source: "auto_blueprint",
          editable: true,
        },
      }));
    });

    if (exercisePayload.length) {
      const insertedExercises = await supabase.from("workout_template_exercises").insert(exercisePayload);
      if (insertedExercises.error) {
        console.error("Unable to auto-fill workout exercises", insertedExercises.error.message);
      } else {
        exercisesCreated = exercisePayload.length;
      }
    }
  }

  return { templateId: templateResult.data.id, daysCreated: daysPayload.length, exercisesCreated };
}

export async function createQuarterlyModuleLibrary(input: QuarterlyModuleLibraryInput) {
  if (!input.workspaceId) {
    throw new Error("Selecciona una marca antes de crear la biblioteca trimestral.");
  }

  const created: Array<{ daysPerWeek: number; templateId: string; daysCreated: number; exercisesCreated: number }> = [];
  const skipped: number[] = [];
  const supabase = createServiceSupabaseClient();

  for (const daysPerWeek of [3, 4, 5, 6, 7]) {
    const name = `Modulo 3 meses · ${daysPerWeek} dias/semana`;
    const existing = await supabase
      .from("workout_templates")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("name", name)
      .maybeSingle();

    if (existing.data?.id) {
      skipped.push(daysPerWeek);
      continue;
    }

    const result = await createManagedWorkoutBlueprint({
      workspaceId: input.workspaceId,
      name,
      goal: input.goal,
      level: input.level,
      location: input.location,
      daysPerWeek: String(daysPerWeek),
      sessionMinutes: input.sessionMinutes,
      injuries: "",
    });

    created.push({ daysPerWeek, ...result });
  }

  return { created, skipped };
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

/** Deep-clones a workout template (days + exercises) into a workspace as a draft. */
export async function cloneWorkoutTemplate(templateId: string, workspaceId: string) {
  if (!templateId || !workspaceId) throw new Error("Falta la rutina o la marca destino.");

  const supabase = createServiceSupabaseClient();
  const { data: source, error } = await supabase
    .from("workout_templates")
    .select("name,goal,level,days_per_week,duration_weeks,phase_structure,rotation_rules")
    .eq("id", templateId)
    .maybeSingle();
  if (error || !source) throw new Error("No se encontró la rutina de origen.");

  const { data: created, error: createError } = await supabase
    .from("workout_templates")
    .insert({
      workspace_id: workspaceId,
      name: `${source.name} (copia)`,
      goal: source.goal,
      level: source.level,
      days_per_week: source.days_per_week,
      duration_weeks: source.duration_weeks,
      phase_structure: source.phase_structure,
      rotation_rules: source.rotation_rules,
      status: "draft",
    })
    .select("id")
    .single();
  if (createError) throw new Error(`No se pudo clonar la rutina: ${createError.message}`);

  const { data: days } = await supabase
    .from("workout_template_days")
    .select("id,week_number,day_number,title,notes")
    .eq("template_id", templateId);

  const dayIdMap = new Map<string, string>();
  for (const day of days ?? []) {
    const { data: newDay, error: dayError } = await supabase
      .from("workout_template_days")
      .insert({
        template_id: created.id,
        week_number: day.week_number,
        day_number: day.day_number,
        title: day.title,
        notes: day.notes,
      })
      .select("id")
      .single();
    if (dayError) throw new Error(`No se pudo copiar un día: ${dayError.message}`);
    dayIdMap.set(day.id, newDay.id);
  }

  const oldDayIds = [...dayIdMap.keys()];
  if (oldDayIds.length) {
    const { data: exercises } = await supabase
      .from("workout_template_exercises")
      .select("day_id,exercise_id,sort_order,sets,reps,tempo,rest_seconds,notes,swap_rules,block_type,load_guidance,target_rir,video_required")
      .in("day_id", oldDayIds);

    const rows = (exercises ?? [])
      .map((exercise) => {
        const dayId = dayIdMap.get(exercise.day_id);
        if (!dayId) return null;
        return {
          day_id: dayId,
          exercise_id: exercise.exercise_id,
          sort_order: exercise.sort_order,
          sets: exercise.sets,
          reps: exercise.reps,
          tempo: exercise.tempo,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
          swap_rules: exercise.swap_rules,
          block_type: exercise.block_type,
          load_guidance: exercise.load_guidance,
          target_rir: exercise.target_rir,
          video_required: exercise.video_required,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length) {
      const { error: exerciseError } = await supabase.from("workout_template_exercises").insert(rows);
      if (exerciseError) throw new Error(`No se pudieron copiar los ejercicios: ${exerciseError.message}`);
    }
  }

  return { id: created.id as string };
}

/** Toggles a workout template between draft and active (publish/unpublish). */
export async function setWorkoutTemplateStatus(
  templateId: string,
  status: "draft" | "active" | "archived",
  workspaceId?: string,
) {
  if (!templateId) throw new Error("Falta la rutina.");
  const supabase = createServiceSupabaseClient();

  if (workspaceId) {
    const { data: template } = await supabase
      .from("workout_templates")
      .select("id")
      .eq("id", templateId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!template) throw new Error("La rutina no pertenece a tu marca.");
  }

  const { error } = await supabase.from("workout_templates").update({ status }).eq("id", templateId);
  if (error) throw new Error(`No se pudo actualizar el estado: ${error.message}`);
}
