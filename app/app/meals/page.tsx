import { Apple, CheckCircle2, Droplets, MessageSquare, Plus, Repeat, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { meals } from "@/lib/data";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedDietTemplates, listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { getMemberMealPlanForToday, getNutritionDailySummary } from "@/lib/repositories/nutrition-tracking";
import { saveMealLogAction, saveNutritionDayAction } from "./actions";

export default async function MealsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [templates, recipes, dailySummary, assignedMealPlan] = await Promise.all([
    listManagedDietTemplates(brand.id),
    listManagedRecipes(brand.id),
    getNutritionDailySummary(brand.id),
    getMemberMealPlanForToday(brand.id),
  ]);
  const assignedCards = assignedMealPlan?.items.map((item) => ({
    id: item.id,
    recipeId: item.recipeId ?? "",
    slot: item.mealSlot,
    title: item.title,
    ingredients: item.ingredients,
    tags: item.tags,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
  })) ?? [];
  const recipeCards = recipes.map((recipe) => ({
    id: recipe.id,
    recipeId: recipe.id,
    slot: recipe.mealSlot,
    title: recipe.name,
    ingredients: recipe.ingredients.length,
    tags: recipe.tags,
    instructions: recipe.instructions,
    calories: null,
    proteinG: null,
  }));
  const fallbackCards = meals.map((meal) => ({
    id: meal.name,
    recipeId: "",
    slot: meal.name,
    title: meal.meal,
    ingredients: 4,
    tags: ["preparada"],
    instructions: "Mantén la estructura indicada por tu coach y avisa si necesitas una alternativa.",
    calories: null,
    proteinG: null,
  }));
  const mealCards = assignedCards.length ? assignedCards : recipeCards.length ? recipeCards : fallbackCards;
  const primaryTemplate = templates[0];
  const mealLogBySlot = new Map(dailySummary.mealLogs.map((log) => [log.mealSlot, log]));
  const nextMeal = mealCards.find((meal) => mealLogBySlot.get(meal.slot)?.status !== "done") ?? mealCards[0];
  const completionPercent = mealCards.length ? Math.round((dailySummary.completedMeals / mealCards.length) * 100) : 0;
  const waterTargetGlasses = assignedMealPlan?.waterTargetMl ? Math.max(6, Math.round(assignedMealPlan.waterTargetMl / 250)) : 8;
  const waterPercent = Math.min(100, Math.round((dailySummary.waterGlasses / waterTargetGlasses) * 100));
  const planLabel = assignedMealPlan?.planName || primaryTemplate?.goal || "Plan activo. Tu coach verá tus registros y sensaciones.";

  return (
    <>
      <Topbar
        eyebrow="Comida"
        title="Tu plan de hoy."
        text="Sigue tu día sin complicarte: marca comidas, agua y sensaciones para que tu coach pueda ajustar mejor."
      />
      <section className="grid">
        <article className="span12 mealAppHero">
          <div>
            <span className="eyebrow">Siguiente comida</span>
            <h1>{nextMeal?.title || "Plan preparado"}</h1>
            <p>{nextMeal ? "Cuando termines, márcala como hecha. Si no te encaja, pide un cambio y tu coach lo revisa." : "Tu coach está preparando tu plan de comidas."}</p>
            <div className="mealHeroMeta">
              <span><Utensils size={16} /> {dailySummary.completedMeals}/{mealCards.length} comidas hechas</span>
              <span><Droplets size={16} /> {dailySummary.waterGlasses}/{waterTargetGlasses} vasos de agua</span>
              <span><Repeat size={16} /> {dailySummary.swapRequests ? `${dailySummary.swapRequests} cambio pedido` : "Cambios disponibles"}</span>
            </div>
            {nextMeal ? (
              <form action={saveMealLogAction} className="mealHeroActions">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="recipeId" type="hidden" value={nextMeal.recipeId} />
                <input name="mealSlot" type="hidden" value={nextMeal.slot} />
                <input name="mealTitle" type="hidden" value={nextMeal.title} />
                <input name="satisfaction" type="hidden" value="4" />
                <button className="btn primary" name="status" value="done" type="submit"><CheckCircle2 size={17} /> Ya la hice</button>
                <button className="btn" name="status" value="swap_requested" type="submit"><Repeat size={17} /> Pedir cambio</button>
              </form>
            ) : null}
          </div>
          <div className="memberHeroSignal">
            <Sparkles size={18} />
            <strong>{completionPercent}% del día</strong>
            <p>{planLabel}</p>
            <div className="workoutProgressTrack" aria-label={`${completionPercent}% completado`}>
              <span style={{ width: `${Math.max(8, completionPercent)}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="grid">
        <div className="span12 mealStatusGrid">
          <article className="card mealStatusCard">
            <div>
              <span><small>Hoy</small>Comidas completadas</span>
              <strong>{dailySummary.completedMeals}/{mealCards.length}</strong>
            </div>
            <p>Marca cada comida cuando la hagas para llevar el día controlado.</p>
          </article>
          <article className="card mealStatusCard">
            <div>
              <span><small>Hidratación</small>Agua del día</span>
              <strong>{dailySummary.waterGlasses}/{waterTargetGlasses}</strong>
            </div>
            <div className="mealMiniProgress"><span style={{ width: `${Math.max(6, waterPercent)}%` }} /></div>
          </article>
          <article className="card mealStatusCard">
            <div>
              <span><small>Sensaciones</small>Cómo vas hoy</span>
              <strong>{dailySummary.energyLevel ? `${dailySummary.energyLevel}/5` : "Pendiente"}</strong>
            </div>
            <p>Registra energía y hambre para afinar el plan sin complicarte.</p>
          </article>
        </div>

        {mealCards.map((meal, index) => (
          <article className={meal.id === nextMeal?.id ? "card span3 mealAppCard isNextMeal" : "card span3 mealAppCard"} key={meal.id}>
            <div className="mealAppCardTop">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {mealLogBySlot.get(meal.slot)?.status === "done" ? <CheckCircle2 color="var(--gold)" size={22} /> : <Apple color="var(--gold)" size={22} />}
            </div>
            <small>{meal.slot}</small>
            <h3>{meal.title}</h3>
            <p>{meal.instructions || "Comida preparada para cumplir tu plan de hoy."}</p>
            <div className="workoutExerciseChips">
              <span>{meal.ingredients ? `${meal.ingredients} ingredientes` : "Plan de hoy"}</span>
              {meal.calories ? <span>{meal.calories} kcal</span> : null}
              {meal.proteinG ? <span>{meal.proteinG} g proteína</span> : null}
              {meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <form action={saveMealLogAction} className="mealCardActions">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="recipeId" type="hidden" value={meal.recipeId} />
              <input name="mealSlot" type="hidden" value={meal.slot} />
              <input name="mealTitle" type="hidden" value={meal.title} />
              <input name="satisfaction" type="hidden" value="4" />
              <button className="btn primary" name="status" value="done" type="submit"><CheckCircle2 size={16} /> Hecho</button>
              <button className="btn" name="status" value="swap_requested" type="submit"><Repeat size={16} /> Cambiar</button>
            </form>
          </article>
        ))}

        <article className="card span7 mealDailyCheckCard">
          <div className="sectionHeader">
            <div>
              <Droplets color="var(--gold)" size={28} />
              <h2>Seguimiento rápido</h2>
              <p>Treinta segundos al día. Esto ayuda a tu coach a ajustar cantidades, hambre y energía.</p>
            </div>
          </div>
          <form action={saveNutritionDayAction} className="mealDailyForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>Vasos de agua<input name="waterGlasses" defaultValue={dailySummary.waterGlasses || 8} min="0" max="20" type="number" /></label>
            <label>Hambre<select name="hungerLevel" defaultValue={dailySummary.hungerLevel ?? ""}>
              <option value="">Elige</option>
              <option value="1">Muy poca</option>
              <option value="2">Controlada</option>
              <option value="3">Normal</option>
              <option value="4">Alta</option>
              <option value="5">Muy alta</option>
            </select></label>
            <label>Energía<select name="energyLevel" defaultValue={dailySummary.energyLevel ?? ""}>
              <option value="">Elige</option>
              <option value="1">Muy baja</option>
              <option value="2">Baja</option>
              <option value="3">Normal</option>
              <option value="4">Buena</option>
              <option value="5">Muy buena</option>
            </select></label>
            <label className="spanFull">Nota para tu coach<textarea name="notes" rows={3} placeholder="Hambre, digestión, comida que no te gustó, falta de tiempo..." /></label>
            <button className="btn primary" type="submit"><Plus size={17} /> Guardar seguimiento</button>
          </form>
        </article>

        <article className="card span5 mealCoachNote">
          <MessageSquare color="var(--gold)" />
          <h2>Mensaje para tu coach</h2>
          <p>Si una comida no encaja, pide cambio desde la tarjeta. Tu coach verá el contexto del día antes de tocar tu plan.</p>
          <div className="row"><span>Objetivo</span><strong>{planLabel}</strong></div>
          <div className="row"><span>Comidas</span><strong>{completionPercent}%</strong></div>
          <div className="row"><span>Cambios pedidos</span><strong>{dailySummary.swapRequests}</strong></div>
        </article>

        <article className="card span12 mealShoppingCard">
          <ShoppingBasket color="var(--gold)" size={28} />
          <div>
            <h2>Preparación de comidas</h2>
            <p>Organiza lo básico para mañana y evita improvisar cuando tengas poco tiempo.</p>
          </div>
          <div className="mealShoppingRows">
            <span>Comidas listas <strong>{dailySummary.completedMeals}/{mealCards.length}</strong></span>
            <span>Pendientes <strong>{Math.max(0, mealCards.length - dailySummary.completedMeals)}</strong></span>
            <span>Agua registrada <strong>{dailySummary.waterGlasses} vasos</strong></span>
          </div>
        </article>

      </section>
    </>
  );
}
