import { Apple, CalendarHeart, CheckCircle2, ChefHat, Droplets, MessageSquare, NotebookPen, Plus, Printer, Repeat, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { MacroRings } from "@/components/macro-rings";
import { MacroStrip } from "@/components/macro-strip";
import { RecipeImage } from "@/components/recipe-image";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { Dialog } from "@/components/dialog";
import {
  getMemberMealPlanForToday,
  getMemberNutritionVisibility,
  getNutritionDailySummary,
  listFoodDiaryEntries,
  sumConsumedMacros,
} from "@/lib/repositories/nutrition-tracking";
import { listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { logWaterGlassAction, saveMealLogAction, saveNutritionDayAction, swapMealAction } from "./actions";
import { MealSwapPicker } from "./meal-swap-picker";

export default async function MealsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [dailySummary, assignedMealPlan, visibility, recipeOptions, foodEntries] = await Promise.all([
    getNutritionDailySummary(brand.id),
    getMemberMealPlanForToday(brand.id),
    getMemberNutritionVisibility(brand.id),
    listManagedRecipes(brand.id, { includeBase: true }),
    listFoodDiaryEntries(brand.id),
  ]);
  const mealCards = assignedMealPlan?.items.map((item) => ({
    id: item.id,
    recipeId: item.recipeId ?? "",
    slot: item.mealSlot,
    title: item.title,
    ingredients: item.ingredients,
    tags: item.tags,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    swapOptions: item.swapOptions,
  })) ?? [];
  const hasApprovedMealPlan = mealCards.length > 0;
  const hideMacros = (assignedMealPlan?.hideMacros ?? false) || visibility.hideMacros;
  const hasDailyTargets = Boolean(
    assignedMealPlan && (assignedMealPlan.targetCalories || assignedMealPlan.targetProteinG || assignedMealPlan.targetCarbsG || assignedMealPlan.targetFatG),
  );
  const mealLogBySlot = new Map(dailySummary.mealLogs.map((log) => [log.mealSlot, log]));
  const doneSlots = new Set(
    dailySummary.mealLogs.filter((log) => log.status === "done").map((log) => log.mealSlot),
  );
  const consumed = sumConsumedMacros(
    (assignedMealPlan?.items ?? []).map((item) => ({
      mealSlot: item.mealSlot,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
    })),
    doneSlots,
    foodEntries,
  );
  const nextMeal = hasApprovedMealPlan
    ? mealCards.find((meal) => mealLogBySlot.get(meal.slot)?.status !== "done") ?? mealCards[0]
    : null;
  const completionPercent = mealCards.length ? Math.round((dailySummary.completedMeals / mealCards.length) * 100) : 0;
  const waterTargetGlasses = assignedMealPlan?.waterTargetMl ? Math.max(6, Math.round(assignedMealPlan.waterTargetMl / 250)) : 8;
  const waterPercent = Math.min(100, Math.round((dailySummary.waterGlasses / waterTargetGlasses) * 100));
  const completedMealLabel = hasApprovedMealPlan ? `${dailySummary.completedMeals}/${mealCards.length} comidas hechas` : "Plan pendiente";
  const completedMealMetric = hasApprovedMealPlan ? `${dailySummary.completedMeals}/${mealCards.length}` : "Pendiente";
  const planLabel = assignedMealPlan?.planName || "Tu coach está revisando el briefing antes de publicar tu plan de comida.";

  return (
    <>
      <Topbar
        eyebrow="Comida"
        title="Tu plan de hoy."
        text="Sigue tu día sin complicarte: marca comidas, agua y sensaciones para que tu coach pueda ajustar mejor."
        actions={
          <>
            {hasApprovedMealPlan ? (
              <Link className="btn" href="/app/meals/print"><Printer size={16} /> Imprimir plan</Link>
            ) : null}
            <Link className="btn" href="/app/diary"><NotebookPen size={16} /> Diario</Link>
            <Link className="btn ghost" href="/app/recipes"><ChefHat size={16} /> Recetas</Link>
          </>
        }
      />
      <section className="grid">
        <article className="span12 mealAppHero">
          <div>
            <span className="eyebrow">Siguiente comida</span>
            <h2>{nextMeal?.title || "Plan en revisión"}</h2>
            <p>{nextMeal ? "Cuando termines, márcala como hecha. Si hay una causa real que te lo impide, avisa al coach desde esa comida." : "Tu coach está preparando tu plan de comidas."}</p>
            <div className="mealHeroMeta">
              <span><Utensils size={16} /> {completedMealLabel}</span>
              <span><Droplets size={16} /> {dailySummary.waterGlasses}/{waterTargetGlasses} vasos de agua</span>
              <span><Repeat size={16} /> {hasApprovedMealPlan ? dailySummary.swapRequests ? `${dailySummary.swapRequests} incidencia enviada` : "Plan marcado por tu coach" : "Pendiente del coach"}</span>
            </div>
            {nextMeal ? (
              <form action={saveMealLogAction} className="mealHeroActions">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="recipeId" type="hidden" value={nextMeal.recipeId} />
                <input name="mealSlot" type="hidden" value={nextMeal.slot} />
                <input name="mealTitle" type="hidden" value={nextMeal.title} />
                <input name="satisfaction" type="hidden" value="4" />
                <button className="btn primary" name="status" value="done" type="submit"><CheckCircle2 size={17} /> Ya la hice</button>
                <a className="btn" href="#comidas"><Repeat size={17} /> Reportar incidencia</a>
              </form>
            ) : null}
          </div>
          <div className="memberHeroSignal">
            <Sparkles size={18} />
            <strong>{hasApprovedMealPlan ? `${completionPercent}% del día` : "Esperando aprobación"}</strong>
            <p>{planLabel}</p>
            <div className="workoutProgressTrack" aria-label={`${completionPercent}% completado`}>
              <span style={{ width: `${hasApprovedMealPlan ? Math.max(8, completionPercent) : 18}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="grid" id="comidas">
        <div className="span12 mealStatusGrid">
          <article className="card mealStatusCard">
            <div>
              <span><small>Hoy</small>Comidas completadas</span>
              <strong>{completedMealMetric}</strong>
            </div>
            <p>{hasApprovedMealPlan ? "Marca cada comida cuando la hagas para llevar el día controlado." : "Cuando el coach publique el plan verás tus comidas aquí."}</p>
          </article>
          <article className="card mealStatusCard ntrWaterCard">
            <div>
              <span><small>Hidratación</small>Agua del día</span>
              <strong>{dailySummary.waterGlasses}/{waterTargetGlasses}</strong>
            </div>
            <div className="mealMiniProgress"><span style={{ width: `${Math.max(6, waterPercent)}%` }} /></div>
            <form action={logWaterGlassAction} className="ntrWaterLog">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <button className="btn sm ntrWaterBtn" type="submit" aria-label="Registrar un vaso de agua">
                <Droplets size={15} /> +1 vaso
              </button>
              <span className="ntrWaterHint">{waterPercent}% de tu objetivo</span>
            </form>
          </article>
          <article className="card mealStatusCard">
            <div>
              <span><small>Sensaciones</small>Cómo vas hoy</span>
              <strong>{dailySummary.energyLevel ? `${dailySummary.energyLevel}/5` : "Pendiente"}</strong>
            </div>
            <p>Registra energía y hambre para que el coach tenga contexto real.</p>
          </article>
        </div>

        {hasApprovedMealPlan && !hideMacros && hasDailyTargets ? (
          <article className="card span12 macroDailyCard ntrTodayCard">
            <div className="sectionHeader">
              <div>
                <Apple color="var(--gold)" size={26} />
                <h2>Tu día de hoy</h2>
                <p>Lo que llevas consumido frente a tu objetivo. Marca comidas y añade alimentos para verlo subir.</p>
              </div>
              <span className="tag">{completionPercent}% del plan</span>
            </div>
            <div className="ntrTodayBody">
              <MacroRings
                rings={[
                  { label: "Proteínas", consumed: consumed.protein, target: assignedMealPlan?.targetProteinG ?? null, color: "var(--accent)" },
                  { label: "Grasas", consumed: consumed.fat, target: assignedMealPlan?.targetFatG ?? null, color: "#f2a007" },
                  { label: "Carbos", consumed: consumed.carbs, target: assignedMealPlan?.targetCarbsG ?? null, color: "#22b07d" },
                ]}
                calories={{ consumed: consumed.calories, target: assignedMealPlan?.targetCalories ?? null }}
              />
              <div className="ntrWaterRing" aria-label={`Agua: ${dailySummary.waterGlasses} de ${waterTargetGlasses} vasos`}>
                <div
                  className="macroRingProgress ntrWaterRingProgress"
                  style={{ ["--ring" as string]: `${Math.min(100, Math.round((dailySummary.waterGlasses / waterTargetGlasses) * 100))}%`, ["--ringColor" as string]: "#37a0f2" }}
                >
                  <div className="macroRingHole">
                    <Droplets size={16} color="#37a0f2" />
                    <strong>{dailySummary.waterGlasses}</strong>
                    <small>/{waterTargetGlasses}</small>
                  </div>
                </div>
                <small className="macroRingLabel">Agua</small>
              </div>
            </div>
          </article>
        ) : null}

        {hasApprovedMealPlan && hideMacros ? (
          <article className="card span12 macroHiddenNote">
            <Apple color="var(--gold)" size={20} />
            <p>Tu coach ha ocultado calorías y macros para que te centres en comer bien y cumplir tu plan, sin contar números.</p>
          </article>
        ) : null}

        {!mealCards.length ? (
          <article className="card span12 planPendingCard">
            <Utensils color="var(--gold)" size={30} />
            <h2>Tu nutrición todavía no está publicada.</h2>
            <p>El briefing queda en revisión y tu coach activará el plan cuando esté preparado. No usamos comidas genéricas para rellenar pantalla.</p>
          </article>
        ) : null}

        {mealCards.map((meal, index) => (
          <article className={meal.id === nextMeal?.id ? "card span3 mealAppCard isNextMeal" : "card span3 mealAppCard"} key={meal.id}>
            <RecipeImage
              className="mealAppCardMedia"
              id={meal.recipeId || meal.id}
              name={meal.title}
              mealSlot={meal.slot}
            />
            <div className="mealAppCardTop">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {mealLogBySlot.get(meal.slot)?.status === "done" ? <CheckCircle2 color="var(--gold)" size={22} /> : <Apple color="var(--gold)" size={22} />}
            </div>
            <small>{meal.slot}</small>
            <h3>{meal.title}</h3>
            <p>{meal.instructions || "Comida preparada para cumplir tu plan de hoy."}</p>
            <div className="workoutExerciseChips">
              <span>{meal.ingredients ? `${meal.ingredients} ingredientes` : "Plan de hoy"}</span>
              {meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <MacroStrip proteinG={meal.proteinG} fatG={meal.fatG} carbsG={meal.carbsG} calories={meal.calories} hidden={hideMacros} />
            <form action={saveMealLogAction} className="mealCardActions">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="recipeId" type="hidden" value={meal.recipeId} />
              <input name="mealSlot" type="hidden" value={meal.slot} />
              <input name="mealTitle" type="hidden" value={meal.title} />
              <input name="satisfaction" type="hidden" value="4" />
              <label className="mealReasonSelect">
                Motivo si no puedes hacerla
                <select name="requestReason" defaultValue="" required>
                  <option value="">Elige motivo</option>
                  <option value="No me sienta bien">No me sienta bien</option>
                  <option value="Alergia o intolerancia">Alergia o intolerancia</option>
                  <option value="No tengo ingredientes">No tengo ingredientes</option>
                  <option value="No encaja con mi horario">No encaja con mi horario</option>
                  <option value="No puedo prepararla hoy">No puedo prepararla hoy</option>
                </select>
              </label>
              <button className="btn primary" formNoValidate name="status" value="done" type="submit"><CheckCircle2 size={16} /> Hecho</button>
              <button className="btn" name="status" value="swap_requested" type="submit"><Repeat size={16} /> Avisar al coach</button>
            </form>
            <div className="mealSwapRow">
              {meal.swapOptions.length ? (
                <MealSwapPicker
                  workspaceId={brand.id}
                  itemId={meal.id}
                  mealTitle={meal.title}
                  options={meal.swapOptions}
                  hideMacros={hideMacros}
                />
              ) : null}
              {recipeOptions.length ? (
                <Dialog
                  triggerClassName="btn ghost sm mealSwapTrigger"
                  trigger={<><Repeat size={15} /> Otra receta</>}
                  title={`Cambiar ${meal.title}`}
                  description="Elige cualquier otra receta de tu marca para esta comida. Se actualiza en tu plan y tu diario."
                >
                  <form action={swapMealAction} className="editForm">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="itemId" type="hidden" value={meal.id} />
                    <label className="spanFull">
                      Nueva receta
                      <select name="recipeId" defaultValue="" required>
                        <option value="" disabled>Elige una receta…</option>
                        {recipeOptions.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.name}{!hideMacros && recipe.calories ? ` · ${recipe.calories} kcal` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="btn primary spanFull" type="submit">Cambiar comida</button>
                  </form>
                </Dialog>
              ) : null}
            </div>
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
            <label className="spanFull">Contexto para tu coach<textarea name="notes" rows={3} placeholder="Hambre, digestión, energía, horarios o algo concreto que pueda revisar..." /></label>
            <button className="btn primary" type="submit"><Plus size={17} /> Guardar seguimiento</button>
          </form>
          <Link className="btn ghost sm mealCycleLink" href="/app/cycle"><CalendarHeart size={15} /> Seguimiento del ciclo</Link>
        </article>

        <article className="card span5 mealCoachNote">
          <MessageSquare color="var(--gold)" />
          <h2>Mensaje para tu coach</h2>
          <p>Tu plan lo marca tu coach. Si algo no puedes cumplir por una causa real, avisa desde la comida concreta y el coach decide.</p>
          <div className="row"><span>Objetivo</span><strong>{planLabel}</strong></div>
          <div className="row"><span>Comidas</span><strong>{completionPercent}%</strong></div>
          <div className="row"><span>Incidencias enviadas</span><strong>{dailySummary.swapRequests}</strong></div>
        </article>

        {hasApprovedMealPlan ? (
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
        ) : null}

      </section>
    </>
  );
}
