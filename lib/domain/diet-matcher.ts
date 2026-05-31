/**
 * Diet-template-matching engine (sibling of lib/domain/program-matcher.ts).
 *
 * Pure, deterministic, no I/O: given the member's quiz answers and the available
 * diet templates, pick the best-fitting nutrition plan. The onboarding quiz already
 * collects every dimension (goal, diet_style, allergies, meals_per_day); this module
 * normalises those answers to canonical tokens and ranks templates with the same
 * hard-filter → soft-score → fallback-ladder strategy as the program matcher.
 *
 * Two-layer logic, deliberately different from training:
 *   - HARD filters = exclusions only (diet style + allergies). A vegan must never be
 *     handed a vegetarian/omnivore plan; a nut-allergic member must never get a plan
 *     whose templates carry nuts. These are non-negotiable and never relaxed.
 *   - SOFT score = goal + meals_per_day fit, used to rank what survives the filters.
 *
 * The chosen templateId then flows into the existing assignment path
 * (assignDietTemplateToMember → materializeMealPlan), so there is no new rendering
 * code — the engine only decides "which template". Macro targets themselves still
 * come from calculateNutritionTargets (member weight/goal/activity), unchanged.
 *
 * Tested in diet-matcher.test.ts.
 */

export type DietGoal = "fat_loss" | "hypertrophy" | "recomposition";
/**
 * STYLE dimension — protein-source restrictiveness hierarchy:
 *   vegan ⊃ vegetarian ⊃ pescetarian ⊃ omnivore
 * (a stricter plan is always safe for a more permissive member). A pescetarian eats
 * like an ovo-lacto-vegetarian *plus* fish/shellfish, so it sits between omnivore and
 * vegetarian. See docs/diet-types.md.
 *
 * Diet *type* (the 8 quiz chips) ≠ this enum: gluten-free / dairy-free / halal are
 * orthogonal EXCLUSION flags and keto is a MACRO flag — all modelled separately below
 * so they can compose with any style.
 */
export type DietStyle = "omnivore" | "pescetarian" | "vegetarian" | "vegan";

/** Normalised inputs the matcher needs (derived from the onboarding quiz). */
export type DietQuizAnswers = {
  goal: DietGoal;
  dietStyle: DietStyle;
  mealsPerDay: number; // 3-5
  /** Canonical allergy tokens the member must avoid (e.g. "frutos-secos", "lactosa"). */
  allergies: string[];
  /** EXCLUSION dimension: member only accepts halal-certified plans. */
  halal?: boolean;
  /** MACRO dimension: member wants a ketogenic (very-low-carb, high-fat) plan. */
  keto?: boolean;
};

/** The subset of a diet template the matcher reasons about. */
export type DietMatchTemplate = {
  id: string;
  status?: string | null;
  goalTag?: DietGoal | string | null;
  dietStyle?: DietStyle | string | null;
  mealsPerDay?: number | null;
  /**
   * Free tags on the template, used for allergy safety + the orthogonal dimensions:
   * "sin-gluten"/"sin-lactosa" (exclusion), "halal" (certification), "keto" (macro).
   */
  tags?: string[] | null;
  /** Union of allergens present across the template's recipes, when known. */
  allergens?: string[] | null;
};

const strip = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Spanish/English label → canonical goal. Falls back to recomposition (mirrors program-matcher). */
export function normalizeGoal(raw: string | null | undefined): DietGoal {
  const v = strip(raw ?? "");
  if (/fat[_\s-]?loss|definicion|defin|perder|cut|deficit|adelgaz|grasa|loss/.test(v)) return "fat_loss";
  if (/hypertrophy|hipertrofia|volumen|masa|muscle|ganar?\s?musculo|bulk|gain|superavit/.test(v)) return "hypertrophy";
  return "recomposition";
}

/**
 * Spanish/English label → canonical diet style, most-restrictive token wins.
 * Falls back to omnivore. Order matters: vegan > vegetarian > pescetarian > omnivore.
 */
