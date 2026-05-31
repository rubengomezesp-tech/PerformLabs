"use client";

import { useState } from "react";
import { Apple, Coffee, Soup, Utensils, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { recipeImageUrl, recipeVisualKey, stableHash, type RecipeImageInput, type RecipeVisualKey } from "@/lib/nutrition/recipe-image";

const FALLBACK_ICON: Record<RecipeVisualKey, LucideIcon> = {
  breakfast: Coffee,
  lunch: Soup,
  dinner: UtensilsCrossed,
  snack: Apple,
  meal: Utensils,
};

type RecipeImageProps = RecipeImageInput & {
  /**
   * Aspect ratio preset for the frame:
   * - "card" (default): 16/10 hero card media
   * - "thumb": 1/1 small square thumbnail
   * - "detail": 16/11 large detail hero
   */
  variant?: "card" | "thumb" | "detail";
  /** Extra classes appended to the frame (kept for layout/positioning of overlays). */
  className?: string;
  /** Optional children rendered above the image (e.g. a slot badge). */
  children?: React.ReactNode;
};

/**
 * Renders the photo for a recipe/meal with a tasteful CSS fallback underneath:
 * an accent-tinted gradient + a utensil glyph. The <img> sits on top; if it ever
 * fails to load it hides itself and the intentional fallback shows through, so a
 * card is never broken or empty.
 *
 * Source resolution is centralized in `recipeImageUrl` — this component never
 * knows whether the URL is curated or a generated fallback.
 */
export function RecipeImage({ variant = "card", className, children, ...input }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);
  const src = recipeImageUrl(input);
  const alt = input.name?.trim() ? input.name : "Receta";
  const frameClass = ["recipeImageFrame", `recipeImageFrame--${variant}`, className].filter(Boolean).join(" ");
  const Icon = FALLBACK_ICON[recipeVisualKey(input)];
  // Subtle, deterministic ±15° tint per item so the placeholder tiles never look
  // like a flat repeated block, while staying on-brand (no off-palette colours).
  const hue = (stableHash(input.id || input.name || "recipe") % 31) - 15;

  return (
    <div className={frameClass}>
      <span className="recipeImageFallback" aria-hidden="true" style={{ filter: `hue-rotate(${hue}deg)` }}>
        <Icon size={variant === "thumb" ? 18 : 30} />
      </span>
      {src && !failed ? (
        <img
          className="recipeImagePhoto"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
      {children}
    </div>
  );
}
