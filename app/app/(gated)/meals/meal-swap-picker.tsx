"use client";

import { Check, Repeat } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/dialog";
import { chooseMealSwapAction } from "./actions";
import type { MealSwapOption } from "@/lib/repositories/nutrition-tracking";

/**
 * Premium meal-swap picker. Surfaces the alternatives for a meal (coach-authored
 * swap_options or derived same-slot recipes) inside an accessible dialog and lets
 * the member pick one. Picking an option with a real recipe submits the swap server
 * action (updates the assigned plan item in place). Derived informational options
 * with no recipe are shown but not selectable. Respects hide-macros: when macros are
 * hidden the option just shows its name + note.
 */
export function MealSwapPicker({
  workspaceId,
  itemId,
  mealTitle,
  options,
  hideMacros,
}: {
  workspaceId: string;
  itemId: string;
  mealTitle: string;
  options: MealSwapOption[];
  hideMacros: boolean;
}) {
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  if (!options.length) return null;

  const selectable = options.filter((option) => option.recipeId);
  const triggerLabel = selectable.length
    ? `Ver ${selectable.length} alternativa${selectable.length > 1 ? "s" : ""}`
    : "Ver alternativas";

  return (
    <Dialog
      triggerClassName="btn ghost sm mealSwapTrigger"
      trigger={<><Repeat size={15} /> {triggerLabel}</>}
      title={`Alternativas para ${mealTitle}`}
      description="Cambia esta comida por otra opción de tu plan con macros parecidos. Se actualiza al instante en tu plan y tu diario."
    >
      <ul className="mealSwapList">
        {options.map((option, index) => {
          const cells = [
            option.calories !== null ? `${option.calories} kcal` : null,
            option.proteinG !== null ? `${option.proteinG}P` : null,
            option.carbsG !== null ? `${option.carbsG}C` : null,
            option.fatG !== null ? `${option.fatG}G` : null,
          ].filter(Boolean) as string[];

          return (
            <li className={option.selected ? "mealSwapOption isSelected" : "mealSwapOption"} key={`${option.recipeId ?? "derived"}-${index}`}>
              <div className="mealSwapOptionInfo">
                <strong>{option.title}</strong>
                {option.note ? <span className="mealSwapOptionNote">{option.note}</span> : null}
                {!hideMacros && cells.length ? (
                  <span className="mealSwapOptionMacros">{cells.join(" · ")}</span>
                ) : null}
              </div>
              {option.selected ? (
                <span className="mealSwapBadge"><Check size={14} /> Activa</span>
              ) : option.recipeId ? (
                <form
                  action={chooseMealSwapAction}
                  onSubmit={() => setPendingRecipeId(option.recipeId)}
                >
                  <input name="workspaceId" type="hidden" value={workspaceId} />
                  <input name="itemId" type="hidden" value={itemId} />
                  <input name="recipeId" type="hidden" value={option.recipeId} />
                  <button className="btn sm primary mealSwapPick" type="submit" disabled={pendingRecipeId === option.recipeId}>
                    {pendingRecipeId === option.recipeId ? "Cambiando…" : "Elegir"}
                  </button>
                </form>
              ) : (
                <span className="mealSwapOptionHint">Coméntalo con tu coach</span>
              )}
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