export function normalizeDietStyle(raw: string | null | undefined): DietStyle {
  const v = strip(raw ?? "");
  if (/vegan|vegana/.test(v)) return "vegan";
  if (/ovolacto|lacto[\s-]?ovo|vegetarian|vegetariana/.test(v)) return "vegetarian";
  if (/pesceta|pescata|pescetarian/.test(v)) return "pescetarian";
  return "omnivore";
}

/** Free-text diet-style label → halal flag (the quiz "Halal" chip). */
export function isHalalLabel(raw: string | null | undefined): boolean {
  return /\bhalal\b/.test(strip(raw ?? ""));
}

/** Free-text diet-style label → keto flag (the quiz "Keto / baja en carbos" chip). */
export function isKetoLabel(raw: string | null | undefined): boolean {
  return /\bketo\b|ketog|cetog|low[\s-]?carb|baja en carb/.test(strip(raw ?? ""));
}

/** Free-text allergy/diet label → canonical token used to match recipe/template allergens. */
export function normalizeAllergen(raw: string | null | undefined): string {
  const v = strip(raw ?? "");
  if (/frutos?\s?secos?|nuts?|almendr|nuez|nueces|cacahuet|peanut/.test(v)) return "frutos-secos";
  if (/lactos|lacteo|dairy|leche|milk/.test(v)) return "lactosa";
  if (/gluten|trigo|wheat/.test(v)) return "gluten";
  if (/marisco|shellfish|gamba|prawn|crustace/.test(v)) return "marisco";
  if (/huevo|egg/.test(v)) return "huevo";
  if (/soja|soy/.test(v)) return "soja";
  if (/pescado|fish/.test(v)) return "pescado";
  return v;
}

/** The quiz offers 3/4/5 meals; clamp anything else into that band. */
export function bucketMeals(meals: number | null | undefined): number {
  return Math.max(3, Math.min(5, Math.round(meals ?? 4)));
}

function isActive(t: DietMatchTemplate) {
  return !t.status || t.status === "active";
}

/**
 * Style compatibility: a template is OK if it is *no less restrictive* than the
 * member needs. A vegan member only accepts vegan templates; a vegetarian accepts
 * vegetarian or vegan; a pescetarian accepts pescetarian/vegetarian/vegan; an omnivore
 * accepts anything. (vegan ⊆ vegetarian ⊆ pescetarian ⊆ omnivore.) A vegetarian is
 * never served a pescetarian plan — it contains fish.
 */
const STYLE_RANK: Record<DietStyle, number> = { omnivore: 0, pescetarian: 1, vegetarian: 2, vegan: 3 };
function styleOk(template: DietStyle | string | null | undefined, need: DietStyle): boolean {
  if (!template) return need === "omnivore"; // untagged = omnivore; only omnivores accept it
  return STYLE_RANK[normalizeDietStyle(String(template))] >= STYLE_RANK[need];
}

/**
 * EXCLUSION dimension — halal: a halal member only accepts templates explicitly tagged
 * "halal". Non-halal members accept anything (a halal plan is still fine for them, so
 * this is one-directional, unlike the keto macro flag below). Modelled as a positive
 * certification tag rather than a "sin-<x>" exclusion. See docs/diet-types.md.
 */
function halalOk(t: DietMatchTemplate, need: boolean | undefined): boolean {
  if (!need) return true;
  return new Set((t.tags ?? []).map(strip)).has("halal");
}

/**
 * MACRO dimension — keto: an exact, two-way flag. A keto member must only get keto
 * templates (tagged "keto"); a non-keto member must never be handed a keto template
 * (its very-low-carb/high-fat split is a macro profile they did not ask for).
 */
function ketoOk(t: DietMatchTemplate, need: boolean | undefined): boolean {
  const templateIsKeto = new Set((t.tags ?? []).map(strip)).has("keto");
  return templateIsKeto === Boolean(need);
}

/**
 * Allergy safety: the template must not contain any of the member's allergens.
 * We trust an explicit "sin-<allergen>" tag, and otherwise require the allergen to
 * be absent from the template's known allergen union. With no allergen data we keep
 * the template (the coach review still gates publication) — matching today's flow.
 */
