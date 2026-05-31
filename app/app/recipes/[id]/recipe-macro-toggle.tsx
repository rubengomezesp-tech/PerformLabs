"use client";

import { useState } from "react";
import { MacroStrip } from "@/components/macro-strip";

type RecipeMacroToggleProps = {
  /** Per-serving (whole recipe) macros. */
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  /** Total grams of the recipe, used to derive per-100g values. */
  totalGrams: number;
  hidden?: boolean;
};

/**
 * Lets the member flip the recipe macros between "por ración" (the whole recipe)
 * and "por 100 g". When total grams are unknown the per-100g view is hidden, so
 * we never show misleading numbers. Respects the hide-macros setting.
 */
export function RecipeMacroToggle({ protein, fat, carbs, calories, totalGrams, hidden = false }: RecipeMacroToggleProps) {
  const [mode, setMode] = useState<"serving" | "per100">("serving");
  if (hidden) return null;

  const canPer100 = totalGrams > 0;
  const factor = canPer100 ? 100 / totalGrams : 0;
  const showPer100 = mode === "per100" && canPer100;

  const shown = showPer100
    ? { protein: protein * factor, fat: fat * factor, carbs: carbs * factor, calories: calories * factor }
    : { protein, fat, carbs, calories };

  return (
    <div className="ntrMacroToggleWrap">
      {canPer100 ? (
        <div className="ntrMacroToggle" role="tablist" aria-label="Ver macros por">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "serving"}
            className={mode === "serving" ? "ntrMacroToggleBtn active" : "ntrMacroToggleBtn"}
            onClick={() => setMode("serving")}
          >
            Por ración
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "per100"}
            className={mode === "per100" ? "ntrMacroToggleBtn active" : "ntrMacroToggleBtn"}
            onClick={() => setMode("per100")}
          >
            Por 100 g
          </button>
        </div>
      ) : null}
      <MacroStrip
        variant="card"
        proteinG={shown.protein}
        fatG={shown.fat}
        carbsG={shown.carbs}
        calories={shown.calories}
      />
      <small className="ntrMacroToggleNote">
        {showPer100 ? "Valores por 100 g" : "Valores de la receta completa"}
      </small>
    </div>
  );
}
