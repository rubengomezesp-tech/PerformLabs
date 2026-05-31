/**
 * Centralized resolver for the image shown on every meal / recipe / food surface.
 *
 * Honesty over decoration: a curated `imageUrl` (set by the coach or imported)
 * always wins. When none exists we DO NOT invent a random stock photo — that was
 * the source of "wrong food" mismatches (a salmon dish showing a random pasta).
 * Instead callers render an on-brand placeholder (a tasteful tile with a dish-aware
 * icon), which is never misleading. The resolver stays the single swap point for a
 * future real source (curated Cloudinary uploads or generated photos in storage).
 */

export type RecipeImageInput = {
  /** Stable identifier (recipe id, meal item id, food id). Seeds the tile variant. */
  id: string;
  /** Recipe / meal / food name. Improves the dish-aware fallback icon. */
  name?: string;
  /** Meal moment ("desayuno", "comida", "cena", "snack", or English equivalents). */
  mealSlot?: string;
  /** Optional explicit category keyword (food library items carry a category). */
  keyword?: string;
  /** Curated/real image. When a non-empty string, it wins. */
  imageUrl?: string | null;
};

/**
 * Small, stable string hash (djb2). Deterministic across server/client so the
 * placeholder variant never reshuffles between renders.
 */
export function stableHash(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  // Force unsigned 32-bit so the seed is always a positive integer.
  return hash >>> 0;
}

/** Visual family for the on-brand fallback tile (drives the icon + tint shift). */
export type RecipeVisualKey = "breakfast" | "lunch" | "dinner" | "snack" | "meal";

/**
 * Picks a dish-aware visual family from the available signals (keyword, meal slot
 * and name). Best-effort and purely cosmetic — it only chooses an icon, never a
 * photo, so it can never be "wrong" in a misleading way.
 */
export function recipeVisualKey(input: RecipeImageInput): RecipeVisualKey {
  const text = [input.keyword, input.mealSlot, input.name].filter(Boolean).join(" ").toLowerCase();
  if (/(desayuno|breakfast|avena|oat|yogur|yogurt|tortilla|huevo|egg|caf[eé]|coffee|tostada|pancake)/.test(text)) return "breakfast";
  if (/(cena|dinner)/.test(text)) return "dinner";
  if (/(snack|merienda|fruta|fruit|nuez|nut|barrita|yogur snack)/.test(text)) return "snack";
  if (/(comida|almuerzo|lunch|bowl|arroz|rice|pollo|chicken|salm[oó]n|salmon|pescado|fish|pasta|carne|beef)/.test(text)) return "lunch";
  return "meal";
}

/**
 * Resolves the image URL for a recipe/meal/food. Returns the curated image when
 * set, otherwise `null` so the caller renders the on-brand placeholder. Never
 * returns a random/generated stock photo.
 */
export function recipeImageUrl(input: RecipeImageInput): string | null {
  const curated = (input.imageUrl ?? "").trim();
  return curated || null;
}
