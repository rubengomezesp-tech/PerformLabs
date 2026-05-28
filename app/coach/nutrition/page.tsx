import { Apple, Calculator, Flame, Plus, Soup, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { buildCarbCyclingTargets, calculateNutritionTargets, nutritionGoalLabels, recommendNutritionAdjustment } from "@/lib/domain/nutrition-engine";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedDietCategories, listManagedDietTemplates, listManagedIngredients, listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { createCoachDietTemplateAction, createCoachIngredientAction, createCoachMacroTemplateAction, createCoachRecipeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachNutritionPage() {
  const brand = await getSelectedMemberAppBrand();
  const [categories, templates, ingredients, recipes] = await Promise.all([
    listManagedDietCategories(brand.id),
    listManagedDietTemplates(brand.id),
    listManagedIngredients(brand.id),
    listManagedRecipes(brand.id),
  ]);
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
        eyebrow="Nutricion"
        title="Comidas, recetas y plantillas por objetivo."
        text="El coach prepara comidas reutilizables y las combina en planes adaptados a macros, restricciones y preferencias."
        actions={<a className="btn primary" href="#nueva-plantilla">Nueva plantilla <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span12 nutritionLabCard">
          <div className="sectionHeader">
            <div>
              <Calculator color="var(--gold)" />
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
                <input name="age" defaultValue="32" min="12" type="number" />
              </label>
              <label>
                Altura cm
                <input name="heightCm" defaultValue="178" min="120" type="number" />
              </label>
              <label>
                Peso kg
                <input name="weightKg" defaultValue="82" min="35" step="0.1" type="number" />
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
                <input name="proteinPerKg" defaultValue="2.2" min="1.2" max="3" step="0.1" type="number" />
              </label>
              <label>
                Grasas %
                <input name="fatRatio" defaultValue="25" min="15" max="40" type="number" />
              </label>
              <label>
                Comidas/dia
                <input name="mealsPerDay" defaultValue="4" min="3" max="5" type="number" />
              </label>
              <label>
                Entrenos/semana
                <input name="trainingDaysPerWeek" defaultValue="5" min="0" max="7" type="number" />
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

        <article className="card span12 nutritionStrategyCard">
          <div className="sectionHeader">
            <div>
              <Flame color="var(--gold)" />
              <h2>Motor de ajuste semanal.</h2>
              <p>El coach no solo calcula macros: decide si mantener, recortar, subir calorías, hacer refeed o simplificar por adherencia.</p>
            </div>
            <span className="tag">{adjustment.decision}</span>
          </div>
          <div className="nutritionDecisionGrid">
            <section className="moduleGroup">
              <div className="appCardHeader">
                <TrendingUp color="var(--gold)" />
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

        <article className="card span12 coachBuilderCard" id="nueva-plantilla">
          <div>
            <span className="eyebrow">Fase 2</span>
            <h2>Plantilla nutricional → receta → ingredientes → app cliente.</h2>
            <p>Este flujo ya usa el modelo real de nutricion del workspace {brand.name}.</p>
          </div>
          <form action={createCoachDietTemplateAction} className="coachNutritionCreate">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="categoryId" type="hidden" value={categories[0]?.id ?? ""} />
            <label>
              Nombre
              <input name="name" placeholder="Definicion alta proteina" required />
            </label>
            <label>
              Objetivo
              <input name="goal" placeholder="fat_loss, muscle_gain..." />
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
              Proteina %
              <input name="proteinRatio" placeholder="35" />
            </label>
            <input name="carbsRatio" type="hidden" value="" />
            <input name="fatRatio" type="hidden" value="" />
            <input name="tags" type="hidden" value="coach" />
            <button className="btn primary" type="submit">Crear</button>
          </form>
        </article>

        <article className="card span6 motionCard">
          <Soup color="var(--gold)" />
          <h2>Nueva receta</h2>
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
            <label>
              Tags
              <input name="tags" placeholder="alta proteina, sin lactosa" />
            </label>
            <button className="btn" type="submit">Crear receta</button>
          </form>
        </article>

        <article className="card span6 motionCard">
          <Apple color="var(--gold)" />
          <h2>Nuevo ingrediente</h2>
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
            <button className="btn" type="submit">Crear ingrediente</button>
          </form>
        </article>

        {templates.map((template) => (
          <article className="card span4 motionCard" key={template.id}>
            <Apple color="var(--gold)" />
            <h2>{template.name}</h2>
            <p>{template.goal || "Objetivo pendiente"}</p>
            <ul className="list">
              <li className="row">Kcal <span>{template.caloriesMin ?? "?"} - {template.caloriesMax ?? "?"}</span></li>
              <li className="row">Proteina <span>{template.proteinRatio ? `${Math.round(template.proteinRatio * 100)}%` : "Pendiente"}</span></li>
              <li className="row">Estado <span className="tag">{template.status}</span></li>
            </ul>
          </article>
        ))}

        <article className="card span6 motionCard">
          <h2>Recetas</h2>
          <ul className="list">
            {recipes.length ? recipes.map((recipe) => (
              <li className="row" key={recipe.id}>
                <div>
                  <strong>{recipe.name}</strong>
                  <p>{recipe.mealSlot} · {recipe.calories} kcal · {recipe.protein}P</p>
                </div>
                <span className="tag">{recipe.ingredients.length} ingredientes</span>
              </li>
            )) : <li className="row">Sin recetas todavia <span className="tag">Crear arriba</span></li>}
          </ul>
        </article>

        <article className="card span6 motionCard">
          <h2>Ingredientes</h2>
          <ul className="list">
            {ingredients.length ? ingredients.slice(0, 8).map((ingredient) => (
              <li className="row" key={ingredient.id}>
                <div>
                  <strong>{ingredient.name}</strong>
                  <p>{ingredient.caloriesPer100g} kcal · {ingredient.proteinPer100g}P / 100g</p>
                </div>
                <span className="tag">{ingredient.tags[0] ?? "base"}</span>
              </li>
            )) : <li className="row">Sin ingredientes todavia <span className="tag">Crear arriba</span></li>}
          </ul>
        </article>
      </section>
    </>
  );
}