function allergiesOk(t: DietMatchTemplate, allergies: string[]): boolean {
  if (!allergies.length) return true;
  const tags = new Set((t.tags ?? []).map(strip));
  const allergens = new Set((t.allergens ?? []).map((a) => normalizeAllergen(a)));
  return allergies.every((raw) => {
    const a = normalizeAllergen(raw);
    if (tags.has(`sin-${a}`)) return true; // explicitly free of it
    return !allergens.has(a);
  });
}

function score(t: DietMatchTemplate, q: DietQuizAnswers): number {
  let s = 0;
  const goal = t.goalTag ? normalizeGoal(String(t.goalTag)) : null;
  if (goal === q.goal) s += 100;
  else if (goal) s += 35; // wrong-but-tagged goal still beats untagged
  if (t.mealsPerDay != null) {
    if (bucketMeals(t.mealsPerDay) === q.mealsPerDay) s += 30;
    else s += Math.max(0, 18 - Math.abs(bucketMeals(t.mealsPerDay) - q.mealsPerDay) * 9);
  }
  // Prefer the closest (least-restrictive) style so an omnivore is not needlessly
  // handed a vegan plan when an omnivore one fits equally on goal/meals.
  const style = t.dietStyle ? normalizeDietStyle(String(t.dietStyle)) : "omnivore";
  s += Math.max(0, 12 - (STYLE_RANK[style] - STYLE_RANK[q.dietStyle]) * 6);
  return s;
}

type Filter = (t: DietMatchTemplate, q: DietQuizAnswers) => boolean;

// Exclusions are always enforced (style + allergies + halal + keto). The ladder only
// relaxes the soft preferences (goal, meals) so we never serve an unsafe, off-diet or
// wrong-macro plan.
const fStyle: Filter = (t, q) => styleOk(t.dietStyle, q.dietStyle);
const fAllergy: Filter = (t, q) => allergiesOk(t, q.allergies);
const fHalal: Filter = (t, q) => halalOk(t, q.halal);
const fKeto: Filter = (t, q) => ketoOk(t, q.keto);
const fGoal: Filter = (t, q) => !t.goalTag || normalizeGoal(String(t.goalTag)) === q.goal;
const fMeals: Filter = (t, q) => t.mealsPerDay == null || bucketMeals(t.mealsPerDay) === q.mealsPerDay;
const fMealsApprox: Filter = (t, q) => t.mealsPerDay == null || Math.abs(bucketMeals(t.mealsPerDay) - q.mealsPerDay) <= 1;

// Hard exclusions enforced on every rung (never relaxed): style, allergies, halal, keto.
const HARD: Filter[] = [fStyle, fAllergy, fHalal, fKeto];

/** Hard-filter ladder: each rung relaxes one soft preference; HARD filters never drop. */
const LADDER: Filter[][] = [
  [...HARD, fGoal, fMeals], // exact
  [...HARD, fGoal, fMealsApprox], // meals ±1
  [...HARD, fGoal], // drop meals
  [...HARD], // goal-agnostic, still safe + on-diet + on-macro
];

export type DietMatchResult = {
  templateId: string | null;
  score: number;
  rung: number; // which fallback rung matched (0 = exact); -1 if nothing safe fits
};

/**
 * Pick the best diet template for the member. Returns null when nothing safe + on-diet
 * exists (caller leaves the member's nutrition "pending" for the coach, as today).
 */
export function selectDietTemplate(q: DietQuizAnswers, templates: DietMatchTemplate[]): DietMatchResult {
  const active = templates.filter(isActive);
  for (let rung = 0; rung < LADDER.length; rung += 1) {
    const filters = LADDER[rung];
    const pool = active.filter((t) => filters.every((f) => f(t, q)));
    if (!pool.length) continue;
    let best = pool[0];
    let bestScore = score(best, q) - rung * 5; // small penalty per relaxed rung
    for (const t of pool.slice(1)) {
      const sc = score(t, q) - rung * 5;
      if (sc > bestScore) {
        best = t;
        bestScore = sc;
      }
    }
    return { templateId: best.id, score: bestScore, rung };
  }
  return { templateId: null, score: 0, rung: -1 };
}
