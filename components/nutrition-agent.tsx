"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { recipeMacros, type AiRecipeResult } from "@/lib/ai/nutrition-agent";
import { generateRecipeAction, saveRecipeAction, type SaveRecipeState } from "./nutrition-agent-actions";

const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

const SUGGESTIONS = [
  "Receta alta en proteína de pollo y arroz para after-gym",
  "Desayuno vegano bajo en grasa con avena",
  "Cena ligera de pescado para definición",
];

export function NutritionAgentClient({ workspaceId, configured }: { workspaceId: string; configured: boolean }) {
  const [genState, generate, generating] = useActionState<AiRecipeResult | null, FormData>(generateRecipeAction, null);
  const [saveState, save, saving] = useActionState<SaveRecipeState, FormData>(saveRecipeAction, null);

  const recipe = genState?.ok ? genState.recipe : null;
  const macros = recipe ? recipeMacros(recipe) : null;

  return (
    <section className="agentGrid">
      <article className="card glass agentPane">
        <div className="sectionHeader">
          <div>
            <h2>Agente de IA</h2>
            <p>Describe la receta y la IA la construye con macros reales.</p>
          </div>
          <Badge tone={configured ? "success" : "warning"}>{configured ? "Activo" : "Sin clave"}</Badge>
        </div>

        {!configured ? (
          <p className="agentNotice">
            El agente se activa al configurar <code>ANTHROPIC_API_KEY</code> en el entorno. Mientras tanto puedes ver el flujo.
          </p>
        ) : null}

        <form action={generate} className="agentForm">
          <textarea
            name="prompt"
            rows={4}
            placeholder='Ej: "Crea una receta alta en proteína de pollo y arroz para after-gym"'
            required
          />
          <button className="btn primary" type="submit" data-loading={generating || undefined} disabled={generating}>
            <Sparkles size={18} /> Generar receta
          </button>
        </form>

        {genState && !genState.ok ? <p className="agentError">{genState.error}</p> : null}

        <div className="agentSuggestions">
          <span className="muted">Prueba:</span>
          {SUGGESTIONS.map((suggestion) => (
            <form action={generate} key={suggestion}>
              <input type="hidden" name="prompt" value={suggestion} />
              <button className="agentChip" type="submit" disabled={generating}>
                {suggestion}
              </button>
            </form>
          ))}
        </div>
      </article>

      <article className="card agentPane">
        <h2>Receta</h2>
        {recipe && macros ? (
          <div className="agentRecipe">
            <div className="sectionHeader">
              <div>
                <h3>{recipe.name}</h3>
                <p>{MEAL_SLOT_LABELS[recipe.mealSlot] ?? recipe.mealSlot}</p>
              </div>
              <Badge tone="info">IA</Badge>
            </div>
            <p className="agentMacros">
              <strong>{Math.round(macros.calories)} kcal</strong> · {Math.round(macros.protein)}P /{" "}
              {Math.round(macros.carbs)}C / {Math.round(macros.fat)}G
            </p>
            <ul className="list">
              {recipe.ingredients.map((ingredient, index) => (
                <li className="row" key={`${ingredient.name}-${index}`}>
                  {ingredient.name}
                  <span className="muted">{ingredient.grams} g</span>
                </li>
              ))}
            </ul>
            {recipe.instructions ? <p className="agentInstructions">{recipe.instructions}</p> : null}
            {recipe.tags.length ? (
              <div className="tagCloud">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            <form action={save} className="agentSave">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="recipe" value={JSON.stringify(recipe)} />
              <button className="btn primary" type="submit" data-loading={saving || undefined} disabled={saving}>
                Enviar a la librería
              </button>
            </form>
            {saveState ? <p className={saveState.ok ? "agentOk" : "agentError"}>{saveState.message}</p> : null}
          </div>
        ) : (
          <div className="agentEmpty">
            <span aria-hidden="true">👨‍🍳</span>
            <strong>Sin receta todavía</strong>
            <p>Describe lo que quieres crear y la IA la construye con sus macros, lista para tu librería.</p>
          </div>
        )}
      </article>
    </section>
  );
}
