/**
 * Program-matching engine (MacroActive-style).
 *
 * Pure, deterministic, no I/O: given the member's quiz answers and the available
 * workout templates, pick the best-fitting program. The quiz already collects every
 * dimension (sex, goal, place, days/week, minutes, level, equipment); this module
 * normalises those answers to canonical tokens and ranks templates by a hard-filter →
 * soft-score → fallback-ladder strategy. The chosen templateId then flows into the
 * existing assignment path (assignWorkoutTemplateToMember → materializeWorkoutAssignment),
 * so there is no new rendering code — the engine only decides "which template".
 *
 * Tested in program-matcher.test.ts. See docs/program-engine.md for the full design.
 */

export type ProgramGoal = "fat_loss" | "hypertrophy" | "strength" | "recomposition" | "mobility";
export type ProgramLevel = "beginner" | "intermediate" | "advanced";
export type ProgramPlace = "gym" | "home" | "outdoor";
export type ProgramSex = "male" | "female" | "any";

/** Normalised inputs the matcher needs (derived from the onboarding quiz). */
export type QuizAnswers = {
  sex: ProgramSex;
  goal: ProgramGoal;
  place: ProgramPlace;
  daysPerWeek: number; // 3-7
  sessionMinutes: number; // bucketed to 30 | 60
  experience: ProgramLevel;
  equipment?: string[];
};

/** The subset of a workout template the matcher reasons about. */
export type MatchTemplate = {
  id: string;
  status?: string | null;
  daysPerWeek: number | null;
  goalTag?: ProgramGoal | string | null;
  level?: ProgramLevel | string | null;
  targetSex?: ProgramSex | string | null;
  location?: ProgramPlace | string | null;
  sessionMinutes?: number | null;
  requiredEquipment?: string[] | null;
};

const strip = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Spanish/English label → canonical goal. Falls back to recomposition. */
export function normalizeGoal(raw: string | null | undefined): ProgramGoal {
  const v = strip(raw ?? "");
  if (/fat[_\s-]?loss|definicion|defin|perder|cut|deficit|adelgaz/.test(v)) return "fat_loss";
  if (/hypertrophy|hipertrofia|volumen|masa|muscle|ganar?\s?musculo|bulk/.test(v)) return "hypertrophy";
  if (/strength|fuerza|rendimiento|performance|powerlifting/.test(v)) return "strength";
  if (/recomp|recomposicion|maintenance|mantenimiento/.test(v)) return "recomposition";
  if (/mobility|movilidad|salud|health|wellness|flex/.test(v)) return "mobility";
  return "recomposition";
}

/** Spanish/English label → canonical level. Falls back to beginner. */
export function normalizeLevel(raw: string | null | undefined): ProgramLevel {
  const v = strip(raw ?? "");
  if (/advanced|avanzado|elite|experto/.test(v)) return "advanced";
  if (/intermediate|intermedio|medio/.test(v)) return "intermediate";
  return "beginner";
}

export function normalizeSex(raw: string | null | undefined): ProgramSex {
  const v = strip(raw ?? "");
  if (/^m|male|hombre|masculino/.test(v)) return "male";
  if (/^f|female|mujer|femenino/.test(v)) return "female";
  return "any";
}

export function normalizePlace(raw: string | null | undefined): ProgramPlace {
  const v = strip(raw ?? "");
  if (/gym|gimnasio/.test(v)) return "gym";
  if (/outdoor|aire|calle|parque|exterior/.test(v)) return "outdoor";
  return "home";
}

/** The matrix uses two session buckets; the quiz offers 30/45/60/75/90. */
export function bucketMinutes(minutes: number | null | undefined): 30 | 60 {
  return (minutes ?? 60) <= 45 ? 30 : 60;
}

function isActive(t: MatchTemplate) {
  return !t.status || t.status === "active";
}

/** Home/outdoor templates may require equipment the member doesn't have. */
function equipmentOk(required: string[] | null | undefined, owned: string[] | undefined) {
  if (!required || required.length === 0) return true;
  const have = new Set((owned ?? []).map(strip));
  return required.every((r) => have.has(strip(r)));
}

function score(t: MatchTemplate, q: QuizAnswers): number {
  let s = 0;
  const goal = t.goalTag ? normalizeGoal(String(t.goalTag)) : null;
  if (goal === q.goal) s += 100;
  else if (goal) s += 35; // wrong-but-tagged goal still beats untagged
  const level = t.level ? normalizeLevel(String(t.level)) : null;
  if (level === q.experience) s += 30;
  else if (level) s += 12;
  if (t.sessionMinutes != null && bucketMinutes(t.sessionMinutes) === q.sessionMinutes) s += 15;
  if (t.targetSex && normalizeSex(String(t.targetSex)) === q.sex) s += 12;
  if (t.location && normalizePlace(String(t.location)) === q.place) s += 10;
  return s;
}

type Filter = (t: MatchTemplate, q: QuizAnswers) => boolean;

const fSex: Filter = (t, q) => !t.targetSex || normalizeSex(String(t.targetSex)) === "any" || normalizeSex(String(t.targetSex)) === q.sex;
const fPlace: Filter = (t, q) => !t.location || normalizePlace(String(t.location)) === q.place;
const fDays: Filter = (t, q) => t.daysPerWeek === q.daysPerWeek;
const fDaysApprox: Filter = (t, q) => t.daysPerWeek != null && Math.abs(t.daysPerWeek - q.daysPerWeek) <= 1;
const fMinutes: Filter = (t, q) => t.sessionMinutes == null || bucketMinutes(t.sessionMinutes) === q.sessionMinutes;
const fEquip: Filter = (t, q) => equipmentOk(t.requiredEquipment, q.equipment);

/** Hard-filter ladder: each rung drops/relaxes one constraint until a pool is non-empty. */
const LADDER: Filter[][] = [
  [fSex, fPlace, fDays, fMinutes, fEquip], // exact
  [fSex, fPlace, fDays, fEquip], // drop minutes
  [fPlace, fDays, fEquip], // drop sex
  [fDays, fEquip], // drop place
  [fDays], // days only
  [fDaysApprox], // days ±1
];

export type MatchResult = {
  templateId: string | null;
  score: number;
  rung: number; // which fallback rung matched (0 = exact); -1 if nothing
};

/**
 * Pick the best template for the member. Returns null when nothing remotely fits
 * (caller leaves the member "pending" for the coach, as today).
 */
export function selectProgram(q: QuizAnswers, templates: MatchTemplate[]): MatchResult {
  const active = templates.filter(isActive);
  for (let rung = 0; rung < LADDER.length; rung += 1) {
    const filters = LADDER[rung];
    const pool = active.filter((t) => filters.every((f) => f(t, q)));
    if (!pool.length) continue;
    let best = pool[0];
    let bestScore = score(best, q) - (rung === 5 ? 25 : 0); // penalise ±1 days
    for (const t of pool.slice(1)) {
      const sc = score(t, q) - (rung === 5 ? 25 : 0);
      if (sc > bestScore) {
        best = t;
        bestScore = sc;
      }
    }
    return { templateId: best.id, score: bestScore, rung };
  }
  return { templateId: null, score: 0, rung: -1 };
}
