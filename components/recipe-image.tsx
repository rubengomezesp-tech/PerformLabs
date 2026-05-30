"use client";

import { useState } from "react";
import { Utensils } from "lucide-react";
import { recipeImageUrl, type RecipeImageInput } from "@/lib/nutrition/recipe-image";

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

  return (
    <div className={frameClass}>
      <span className="recipeImageFallback" aria-hidden="true">
        <Utensils size={variant === "thumb" ? 18 : 30} />
      </span>
      {failed ? null : (
        <img
          className="recipeImagePhoto"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </div>
  );
}
