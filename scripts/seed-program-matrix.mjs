#!/usr/bin/env node
/**
 * seed-program-matrix.mjs — populate the MacroActive-style PROGRAM MATRIX natively.
 *
 * Generates base-library workout_templates (workspace_id = null, is_base_library
 * semantics) across the matrix:
 *
 *     goal  × sex × place × days/week × minutes
 *
 * Each program is a 3-MONTH (M1/M2/M3) periodized block — mirroring MacroActive's
 * `Female Gain M2/5D/60/D3` naming — with one workout per training day per month.
 * Every day is filled with REAL exercises picked deterministically from the
 * `exercises` base library, filtered by location + the day's target muscles, with
 * sets/reps/rest sized by goal and an exercise count sized by session minutes.
 *
 * The day-split logic is re-implemented locally (mirrors lib/domain/workout-engine.ts
 * `splitByDays` + the 3 monthly phases) so this stays a standalone Node script with
 * no TS/build step. Token conventions (canonical goal/sex/place, ES↔EN muscle tokens)
 * mirror lib/domain/program-matcher.ts and lib/repositories/training-management.ts.
 *
 * SAFE BY DEFAULT: prints the matrix size + a sample program's full breakdown and
 * writes NOTHING. Pass --apply (with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 * to write. Idempotent: skips any template whose name already exists.
 *
 *   node scripts/seed-program-matrix.mjs                # dry-run (default)
 *   node scripts/seed-program-matrix.mjs --sample=full  # dry-run, dump ALL day rows of sample
 *   node scripts/seed-program-matrix.mjs --apply        # write to Supabase
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

// ───────────────────────────────────────── matrix definition ────────────────
const GOALS = ["hypertrophy", "fat_loss", "recomposition"];
const SEXES = ["male", "female"];
const PLACES = ["gym", "home"];
const DAYS = [3, 4, 5, 6];
const MINUTES = [30, 60];

// 3 monthly phases (mirrors workout-engine.ts phaseForWeek / buildPeriodizedWorkoutPlan).
// We materialize ONE representative week per month (the MacroActive M1/M2/M3 shape)
// instead of all 12 weeks, so a program is `3 months × daysPerWeek` day rows.
const MONTHS = [
  { month: 1, weeksLabel: "1-4", phase: "Base tecnica", focusNote: "Patrones, volumen base y adherencia", intensity: "RIR 2-3 · tempo controlado", volume: 0.95, repBias: 0 },
  { month: 2, weeksLabel: "5-8", phase: "Progresion", focusNote: "Sobrecarga medible y mas series efectivas", intensity: "RIR 1-2 · descanso medio/alto", volume: 1.0, repBias: -1 },
  { month: 3, weeksLabel: "9-12", phase: "Especializacion", focusNote: "Bloques fuertes, consolidacion y descarga", intensity: "RIR 0-2 · top set opcional", volume: 1.05, repBias: -1 },
];

// Day-splits by days/week (verbatim from lib/domain/workout-engine.ts splitByDays).
const SPLIT_BY_DAYS = {
  3: ["Push", "Pull", "Legs"],
  4: ["Upper strength", "Lower strength", "Upper volume", "Lower volume"],
  5: ["Push", "Pull", "Legs", "Upper pump", "Conditioning"],
  6: ["Push", "Pull", "Legs", "Push volume", "Pull volume", "Legs volume"],
};

// Spanish display goal (matches workout_templates.goal free-text used elsewhere).
const GOAL_LABEL = { hypertrophy: "Hipertrofia", fat_loss: "Definicion", recomposition: "Recomposicion" };
const SEX_LABEL = { male: "Hombre", female: "Mujer" };
const PLACE_LABEL = { gym: "Gym", home: "Casa" };

// ───────────────────────────── muscle taxonomy (ES + EN tokens in the library) ──
// Mirrors focusMuscleMap in training-management.ts but expressed in the EXACT tokens
// present in the exercises table (verified via SQL: English from free-exercise-db +
// Spanish brand tokens). Each focus → ordered list of muscle "buckets".
const MUSCLE = {
  chest: ["chest", "Pecho"],
  back: ["lats", "middle back", "lower back", "Espalda", "Espalda baja"],
  shoulders: ["shoulders", "Hombros"],
  biceps: ["biceps", "Biceps", "Bíceps"],
  triceps: ["triceps", "Triceps", "Tríceps"],
  quads: ["quadriceps", "Cuádriceps"],
  hamstrings: ["hamstrings", "Femoral", "Isquios"],
  glutes: ["glutes", "Glúteos"],
  calves: ["calves", "Gemelos"],
  core: ["abdominals", "Core"],
};

// For each split-focus, the ordered muscle buckets to draw from (compound→accessory).
const FOCUS_PLAN = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps", "core"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  "upper strength": ["chest", "back", "shoulders"],
  "lower strength": ["quads", "hamstrings", "glutes"],
  "upper volume": ["shoulders", "chest", "back", "biceps", "triceps"],
  "lower volume": ["hamstrings", "glutes", "quads", "calves"],
  "push volume": ["shoulders", "chest", "triceps"],
  "pull volume": ["back", "biceps", "core"],
  "legs volume": ["hamstrings", "glutes", "quads", "calves"],
  "upper pump": ["biceps", "triceps", "shoulders", "chest"],
  conditioning: ["core", "quads", "shoulders"],
};

// female programs nudge volume toward glutes/hamstrings/shoulders (MacroActive-style),
// male toward chest/back/arms — by reordering the bucket priority, deterministically.
const SEX_PRIORITY = {
  female: ["glutes", "hamstrings", "shoulders", "core", "quads"],
  male: ["chest", "back", "shoulders", "triceps", "biceps", "quads"],
};

// Equipment tokens (ES+EN) considered "home-friendly". gym = anything.
const HOME_EQUIPMENT = new Set(
  ["body only", "dumbbell", "bands", "kettlebells", "medicine ball", "exercise ball", "foam roll",
   "Peso corporal", "Mancuernas", "Banda elástica", "Kettlebell", "Comba", "Cuerda", "Rueda"].map(norm),
);

// Exercises-per-day sizing by session minutes (excludes implicit warm-up/mobility).
const COUNT_BY_MINUTES = { 30: 4, 60: 6 };

// ─────────────────────────────────────────── helpers ────────────────────────
function norm(value) {
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function readArgs() {
  const args = process.argv.slice(2);
  const sampleArg = args.find((a) => a.startsWith("--sample="));
  const fixtureArg = args.find((a) => a.startsWith("--fixture="));
  return {
    apply: args.includes("--apply"),
    sampleFull: sampleArg ? sampleArg.split("=")[1] === "full" : false,
    // Offline dry-run only: read the exercise library from a local JSON snapshot
    // instead of Supabase, so the matrix can be sampled with real ids without creds.
    fixture: fixtureArg ? fixtureArg.split("=")[1] : null,
  };
}

async function loadEnvFile() {
  try {
    const envText = await readFile(".env.local", "utf8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  } catch {
    // optional
  }
}

// Deterministic prescription by goal + month (mirrors prescriptionForExercise in
// training-management.ts; isMain = first two slots get the heavier compound dose).
function prescriptionFor(goal, monthSpec, slotIndex) {
  const isMain = slotIndex < 2;
  const bias = monthSpec.repBias; // 0 / -1 / -1 → lower reps as the block intensifies

  if (goal === "fat_loss") {
    return {
      sets: isMain ? 3 : 3,
      reps: isMain ? `${10 + bias}-${12 + bias}` : `${12 + bias}-${15 + bias}`,
      restSeconds: isMain ? 75 : 45,
      tempo: "2-0-2",
      targetRir: "1-2",
      notes: "Densidad y tecnica. Superserie opcional en accesorios; no sacrificar rango por fatiga.",
    };
  }
  if (goal === "hypertrophy") {
    return {
      sets: isMain ? 4 : 3,
      reps: isMain ? `${8 + bias}-${12 + bias}` : `${10 + bias}-${15 + bias}`,
      restSeconds: isMain ? 120 : 75,
      tempo: "3-1-1",
      targetRir: monthSpec.month >= 3 ? "0-2" : "1-3",
      notes: isMain ? "Doble progresion: completar rango alto antes de subir carga." : "Buscar bombeo y control escapular/articular.",
    };
  }
  // recomposition (balanced strength + hypertrophy)
  return {
    sets: isMain ? 4 : 3,
    reps: isMain ? `${6 + bias}-${10 + bias}` : `${10 + bias}-${12 + bias}`,
    restSeconds: isMain ? 120 : 60,
    tempo: "3-1-1",
    targetRir: "1-2",
    notes: isMain ? "Fuerza-hipertrofia: top set y back-off controlados." : "Accesorio para volumen y simetria.",
  };
}

// Build, per location, a muscle-bucket → ordered exercise list, deterministically.
// Ordering: compound first, then by name (stable, reproducible across runs).
function indexExercises(rows, place) {
  const byBucket = new Map(); // bucketKey → [{id,name,equipment}]
  for (const key of Object.keys(MUSCLE)) byBucket.set(key, []);

  const usable = rows.filter((ex) => {
    const locs = (ex.locations ?? []).map(norm);
    if (!locs.includes(place)) return false;
    if (place === "home") {
      const eq = (ex.equipment ?? []).map(norm);
      // home-friendly if every equipment token is home-ok (or it needs no equipment)
      if (eq.length && !eq.every((e) => HOME_EQUIPMENT.has(e))) return false;
    }
    return true;
  });

  for (const ex of usable) {
    const muscles = (ex.muscle_groups ?? []).map(norm);
    for (const [bucket, tokens] of Object.entries(MUSCLE)) {
      const normTokens = tokens.map(norm);
      if (muscles.some((m) => normTokens.some((t) => m === t || m.includes(t) || t.includes(m)))) {
        byBucket.get(bucket).push(ex);
      }
    }
  }

  for (const [bucket, list] of byBucket) {
    list.sort((a, b) => {
      const an = nonStrength(a) ? 1 : 0;
      const bn = nonStrength(b) ? 1 : 0;
      if (an !== bn) return an - bn; // real strength lifts first → mains are never stretch/plyo
      const am = a.mechanic === "compound" ? 0 : 1;
      const bm = b.mechanic === "compound" ? 0 : 1;
      if (am !== bm) return am - bm;
      return String(a.name).localeCompare(String(b.name));
    });
    byBucket.set(bucket, list);
  }
  return byBucket;
}

// Stretches / plyometrics / cardio are demoted so they never fill a "main" slot
// (works on the fixture via name, and live via movement_category too).
function nonStrength(ex) {
  const n = norm(ex.name ?? "");
  const cat = norm(ex.movement_category ?? "");
  if (/stretch|estira|plyo|pliom|jump|salto|\bhop\b|burpee|flutter|mountain climber|\bskip\b|sprint|\bjog\b|jumping|bound|wall sit/.test(n)) return true;
  if (/stretching|plyometrics|cardio/.test(cat)) return true;
  return false;
}

// Pick `count` distinct exercises for a day: round-robin across the focus's muscle
// buckets (sex-prioritized), advancing a per-bucket cursor that rotates by month so
// M1/M2/M3 differ. Fully deterministic; guarantees no duplicate within a day.
function pickDayExercises(byBucket, { focus, sex, monthIndex, count }) {
  const focusKey = norm(focus);
  let buckets = FOCUS_PLAN[focusKey] ?? FOCUS_PLAN[Object.keys(FOCUS_PLAN).find((k) => focusKey.includes(k.split(" ")[0])) ?? "push"] ?? ["chest", "back", "quads"];

  // Stable sex-priority reordering: buckets in SEX_PRIORITY[sex] first (in that order),
  // then the rest in their original focus order.
  const pref = SEX_PRIORITY[sex] ?? [];
  buckets = [...buckets].sort((a, b) => {
    const ai = pref.indexOf(a); const bi = pref.indexOf(b);
    const av = ai === -1 ? 99 : ai; const bv = bi === -1 ? 99 : bi;
    return av - bv;
  });

  const picked = [];
  const seen = new Set();
  const cursor = new Map(buckets.map((b) => [b, monthIndex])); // month rotates the start
  let guard = 0;
  while (picked.length < count && guard < count * buckets.length + buckets.length + 50) {
    guard += 1;
    const bucket = buckets[picked.length % buckets.length];
    const pool = byBucket.get(bucket) ?? [];
    if (!pool.length) { // skip empty bucket but keep advancing the wheel
      buckets = buckets.filter((b) => (byBucket.get(b) ?? []).length);
      if (!buckets.length) break;
      continue;
    }
    let c = cursor.get(bucket) ?? 0;
    let attempts = 0;
    let chosen = null;
    while (attempts < pool.length) {
      const cand = pool[c % pool.length];
      c += 1; attempts += 1;
      if (!seen.has(cand.id)) { chosen = cand; break; }
    }
    cursor.set(bucket, c);
    if (chosen) {
      seen.add(chosen.id);
      picked.push({ exercise: chosen, bucket });
    } else {
      // bucket exhausted of unseen → drop it from the wheel
      buckets = buckets.filter((b) => b !== bucket);
      if (!buckets.length) break;
    }
  }
  return picked;
}

function templateName({ goal, sex, place, days, minutes }) {
  // MacroActive-flavoured: "[Goal] [Sex] [Place] [N]D/[min]"
  return `${GOAL_LABEL[goal]} ${SEX_LABEL[sex]} ${PLACE_LABEL[place]} ${days}D/${minutes}`;
}

// Build the full in-memory program (template + day rows + exercise rows) for a combo.
function buildProgram(combo, byBucket) {
  const { goal, sex, place, days, minutes } = combo;
  const split = SPLIT_BY_DAYS[days];
  const perDay = COUNT_BY_MINUTES[minutes];
  const name = templateName(combo);

  const dayRows = [];
  const exerciseRows = []; // {dayKey, ...}
  for (let mi = 0; mi < MONTHS.length; mi += 1) {
    const m = MONTHS[mi];
    split.forEach((focus, di) => {
      const dayKey = `M${m.month}-D${di + 1}`;
      const picks = pickDayExercises(byBucket, { focus, sex, monthIndex: mi, count: perDay });
      const estMinutes = minutes;
      dayRows.push({
        // week_number encodes the month's representative week (2/6/10) to satisfy the
        // (template_id, week_number, day_number) UNIQUE while staying inside the month.
        week_number: m.month * 4 - 2,
        day_number: di + 1,
        month_number: m.month,
        phase_title: m.phase,
        focus,
        intensity: m.intensity,
        estimated_minutes: estMinutes,
        title: `${SEX_LABEL[sex]} ${GOAL_LABEL[goal]} M${m.month}/${days}D/${minutes}/D${di + 1} · ${focus}`,
        notes: `${m.phase} (sem ${m.weeksLabel}) · ${m.focusNote} · ${m.intensity}`,
        _key: dayKey,
        _exercises: picks,
      });
      picks.forEach(({ exercise, bucket }, slot) => {
        const rx = prescriptionFor(goal, m, slot);
        exerciseRows.push({
          dayKey,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          bucket,
          sort_order: slot + 1,
          block_type: slot < 2 ? "main" : "accessory",
          sets: rx.sets,
          reps: rx.reps,
          tempo: rx.tempo,
          rest_seconds: rx.restSeconds,
          target_rir: rx.targetRir,
          notes: rx.notes,
        });
      });
    });
  }

  return {
    name,
    goal,
    sex,
    place,
    days,
    minutes,
    template: {
      workspace_id: null,
      name,
      goal: `${GOAL_LABEL[goal]} 12 semanas`,
      level: "intermediate",
      days_per_week: days,
      status: "active",
      duration_weeks: 12,
      goal_tag: goal,
      target_sex: sex,
      location: place,
      session_minutes: minutes,
      required_equipment: [],
      phase_structure: MONTHS.map((m) => ({ month: m.month, title: m.phase, weeks: m.weeksLabel, focus: m.focusNote })),
    },
    dayRows,
    exerciseRows,
  };
}

function* matrix() {
  for (const goal of GOALS)
    for (const sex of SEXES)
      for (const place of PLACES)
        for (const days of DAYS)
          for (const minutes of MINUTES)
            yield { goal, sex, place, days, minutes };
}

async function main() {
  const { apply, sampleFull, fixture } = readArgs();
  await loadEnvFile();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasEnv = Boolean(url && serviceRoleKey);

  if (apply && !hasEnv) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  }
  if (apply && fixture) {
    throw new Error("--fixture es solo para dry-run offline; no se puede escribir con --apply desde un fixture.");
  }

  // We need the exercise library to build real programs. Sources, in order:
  //   1) --fixture=<path>  → offline dry-run from a local JSON snapshot
  //   2) live Supabase read (when creds are present)
  //   3) neither → can only report the matrix SIZE
  let supabase = null;
  let allRows = [];

  if (fixture) {
    allRows = JSON.parse(await readFile(fixture, "utf8"));
  } else if (hasEnv) {
    supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("exercises")
        .select("id,name,muscle_groups,equipment,locations,difficulty,mechanic,movement_category,is_base_library,workspace_id")
        .is("workspace_id", null)
        .order("name", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`No se pudieron leer ejercicios: ${error.message}`);
      if (!data?.length) break;
      allRows.push(...data);
      if (data.length < pageSize) break;
    }
  } else {
    console.log(JSON.stringify({
      mode: "dry-run",
      note: "Sin credenciales ni --fixture: solo calculo el TAMANO de la matriz. Exporta NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (o pasa --fixture=ruta.json) para muestrear ejercicios reales.",
      matrix: { goals: GOALS, sexes: SEXES, places: PLACES, days: DAYS, minutes: MINUTES },
      programs: GOALS.length * SEXES.length * PLACES.length * DAYS.length * MINUTES.length,
    }, null, 2));
    return;
  }
  const validIds = new Set(allRows.map((r) => r.id));

  const byBucketByPlace = { gym: indexExercises(allRows, "gym"), home: indexExercises(allRows, "home") };

  // Build every program in memory.
  const programs = [...matrix()].map((combo) => buildProgram(combo, byBucketByPlace[combo.place]));

  // Validate: every referenced exercise_id exists; flag thin days.
  const thinDays = [];
  let missingRefs = 0;
  for (const p of programs) {
    for (const ex of p.exerciseRows) if (!validIds.has(ex.exercise_id)) missingRefs += 1;
    for (const d of p.dayRows) {
      if (d._exercises.length < COUNT_BY_MINUTES[p.minutes]) {
        thinDays.push({ program: p.name, day: d._key, got: d._exercises.length, want: COUNT_BY_MINUTES[p.minutes] });
      }
    }
  }

  const totalDays = programs.reduce((n, p) => n + p.dayRows.length, 0);
  const totalExercises = programs.reduce((n, p) => n + p.exerciseRows.length, 0);

  // Pick a representative sample program for the report.
  const sample = programs.find((p) => p.goal === "hypertrophy" && p.sex === "female" && p.place === "gym" && p.days === 5 && p.minutes === 60) ?? programs[0];
  const sampleView = {
    name: sample.name,
    tags: { goal_tag: sample.template.goal_tag, target_sex: sample.template.target_sex, location: sample.template.location, session_minutes: sample.template.session_minutes, days_per_week: sample.template.days_per_week, status: sample.template.status },
    months: MONTHS.map((m) => m.month),
    daysPerMonth: sample.days,
    exercisesPerDay: COUNT_BY_MINUTES[sample.minutes],
    sampleDays: (sampleFull ? sample.dayRows : sample.dayRows.filter((d) => d.month_number === 1)).map((d) => ({
      day: d._key,
      title: d.title,
      focus: d.focus,
      phase: d.phase_title,
      exercises: sample.exerciseRows.filter((e) => e.dayKey === d._key).map((e) => `${e.sort_order}. [${e.block_type}/${e.bucket}] ${e.exercise_name} — ${e.sets}x${e.reps} rest ${e.rest_seconds}s RIR ${e.target_rir}`),
    })),
  };

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    libraryExercisesLoaded: allRows.length,
    matrix: { goals: GOALS, sexes: SEXES, places: PLACES, days: DAYS, minutes: MINUTES },
    totals: { programs: programs.length, days: totalDays, exerciseRows: totalExercises },
    validation: { missingExerciseRefs: missingRefs, thinDaysCount: thinDays.length, thinDaysSample: thinDays.slice(0, 8) },
    sampleProgram: sampleView,
  }, null, 2));

  if (!apply) {
    console.log("\nDry-run completo. Nada escrito. Ejecuta con --apply para poblar Supabase.");
    return;
  }
  if (missingRefs > 0) {
    throw new Error(`Abortado: ${missingRefs} referencias a exercise_id inexistentes.`);
  }

  // ── WRITE (idempotent by template name) ────────────────────────────────────
  let createdPrograms = 0;
  let skipped = 0;
  let createdDays = 0;
  let createdExercises = 0;

  for (const p of programs) {
    const existing = await supabase
      .from("workout_templates")
      .select("id")
      .is("workspace_id", null)
      .eq("name", p.name)
      .maybeSingle();
    if (existing.data?.id) { skipped += 1; continue; }

    const tmpl = await supabase.from("workout_templates").insert(p.template).select("id").single();
    if (tmpl.error || !tmpl.data) throw new Error(`No se pudo crear "${p.name}": ${tmpl.error?.message ?? "sin respuesta"}`);
    const templateId = tmpl.data.id;
    createdPrograms += 1;

    const daysPayload = p.dayRows.map((d) => ({
      template_id: templateId,
      week_number: d.week_number,
      day_number: d.day_number,
      month_number: d.month_number,
      phase_title: d.phase_title,
      focus: d.focus,
      intensity: d.intensity,
      estimated_minutes: d.estimated_minutes,
      title: d.title,
      notes: d.notes,
    }));
    const daysRes = await supabase.from("workout_template_days").insert(daysPayload).select("id,week_number,day_number");
    if (daysRes.error || !daysRes.data) throw new Error(`"${p.name}": dias fallaron: ${daysRes.error?.message ?? "sin respuesta"}`);
    createdDays += daysRes.data.length;

    // Map back inserted day ids by (week_number, day_number) → our dayKey.
    const dayIdByKey = new Map();
    for (const d of p.dayRows) {
      const match = daysRes.data.find((r) => r.week_number === d.week_number && r.day_number === d.day_number);
      if (match) dayIdByKey.set(d._key, match.id);
    }

    const exPayload = p.exerciseRows.map((e) => ({
      day_id: dayIdByKey.get(e.dayKey),
      exercise_id: e.exercise_id,
      sort_order: e.sort_order,
      block_type: e.block_type,
      sets: e.sets,
      reps: e.reps,
      tempo: e.tempo,
      rest_seconds: e.rest_seconds,
      target_rir: e.target_rir,
      notes: e.notes,
      swap_rules: { source: "seed_program_matrix", bucket: e.bucket, editable: true },
    })).filter((row) => row.day_id);

    for (let i = 0; i < exPayload.length; i += 200) {
      const chunk = exPayload.slice(i, i + 200);
      const exRes = await supabase.from("workout_template_exercises").insert(chunk);
      if (exRes.error) throw new Error(`"${p.name}": ejercicios fallaron: ${exRes.error.message}`);
      createdExercises += chunk.length;
    }
    console.log(`✓ ${p.name} — ${daysRes.data.length} dias, ${exPayload.length} ejercicios`);
  }

  console.log(JSON.stringify({ mode: "apply", createdPrograms, skipped, createdDays, createdExercises }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
