/**
 * Centralized resolver for the image shown on every meal / recipe surface.
 *
 * Goal: EVERY recipe shows a relevant food photo, with zero config. A curated
 * `imageUrl` (set by the coach or imported) always wins. When it's empty we fall
 * back to a real, key-less food photo that the client browser loads directly, so
 * cards never render empty.
 *
 * Source today is Loremflickr (public, no API key, CORS-friendly <img> src). It's
 * intentionally isolated here so it can be swapped for Cloudinary (or any signed
 * CDN) later by changing only `fallbackImageUrl` — callers never see the source.
 */

export type RecipeImageInput = {
  /** Stable identifier (recipe id, meal item id, food id). Used to lock the photo. */
  id: string;
  /** Recipe / meal name, used for the keyword fallback and as a hashing seed. */
  name?: string;
  /** Meal moment ("desayuno", "comida", "cena", "snack", or English equivalents). */
  mealSlot?: string;
  /**
   * Explicit English keyword for the fallback photo (e.g. a food category like
   * "chicken" or "rice"). When set it overrides the meal-slot keyword. Useful for
   * the food library, where items carry a category rather than a meal slot.
   */
  keyword?: string;
  /** Curated/real image. When a non-empty string, it wins over the fallback. */
  imageUrl?: string | null;
};

/**
 * Maps a meal slot (Spanish or English) to an English food keyword Loremflickr
 * understands well, so the fallback photo is at least topically relevant.
 */
function keywordForMealSlot(mealSlot?: string): string {
  const slot = (mealSlot ?? "").trim().toLowerCase();
  switch (slot) {
    case "desayuno":
    case "breakfast":
      return "breakfast";
    case "comida":
    case "almuerzo":
    case "lunch":
      return "lunch";
    case "cena":
    case "dinner":
      return "dinner";
    case "snack":
    case "merienda":
      return "snack";
    default:
      return "food,meal";
  }
}

/**
 * Small, stable string hash (djb2). Deterministic across server/client so the
 * locked photo never reshuffles between renders.
 */
export function stableHash(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  // Force unsigned 32-bit so the lock is always a positive integer.
  return hash >>> 0;
}

/**
 * The key-less photo used when no curated image exists. Centralized so the
 * provider can be swapped (e.g. Cloudinary) without touching call sites.
 */
function fallbackImageUrl(input: RecipeImageInput): string {
  const explicit = (input.keyword ?? "").trim();
  const keyword = explicit || keywordForMealSlot(input.mealSlot);
  const lock = stableHash(input.id || input.name || keyword);
  // Loremflickr treats commas as keyword separators, so keep them literal and
  // encode only each individual term.
  const path = keyword
    .split(",")
    .map((term) => encodeURIComponent(term.trim()))
    .filter(Boolean)
    .join(",");
  return `https://loremflickr.com/640/480/${path}?lock=${lock}`;
}

/**
 * Resolves the image URL for a recipe/meal. Returns the curated image when set,
 * otherwise a stable, relevant food photo. Always returns a usable URL.
 */
export function recipeImageUrl(input: RecipeImageInput): string {
  const curated = (input.imageUrl ?? "").trim();
  if (curated) return curated;
  return fallbackImageUrl(input);
}
