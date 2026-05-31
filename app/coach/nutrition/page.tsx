import { Apple, Calculator, Flame, Plus, Soup, Trash2, TrendingUp, UtensilsCrossed } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { NutritionAgentClient } from "@/components/nutrition-agent";
import { RecipeImage } from "@/components/recipe-image";
import { Topbar } from "@/components/topbar";
import { isNutritionAgentConfigured } from "@/lib/ai/nutrition-agent";
import { buildCarbCyclingTargets, calculateNutritionTargets, nutritionGoalLabels, recommendNutritionAdjustment } from "@/lib/domain/nutrition-engine";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedDietCategories, listManagedDietTemplates, listManagedIngredients, listManagedRecipes } from "@/lib/repositories/nutrition-management";
import {
  addCoachDietTemplateMealAction,
  addCoachRecipeIngredientAction,
  createCoachDietTemplateAction,
  createCoachIngredientAction,
  createCoachMacroTemplateAction,
  createCoachRecipeAction,
  removeCoachDietTemplateMealAction,
} from "./actions";

const MEAL_SLOTS = ["desayuno", "comida", "cena", "snack"];

export const dynamic = "force-dynamic";

export default async function CoachNutritionPage() {
  const brand = await getSelectedMemberAppBrand();
  const [categories, templates, ingredients, recipes] = await Promise.all([
    listManagedDietCategories(brand.id),
    listManagedDietTemplates(brand.id, { withMeals: true }),
    listManagedIngredients(brand.id),
    listManagedRecipes(brand.id, { includeBase: true }),
  ]);
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const demoTargets = calculateNutritionTargets({
    gender: "male",
    age: 32,
    heightCm: 178,
    weightKg: 82,
    activityLevel: "active",
    goal: "fat_loss",
    proteinPerKg: 2.2,
    fatRatio: 0.25,
    mealsPerDay: 4,
    trainingDaysPerWeek: 5,
  });
  const carbCyclingDays = buildCarbCyclingTargets(demoTargets, 5);
  const adjustment = recommendNutritionAdjustment({
    goal: "fat_loss",
    currentCalories: demoTargets.targetCalories,
    weightTrendPercent: -0.18,
    trainingAdherence: 0.82,
    nutritionAdherence: 0.76,
    hungerLevel: 7,
    performanceTrend: "flat",
  });

  return (
    <>
      <Topbar
        eyebrow="Nutrición"
        title="Comidas, recetas y planes."
        text="Crea recetas, móntalas en planes por día y asígnalas. La IA puede generarte recetas con macros."
        actions={
          <>
            <Dialog
              triggerClassName="btn primary"
              trigger={<>Nueva plantilla <Plus size={18} /></>}
              title="Nueva plantilla de comidas"
              description="Crea el plan; luego le añades recetas por día y momento."
            >
              <form action={createCoachDietTemplateAction} className="editForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="categoryId" type="hidden" value={categories[0]?.id ?? ""} />
                <label>
                  Nombre
                  <input name="name" placeholder="Definicion alta proteina" required />
                </label>
                <label>
                  Objetivo
                  <input name="goal" placeholder="Definición, volumen..." />
                </label>
                <label>
                  Kcal min
                  <input name="caloriesMin" placeholder="1800" type="number" inputMode="numeric" />
                </label>
                <label>
                  Kcal max
                  <input name="caloriesMax" placeholder="2200" type="number" inputMode="numeric" />
                </label>
                <label className="spanFull">
                  Proteina %
                  <input name="proteinRatio" placeholder="35" />
                </label>
                <input name="carbsRatio" type="hidden" value="" />
                <input name="fatRatio" type="hidden" value="" />
                <input name="tags" type="hidden" value="coach" />
                <button className="btn primary spanFull" type="submit">Crear plantilla</button>
              </form>
            </Dialog>
            <Dialog
              triggerClassName="btn"
              trigger={<>Nueva receta <Plus size={18} /></>}
              title="Nueva receta"
              description="Después le añades ingredientes y los macros se calculan solos."
            >
              <form action={createCoachRecipeAction} className="editForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="categoryId" type="hidden" value={categories[0]?.id ?? ""} />
                <label>
                  Nombre
                  <input name="name" placeholder="Bowl de pollo y arroz" required />
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
                  <textarea name="instructions" rows={3} placeholder="Preparacion, swaps y notas del coach..." />
                </label>
                <label className="spanFull">
                  Tags
                  <input name="tags" placeholder="alta proteina, sin lactosa" />
                </label>
                <label className="spanFull">
                  Foto (URL, opcional)
                  <input name="imageUrl" type="url" inputMode="url" placeholder="https://… (si la dejas vacía, se usa el placeholder de marca)" />
                </label>
                <button className="btn primary spanFull" type="submit">Crear receta</button>
              </form>
            </Dialog>
            <Dialog
              triggerClassName="btn"
              trigger={<>Nuevo ingrediente <Plus size={18} /></>}
              title="Nuevo ingrediente"
              description="Con sus valores por 100 g para calcular macros."
            >
              <form action={createCoachIngredientAction} className="editForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Pechuga de pollo" required />
                </label>
                <label>
                  Kcal/100g
                  <input name="caloriesPer100g" placeholder="165" />
                </label>
                <label>
                  Proteina/100g
                  <input name="proteinPer100g" placeholder="31" />
                </label>
                <label>
                  Carbs/100g
                  <input name="carbsPer100g" placeholder="0" />
                </label>
                <label>
                  Grasas/100g
                  <input name="fatPer100g" placeholder="3.6" />
                </label>
                <label>
                  Tags
                  <input name="tags" placeholder="proteina, basico" />
                </label>
                <input name="allergens" type="hidden" value="" />
                <button className="btn primary spanFull" type="submit">Crear ingrediente</button>
              </form>
            </Dialog>
          </>
        }
      />
      <NutritionAgentClient workspaceId={brand.id} configured={isNutritionAgentConfigured()} />
      <section className="grid">
        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <UtensilsCrossed color="var(--accent)" aria-hidden="true" />
              <h2>Cómo montar una dieta.</h2>
              <p>Cuatro pasos. Usa los alimentos y recetas base (con macros), o crea los tuyos.</p>
            </div>
          </div>
          <ol className="stepper">
            <li><span>1</span><div><strong>Alimentos</strong><p>Parte de la librería base o crea los tuyos con sus macros por 100 g.</p></div></li>
            <li><span>2</span><div><strong>Recetas</strong><p>Combina alimentos; los macros se calculan solos.</p></div></li>
            <li><span>3</span><div><strong>Plan</strong><p>Añade recetas por día y momento a una plantilla.</p></div></li>
            <li><span>4</span><div><strong>Asignar</strong><p>Asígnalo a un miembro y lo verá en su app.</p></div></li>
          </ol>
        </article>

        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <UtensilsCrossed color="var(--accent)" aria-hidden="true" />
              <h2>Planes de comidas.</h2>
              <p>Monta cada plantilla con recetas por día y momento. Al asignarla a un miembro, estas comidas aparecen en su app.</p>
            </div>
            <span className="tag">{templates.length} plantillas</span>
          </div>
        </article>

        {templates.map((template) => {
          const mealTotals = template.meals.reduce(
            (totals, meal) => {
              const recipe = recipeById.get(meal.recipeId);
              if (recipe) {
                totals.calories += recipe.calories * meal.servingMultiplier;
                totals.protein += recipe.protein * meal.servingMultiplier;
                totals.carbs += recipe.carbs * meal.servingMultiplier;
                totals.fat += recipe.fat * meal.servingMultiplier;
              }
              return totals;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );
          const dayCount = new Set(template.meals.map((meal) => meal.dayNumber)).size;
          return (
            <article className="card span6 motionCard" key={template.id}>
              <div className="appCardHeader">
                <Apple color="var(--accent)" aria-hidden="true" />
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.goal || "Objetivo pendiente"}</p>
                </div>
              </div>
              <ul className="list">
                <li className="row">Kcal objetivo <span>{template.caloriesMin ?? "?"} - {template.caloriesMax ?? "?"}</span></li>
                <li className="row">Proteina <span>{template.proteinRatio ? `${Math.round(template.proteinRatio * 100)}%` : "Pendiente"}</span></li>
                <li className="row">Estado <span className="tag">{template.status}</span></li>
                <li className="row">Plan <span>{template.meals.length} comidas · {dayCount} día(s)</span></li>
                {template.meals.length ? (
                  <li className="row">Macros/plan <span>{Math.round(mealTotals.calories)} kcal · {Math.round(mealTotals.protein)}P · {Math.round(mealTotals.carbs)}C · {Math.round(mealTotals.fat)}G</span></li>
                ) : null}
              </ul>
              {template.meals.length ? (
                <ul className="list compactList">
                  {template.meals.map((meal) => {
                    const recipe = recipeById.get(meal.recipeId);
                    return (
                      <li className="row" key={meal.id}>
                        <div>
                          <strong>Día {meal.dayNumber} · {meal.mealSlot}</strong>
                          <p>
                            {meal.recipeName}
                            {meal.servingMultiplier !== 1 ? ` ×${meal.servingMultiplier}` : ""}
                            {recipe ? ` · ${Math.round(recipe.calories * meal.servingMultiplier)} kcal` : ""}
                          </p>
                        </div>
                        <form action={removeCoachDietTemplateMealAction}>
                          <input name="workspaceId" type="hidden" value={brand.id} />
                          <input name="dietTemplateId" type="hidden" value={template.id} />
                          <input name="mealId" type="hidden" value={meal.id} />
                          <button className="btn ghost sm" type="submit" aria-label="Quitar comida">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="muted">Sin comidas todavía. Añade recetas para que el miembro vea su plan.</p>
              )}
              {recipes.length ? (
                <Dialog
                  triggerClassName="btn"
                  trigger={<>Añadir comida <Plus size={16} /></>}
                  title={`Añadir comida · ${template.name}`}
                  description="Elige una receta y dónde encaja en el plan."
                >
                  <form action={addCoachDietTemplateMealAction} className="editForm">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="dietTemplateId" type="hidden" value={template.id} />
                    <label className="spanFull">
                      Receta
                      <select name="recipeId" defaultValue="" required>
                        <option value="" disabled>Elegir receta...</option>
                        {recipes.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>{recipe.name} · {recipe.calories} kcal</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Día
                      <input name="dayNumber" type="number" inputMode="numeric" min="1" step="1" defaultValue="1" />
                    </label>
                    <label>
                      Momento
                      <select name="mealSlot" defaultValue="comida">
                        {MEAL_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Raciones
                      <input name="servingMultiplier" type="number" inputMode="decimal" min="0.25" step="0.25" defaultValue="1" />
                    </label>
                    <button className="btn primary spanFull" type="submit">Añadir comida</button>
                  </form>
                </Dialog>
              ) : (
                <p className="muted">Crea una receta para montar el plan.</p>
              )}
            </article>
          );
        })}

        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <Soup color="var(--accent)" aria-hidden="true" />
              <h2>Recetas.</h2>
              <p>Añade ingredientes con gramos y los macros se calculan solos. Estas recetas alimentan los planes.</p>
            </div>
            <span className="tag">{recipes.length} recetas</span>
          </div>
        </article>

        {recipes.length ? recipes.map((recipe) => (
          <article className="card span6 motionCard" key={recipe.id}>
            <div className="appCardHeader">
              <RecipeImage
                variant="thumb"
                className="recipeCardThumb"
                id={recipe.id}
                name={recipe.name}
                mealSlot={recipe.mealSlot}
                imageUrl={recipe.imageUrl}
              />
              <div>
                <h3>{recipe.name}</h3>
                <div className="catalogChips">
                  <span className="catalogChip">{recipe.mealSlot}</span>
                  <span className="catalogChip accent">{recipe.calories} kcal</span>
                  <span className="catalogChip">{recipe.protein}P</span>
                  <span className="catalogChip">{recipe.carbs}C</span>
                  <span className="catalogChip">{recipe.fat}G</span>
                </div>
              </div>
            </div>
            <ul className="list compactList">
              {recipe.ingredients.length ? recipe.ingredients.map((ingredient, index) => (
                <li className="row" key={`${recipe.id}-ing-${index}`}>{ingredient.name}<span>{ingredient.grams} g</span></li>
              )) : <li className="row">Sin ingredientes todavía <span className="tag">Añade abajo</span></li>}
            </ul>
            {recipe.isBase ? (
              <span className="tag">Receta base · lista para usar en tus planes</span>
            ) : ingredients.length ? (
              <Dialog
                triggerClassName="btn"
                trigger={<>Añadir ingrediente <Plus size={16} /></>}
                title={`Añadir ingrediente · ${recipe.name}`}
                description="Los macros de la receta se recalculan al guardar."
              >
                <form action={addCoachRecipeIngredientAction} className="editForm">
                  <input name="workspaceId" type="hidden" value={brand.id} />
                  <input name="recipeId" type="hidden" value={recipe.id} />
                  <label className="spanFull">
                    Ingrediente
                    <select name="ingredientId" defaultValue="" required>
                      <option value="" disabled>Elegir ingrediente...</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>{ingredient.name} · {ingredient.caloriesPer100g} kcal/100g</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Gramos
                    <input name="grams" type="number" inputMode="decimal" min="1" step="1" defaultValue="100" />
                  </label>
                  <button className="btn primary spanFull" type="submit">Añadir ingrediente</button>
                </form>
              </Dialog>
            ) : (
              <p className="muted">Crea ingredientes (botón arriba) para componer la receta.</p>
            )}
          </article>
        )) : (
          <article className="card span12 motionCard">
            <p className="muted">Sin recetas todavía. Usa “Nueva receta” arriba para empezar.</p>
          </article>
        )}

        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <Apple color="var(--accent)" aria-hidden="true" />
              <h2>Alimentos.</h2>
              <p>Valores por 100 g. La librería base es compartida; los tuyos se añaden con “Nuevo ingrediente”.</p>
            </div>
            <span className="tag">{ingredients.length} alimentos</span>
          </div>
          <div className="catalogGrid">
            {ingredients.length ? ingredients.map((ingredient) => (
              <article className="catalogCard" key={ingredient.id}>
                <div className="catalogCardHead">
                  <strong>{ingredient.name}</strong>
                  <span className={ingredient.isBase ? "exerciseOrigin base" : "exerciseOrigin brand"}>{ingredient.isBase ? "base" : "propio"}</span>
                </div>
                <div className="catalogChips">
                  <span className="catalogChip accent">{ingredient.caloriesPer100g} kcal</span>
                  <span className="catalogChip">{ingredient.proteinPer100g}P</span>
                  <span className="catalogChip">{ingredient.carbsPer100g}C</span>
                  <span className="catalogChip">{ingredient.fatPer100g}G</span>
                  <span className="catalogChip muted">/ 100 g</span>
                </div>
              </article>
            )) : <p className="muted">Sin alimentos todavía. Carga la librería base con “Nuevo ingrediente”.</p>}
          </div>
        </article>

        <article className="span12">
          <details className="advancedPanel">
            <summary>
              <Calculator size={16} /> Herramientas avanzadas · MacroLab y motor de ajuste
            </summary>
            <div className="advancedPanelBody">
              <article className="card nutritionLabCard">
                <div className="sectionHeader">
                  <div>
                    <Calculator color="var(--accent)" aria-hidden="true" />
                    <h2>MacroLab profesional.</h2>
                    <p>Calcula BMR, gasto diario, calorias objetivo, proteina, grasas, carbohidratos, fibra, agua y reparto por comidas.</p>
                  </div>
                  <span className="tag">{demoTargets.strategy.label}</span>
                </div>
                <div className="macroLabGrid">
                  <form action={createCoachMacroTemplateAction} className="macroLabForm">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="categoryId" type="hidden" value={categories[0]?.id ?? ""} />
                    <label>
                      Nombre plantilla
                      <input name="name" placeholder="Definicion elite 82kg" />
                    </label>
                    <label>
                      Sexo
                      <select name="gender" defaultValue="male">
                        <option value="male">Hombre</option>
                        <option value="female">Mujer</option>
                      </select>
                    </label>
                    <label>
                      Edad
                      <input name="age" defaultValue="32" min="12" type="number" inputMode="numeric" />
                    </label>
                    <label>
                      Altura cm
                      <input name="heightCm" defaultValue="178" min="120" type="number" inputMode="decimal" />
                    </label>
                    <label>
                      Peso kg
                      <input name="weightKg" defaultValue="82" min="35" step="0.1" type="number" inputMode="decimal" />
                    </label>
                    <label>
                      Actividad
                      <select name="activityLevel" defaultValue="active">
                        <option value="sedentary">Sedentario</option>
                        <option value="light">Ligera</option>
                        <option value="moderate">Moderada</option>
                        <option value="active">Alta</option>
                        <option value="athlete">Atleta</option>
                      </select>
                    </label>
                    <label>
                      Objetivo
                      <select name="goal" defaultValue="fat_loss">
                        {Object.entries(nutritionGoalLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Proteina g/kg
                      <input name="proteinPerKg" defaultValue="2.2" min="1.2" max="3" step="0.1" type="number" inputMode="decimal" />
                    </label>
                    <label>
                      Grasas %
                      <input name="fatRatio" defaultValue="25" min="15" max="40" type="number" inputMode="numeric" />
                    </label>
                    <label>
                      Comidas/dia
                      <input name="mealsPerDay" defaultValue="4" min="3" max="5" type="number" inputMode="numeric" />
                    </label>
                    <label>
                      Entrenos/semana
                      <input name="trainingDaysPerWeek" defaultValue="5" min="0" max="7" type="number" inputMode="numeric" />
                    </label>
                    <button className="btn primary" type="submit">Generar plantilla macro</button>
                  </form>
                  <div className="macroResultPanel">
                    <div className="metricGrid">
                      <span>BMR<strong>{demoTargets.bmr}</strong><small>kcal base</small></span>
                      <span>TDEE<strong>{demoTargets.tdee}</strong><small>kcal gasto</small></span>
                      <span>Objetivo<strong>{demoTargets.targetCalories}</strong><small>kcal/dia</small></span>
                      <span>Agua<strong>{demoTargets.waterMl}</strong><small>ml/dia</small></span>
                    </div>
                    <div className="macroSplit">
                      <span><strong>{demoTargets.proteinG}g</strong>Proteina</span>
                      <span><strong>{demoTargets.carbsG}g</strong>Carbs</span>
                      <span><strong>{demoTargets.fatG}g</strong>Grasas</span>
                      <span><strong>{demoTargets.fiberG}g</strong>Fibra</span>
                    </div>
                    <ul className="list">
                      {demoTargets.meals.map((meal) => (
                        <li className="row" key={meal.name}>
                          {meal.name}
                          <span>{meal.calories} kcal · {meal.proteinG}P · {meal.carbsG}C · {meal.fatG}G</span>
                        </li>
                      ))}
                    </ul>
                    <p className="muted">{demoTargets.strategy.adjustmentRule}</p>
                  </div>
                </div>
              </article>

              <article className="card nutritionStrategyCard">
                <div className="sectionHeader">
                  <div>
                    <Flame color="var(--accent)" aria-hidden="true" />
                    <h2>Motor de ajuste semanal.</h2>
                    <p>El coach no solo calcula macros: decide si mantener, recortar, subir calorías, hacer refeed o simplificar por adherencia.</p>
                  </div>
                  <span className="tag">{adjustment.decision}</span>
                </div>
                <div className="nutritionDecisionGrid">
                  <section className="moduleGroup">
                    <div className="appCardHeader">
                      <TrendingUp color="var(--accent)" aria-hidden="true" />
                      <h3>Decisión recomendada</h3>
                    </div>
                    <p>{adjustment.reason}</p>
                    <p className="metric">
                      Próximas calorías
                      <strong>{adjustment.nextCalories}</strong>
                    </p>
                  </section>
                  <section className="moduleGroup">
                    <h3>Acciones del coach</h3>
                    <ul className="list compactList">
                      {adjustment.actions.map((action) => (
                        <li className="row" key={action}>{action}<span className="tag">acción</span></li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="carbCyclingGrid">
                  {carbCyclingDays.map((day) => (
                    <article className="carbDayCard" key={day.dayType}>
                      <span className="tag">{day.label}</span>
                      <h3>{day.calories} kcal</h3>
                      <p>{day.proteinG}P · {day.carbsG}C · {day.fatG}G</p>
                      <small>{day.notes}</small>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </details>
        </article>
      </section>
    </>
  );
}
