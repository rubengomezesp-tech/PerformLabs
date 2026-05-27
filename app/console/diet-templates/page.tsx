import { Apple, Calculator, Soup } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import {
  listManagedDietCategories,
  listManagedDietTemplates,
  listManagedIngredients,
  listManagedRecipes,
} from "@/lib/repositories/nutrition-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import {
  addRecipeIngredientAction,
  createDietCategoryAction,
  createDietTemplateAction,
  createIngredientAction,
  createRecipeAction,
} from "./actions";

export const dynamic = "force-dynamic";

type DietTemplatesPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function DietTemplatesPage({ searchParams }: DietTemplatesPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [categories, templates, ingredients, recipes] = await Promise.all([
    listManagedDietCategories(selectedWorkspace?.id),
    listManagedDietTemplates(selectedWorkspace?.id),
    listManagedIngredients(selectedWorkspace?.id),
    listManagedRecipes(selectedWorkspace?.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Plantillas de dietas"
        title="Categorías, fórmulas y planes alimenticios editables."
        text="Controla plantillas por objetivo y categoría: sin gluten, vegana, definición, volumen, alta proteína y sistemas propios."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/diet-templates" className="formGrid" method="get">
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
              <button className="btn" type="submit">Ver nutrición</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <>
            <article className="card span5">
              <h2>Nueva categoría</h2>
              <form action={createDietCategoryAction} className="formStack">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Sin gluten" required />
                </label>
                <label>
                  Descripción
                  <textarea name="description" rows={3} placeholder="Reglas de inclusión/exclusión y objetivo de la categoría." />
                </label>
                <button className="btn primary" type="submit">Crear categoría <Soup size={18} /></button>
              </form>
            </article>

            <article className="card span7">
              <h2>Nueva plantilla</h2>
              <form action={createDietTemplateAction} className="dietTemplateForm">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Definición alta proteína" required />
                </label>
                <label>
                  Categoría
                  <select name="categoryId" defaultValue="">
                    <option value="">Sin categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Objetivo
                  <input name="goal" placeholder="Definición, volumen, recomposición..." />
                </label>
                <label>
                  Kcal min
                  <input name="caloriesMin" placeholder="1800" type="number" />
                </label>
                <label>
                  Kcal max
                  <input name="caloriesMax" placeholder="2200" type="number" />
                </label>
                <label>
                  Proteína %
                  <input name="proteinRatio" placeholder="30" />
                </label>
                <label>
                  Carbo %
                  <input name="carbsRatio" placeholder="40" />
                </label>
                <label>
                  Grasa %
                  <input name="fatRatio" placeholder="30" />
                </label>
                <label className="spanFull">
                  Tags
                  <input name="tags" placeholder="sin gluten, alta proteína, fácil" />
                </label>
                <button className="btn primary" type="submit">Crear plantilla <Soup size={18} /></button>
              </form>
            </article>
          </>
        ) : null}

        {selectedWorkspace ? (
          <>
            <article className="card span5">
              <h2>Nuevo ingrediente</h2>
              <form action={createIngredientAction} className="ingredientForm">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label className="spanFull">
                  Nombre
                  <input name="name" placeholder="Arroz jazmín" required />
                </label>
                <label>
                  Kcal/100g
                  <input name="caloriesPer100g" placeholder="360" />
                </label>
                <label>
                  Proteína
                  <input name="proteinPer100g" placeholder="7" />
                </label>
                <label>
                  Carbos
                  <input name="carbsPer100g" placeholder="78" />
                </label>
                <label>
                  Grasas
                  <input name="fatPer100g" placeholder="1" />
                </label>
                <label>
                  Alérgenos
                  <input name="allergens" placeholder="gluten, lactosa..." />
                </label>
                <label>
                  Tags
                  <input name="tags" placeholder="base, carbohidrato" />
                </label>
                <button className="btn primary spanFull" type="submit">Crear ingrediente <Apple size={18} /></button>
              </form>
            </article>

            <article className="card span7">
              <h2>Nueva receta</h2>
              <form action={createRecipeAction} className="dietTemplateForm">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Pollo con arroz y verduras" required />
                </label>
                <label>
                  Categoría
                  <select name="categoryId" defaultValue="">
                    <option value="">Sin categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Momento
                  <select name="mealSlot" defaultValue="comida">
                    <option value="desayuno">Desayuno</option>
                    <option value="comida">Comida</option>
                    <option value="cena">Cena</option>
                    <option value="snack">Snack</option>
                  </select>
                </label>
                <label className="spanFull">
                  Instrucciones
                  <textarea name="instructions" rows={3} placeholder="Preparación, alternativas y notas de porciones." />
                </label>
                <label className="spanFull">
                  Tags
                  <input name="tags" placeholder="alta proteína, fácil, meal prep" />
                </label>
                <button className="btn primary" type="submit">Crear receta <Soup size={18} /></button>
              </form>
            </article>
          </>
        ) : null}

        {categories.map((category) => (
          <article className="card span3" key={category.id}>
            <Soup color="var(--gold)" />
            <h3>{category.name}</h3>
            <p>{category.description}</p>
            <div className="row">
              <span>Plantillas</span>
              <strong>{category.templates}</strong>
            </div>
          </article>
        ))}

        <article className="card span12">
          <Calculator color="var(--gold)" />
          <h2>Motor matemático</h2>
          <p>
            BMR, TDEE, déficit/superávit, proteína por kg, reparto de macros,
            filtros por alergias y ajuste de porciones quedan guardados como
            fórmulas versionadas para cada marca.
          </p>
          <div className="tagCloud">
            {templates.map((template) => (
              <span className="tag" key={template.id}>
                {template.name}
              </span>
            ))}
          </div>
        </article>

        {recipes.map((recipe) => (
          <article className="card span6" key={recipe.id}>
            <Apple color="var(--gold)" />
            <h3>{recipe.name}</h3>
            <p>{recipe.mealSlot} · {recipe.instructions || "Sin instrucciones"}</p>
            <ul className="list">
              <li className="row">Macros <strong>{recipe.calories} kcal · {recipe.protein}P / {recipe.carbs}C / {recipe.fat}G</strong></li>
              <li className="row">Ingredientes <strong>{recipe.ingredients.length}</strong></li>
            </ul>
            <form action={addRecipeIngredientAction} className="recipeIngredientForm">
              <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
              <input name="recipeId" type="hidden" value={recipe.id} />
              <label>
                Ingrediente
                <select name="ingredientId" defaultValue="">
                  <option value="">Selecciona</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Gramos
                <input name="grams" defaultValue="100" />
              </label>
              <button className="btn" type="submit">Añadir</button>
            </form>
          </article>
        ))}

        {selectedWorkspace && categories.length === 0 ? (
          <EmptyState
            icon={Soup}
            title="Esta marca todavía no tiene categorías nutricionales."
            text="Crea categorías como sin gluten, vegana, definición o alta proteína para ordenar las plantillas."
          />
        ) : null}
      </section>
    </>
  );
}
