import { Apple, Calculator, ShoppingBasket, Sparkles } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Badge, SubmitButton, Table } from "@/components/ui";
import { cloneRecipeAction } from "./actions";
import { calculateNutritionTargets, splitCaloriesByMeal } from "@/lib/domain/nutrition-engine";
import {
  listManagedDietTemplates,
  listManagedIngredients,
  listManagedRecipes,
  type ManagedIngredient,
  type ManagedRecipe,
} from "@/lib/repositories/nutrition-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";

const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

export const dynamic = "force-dynamic";

type NutritionPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function NutritionPage({ searchParams }: NutritionPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [templates, recipes, ingredients] = await Promise.all([
    listManagedDietTemplates(selectedWorkspace?.id),
    listManagedRecipes(selectedWorkspace?.id, { includeBase: true }),
    listManagedIngredients(selectedWorkspace?.id),
  ]);
  const baseRecipes = recipes.filter((recipe) => recipe.isBase).length;
  const example = calculateNutritionTargets({
    gender: "male",
    age: 35,
    heightCm: 178,
    weightKg: 82,
    activityLevel: "moderate",
    goal: "fat_loss",
    proteinPerKg: 2.1,
  });
  const split = splitCaloriesByMeal(4);

  return (
    <>
      <Topbar
        eyebrow="Nutrición"
        title="Planes, macros, recetas y lista de compra."
        text="Base para crear comidas reutilizables, preferencias, alergias, ingredientes no deseados y swaps automáticos."
        actions={
          <Link
            className="btn primary"
            href={`/console/nutrition/agent${selectedWorkspace?.id ? `?brand=${selectedWorkspace.id}` : ""}`}
          >
            Crear con IA <Sparkles size={18} />
          </Link>
        }
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/nutrition" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver motor</button>
            </div>
          </form>
        </article>

        <article className="card span4">
          <Calculator color="var(--gold)" />
          <h2>Ejemplo matemático</h2>
          <ul className="list">
            <li className="row">BMR <strong>{example.bmr}</strong></li>
            <li className="row">TDEE <strong>{example.tdee}</strong></li>
            <li className="row">Kcal objetivo <strong>{example.targetCalories}</strong></li>
            <li className="row">Macros <strong>{example.proteinG}P / {example.carbsG}C / {example.fatG}G</strong></li>
          </ul>
        </article>

        <article className="card span4">
          <Apple color="var(--gold)" />
          <h2>Split diario</h2>
          <ul className="list">
            {split.map((ratio, index) => (
              <li className="row" key={`${index}-${ratio}`}>
                Comida {index + 1}
                <strong>{Math.round(ratio * 100)}%</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span4">
          <ShoppingBasket color="var(--gold)" />
          <h2>Lista de compra</h2>
          <p>
            Se generará por días seleccionados, número de personas, unidades,
            ingredientes agrupados y envío por email/PDF.
          </p>
          <span className="tag">Fase siguiente</span>
        </article>

        {templates.map((template) => (
          <article className="card span4" key={template.id}>
            <Apple color="var(--gold)" />
            <h3>{template.name}</h3>
            <p>{template.goal || "Objetivo pendiente"}</p>
            <ul className="list">
              <li className="row">Kcal <span>{template.caloriesMin ?? "?"} - {template.caloriesMax ?? "?"}</span></li>
              <li className="row">Proteína <span>{template.proteinRatio ? `${Math.round(template.proteinRatio * 100)}%` : "Pendiente"}</span></li>
              <li className="row">Estado <span className="tag">{template.status}</span></li>
            </ul>
          </article>
        ))}
      </section>

      <section className="grid">
        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <h2>
                Recetas <span className="muted">[{recipes.length}]</span>
              </h2>
              <p>
                Librería base de la plataforma ({baseRecipes}) + recetas propias del coach. Clona una base para
                personalizarla sin tocar el catálogo común.
              </p>
            </div>
          </div>
          {recipes.length ? (
            <Table<ManagedRecipe>
              columns={[
                { key: "name", header: "Nombre", cell: (recipe) => <strong>{recipe.name}</strong> },
                { key: "slot", header: "Momento", cell: (recipe) => MEAL_SLOT_LABELS[recipe.mealSlot] ?? recipe.mealSlot },
                {
                  key: "macros",
                  header: "Macros",
                  cell: (recipe) => `${recipe.calories} kcal · ${recipe.protein}P/${recipe.carbs}C/${recipe.fat}G`,
                },
                { key: "ingredients", header: "Ingredientes", cell: (recipe) => recipe.ingredients.length },
                {
                  key: "source",
                  header: "Origen",
                  cell: (recipe) => (
                    <Badge tone={recipe.isBase ? "info" : "accent"}>{recipe.isBase ? "Base" : "Propia"}</Badge>
                  ),
                },
                {
                  key: "action",
                  header: "",
                  cell: (recipe) =>
                    recipe.isBase && selectedWorkspace ? (
                      <form action={cloneRecipeAction}>
                        <input type="hidden" name="workspaceId" value={selectedWorkspace.id} />
                        <input type="hidden" name="recipeId" value={recipe.id} />
                        <SubmitButton size="sm" successToast="Receta clonada a tu marca">
                          Clonar
                        </SubmitButton>
                      </form>
                    ) : null,
                },
              ]}
              rows={recipes}
              rowKey={(recipe) => recipe.id}
            />
          ) : (
            <p className="muted">
              Sin recetas todavía. Siembra la librería base con <code>pnpm import:nutrition -- --apply</code>.
            </p>
          )}
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <h2>
                Ingredientes <span className="muted">[{ingredients.length}]</span>
              </h2>
              <p>Base macronutricional reutilizable para componer recetas y calcular planes.</p>
            </div>
          </div>
          {ingredients.length ? (
            <Table<ManagedIngredient>
              columns={[
                { key: "name", header: "Nombre", cell: (item) => <strong>{item.name}</strong> },
                { key: "kcal", header: "kcal/100g", cell: (item) => item.caloriesPer100g },
                {
                  key: "macros",
                  header: "P/C/G",
                  cell: (item) => `${item.proteinPer100g}/${item.carbsPer100g}/${item.fatPer100g}`,
                },
                {
                  key: "allergens",
                  header: "Alérgenos",
                  cell: (item) => (item.allergens.length ? item.allergens.join(", ") : "—"),
                },
                {
                  key: "source",
                  header: "Origen",
                  cell: (item) => <Badge tone={item.isBase ? "info" : "accent"}>{item.isBase ? "Base" : "Propio"}</Badge>,
                },
              ]}
              rows={ingredients}
              rowKey={(item) => item.id}
            />
          ) : (
            <p className="muted">Sin ingredientes todavía.</p>
          )}
        </article>
      </section>
    </>
  );
}
