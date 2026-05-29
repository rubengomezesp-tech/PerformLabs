import { Apple, CheckCircle2, Droplets, NotebookPen, Sparkles, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { MacroRings } from "@/components/macro-rings";
import { MacroStrip } from "@/components/macro-strip";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { saveMealLogAction } from "@/app/app/meals/actions";
import { getMemberMealPlanForToday, getMemberNutritionVisibility, getNutritionDailySummary, listFoodDiaryEntries } from "@/lib/repositories/nutrition-tracking";
import { deleteFoodEntryAction, smartAddMealAction } from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type DiaryPageProps = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function MemberDiaryPage({ searchParams }: DiaryPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();

  const today = new Date();
  const todayStr = isoDate(today);
  const selected = params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayStr;
  const isToday = selected === todayStr;

  const [plan, summary, visibility, foodEntries] = await Promise.all([
    getMemberMealPlanForToday(brand.id),
    getNutritionDailySummary(brand.id, selected),
    getMemberNutritionVisibility(brand.id),
    listFoodDiaryEntries(brand.id, selected),
  ]);

  const hideMacros = (plan?.hideMacros ?? false) || visibility.hideMacros;
  const logBySlot = new Map(summary.mealLogs.map((log) => [log.mealSlot, log]));
  const items = plan?.items ?? [];

  const consumed = items.reduce(
    (totals, item) => {
      if (logBySlot.get(item.mealSlot)?.status !== "done") return totals;
      totals.calories += item.calories ?? 0;
      totals.protein += item.proteinG ?? 0;
      totals.carbs += item.carbsG ?? 0;
      totals.fat += item.fatG ?? 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  for (const entry of foodEntries) {
    consumed.calories += entry.calories ?? 0;
    consumed.protein += entry.protein ?? 0;
    consumed.carbs += entry.carbs ?? 0;
    consumed.fat += entry.fat ?? 0;
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const hasPlan = items.length > 0;
  const doneCount = items.filter((item) => logBySlot.get(item.mealSlot)?.status === "done").length;

  return (
    <>
      <Topbar
        eyebrow="Diario"
        title="Tu diario de comida."
        text="Lleva el control de lo que comes y mira cómo avanzas hacia tus objetivos del día."
        actions={
          <>
            <Link className="btn" href="/app/meals"><Utensils size={16} /> Mi plan</Link>
            <Link className="btn ghost" href="/app/recipes"><Apple size={16} /> Recetas</Link>
          </>
        }
      />
      <section className="grid">
        <nav className="span12 diaryDates" aria-label="Días">
          {days.map((date) => {
            const value = isoDate(date);
            const active = value === selected;
            return (
              <Link
                key={value}
                href={`/app/diary?date=${value}`}
                className={active ? "diaryDate active" : "diaryDate"}
                aria-current={active ? "date" : undefined}
              >
                <small>{WEEKDAYS[date.getDay()]}</small>
                <strong>{date.getDate()}</strong>
              </Link>
            );
          })}
        </nav>

        <article className="card span12 diaryIntakeCard">
          <div className="sectionHeader">
            <div>
              <NotebookPen color="var(--accent)" />
              <h2>Ingesta del día</h2>
              <p>{isToday ? "Hoy" : selected} · {hasPlan ? `${doneCount}/${items.length} comidas registradas` : "Sin plan publicado"}</p>
            </div>
          </div>
          {hideMacros ? (
            <p className="muted">Tu coach ha ocultado calorías y macros. Céntrate en cumplir tus comidas del día.</p>
          ) : (
            <MacroRings
              rings={[
                { label: "Proteínas", consumed: consumed.protein, target: plan?.targetProteinG ?? null, color: "var(--accent)" },
                { label: "Grasas", consumed: consumed.fat, target: plan?.targetFatG ?? null, color: "#f2a007" },
                { label: "Carbos", consumed: consumed.carbs, target: plan?.targetCarbsG ?? null, color: "#22b07d" },
              ]}
              calories={{ consumed: consumed.calories, target: plan?.targetCalories ?? null }}
            />
          )}
        </article>

        <article className="card span12 diaryStats">
          <span><CheckCircle2 size={17} color="var(--accent)" /> <strong>{doneCount}</strong> comidas registradas</span>
          <span><Droplets size={17} color="var(--accent)" /> <strong>{summary.waterGlasses}</strong> vasos de agua</span>
          <span><Apple size={17} color="var(--accent)" /> <strong>{summary.energyLevel ? `${summary.energyLevel}/5` : "—"}</strong> energía</span>
        </article>

        <article className="card span12 smartAddCard">
          <div className="sectionHeader">
            <div>
              <Sparkles color="var(--accent)" />
              <h2>Smart Add</h2>
              <p>Describe lo que comiste y la IA estima los macros y lo añade a tu día.</p>
            </div>
            <span className="tag">IA</span>
          </div>
          <form action={smartAddMealAction} className="smartAddForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="date" type="hidden" value={selected} />
            <textarea name="description" rows={2} required placeholder="Ej. 2 huevos revueltos con pan integral y un café con leche" />
            <button className="btn primary" type="submit"><Sparkles size={16} /> Estimar y añadir</button>
          </form>
        </article>

        {hasPlan ? (
          <div className="span12 diaryEntries">
            {items.map((item) => {
              const done = logBySlot.get(item.mealSlot)?.status === "done";
              return (
                <article className={done ? "card diaryEntry done" : "card diaryEntry"} key={item.id}>
                  <div className="diaryEntryHead">
                    <div>
                      <small>{item.mealSlot}</small>
                      {item.recipeId ? (
                        <Link href={`/app/recipes/${item.recipeId}`} className="diaryEntryTitle">{item.title}</Link>
                      ) : (
                        <strong className="diaryEntryTitle">{item.title}</strong>
                      )}
                    </div>
                    {done ? (
                      <span className="tag"><CheckCircle2 size={14} /> Hecho</span>
                    ) : isToday ? (
                      <form action={saveMealLogAction}>
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="recipeId" type="hidden" value={item.recipeId ?? ""} />
                        <input name="mealSlot" type="hidden" value={item.mealSlot} />
                        <input name="mealTitle" type="hidden" value={item.title} />
                        <input name="satisfaction" type="hidden" value="4" />
                        <button className="btn sm" name="status" value="done" type="submit">Registrar</button>
                      </form>
                    ) : (
                      <span className="tag muted">Pendiente</span>
                    )}
                  </div>
                  <MacroStrip proteinG={item.proteinG} fatG={item.fatG} carbsG={item.carbsG} calories={item.calories} hidden={hideMacros} />
                </article>
              );
            })}
          </div>
        ) : (
          <article className="card span12 inlineEmpty">
            <NotebookPen color="var(--accent)" />
            <strong>Tu plan de comida aún no está publicado.</strong>
            <p>Cuando tu coach active el plan, podrás registrar tus comidas y ver tu ingesta diaria aquí.</p>
          </article>
        )}

        {foodEntries.length ? (
          <article className="card span12 foodEntriesCard">
            <div className="sectionHeader">
              <div>
                <Sparkles color="var(--accent)" />
                <h2>Añadido por ti</h2>
                <p>Comidas que registraste fuera del plan.</p>
              </div>
            </div>
            <ul className="list">
              {foodEntries.map((entry) => (
                <li className="row" key={entry.id}>
                  <div>
                    <strong>{entry.name}</strong>
                    {!hideMacros && (entry.calories !== null || entry.protein !== null) ? (
                      <p className="muted">
                        {entry.protein !== null ? `${Math.round(entry.protein)} P · ` : ""}
                        {entry.fat !== null ? `${Math.round(entry.fat)} G · ` : ""}
                        {entry.carbs !== null ? `${Math.round(entry.carbs)} C · ` : ""}
                        {entry.calories !== null ? `${Math.round(entry.calories)} kcal` : ""}
                      </p>
                    ) : null}
                  </div>
                  <form action={deleteFoodEntryAction}>
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="entryId" type="hidden" value={entry.id} />
                    <button className="btn ghost sm" type="submit" aria-label="Eliminar entrada"><Trash2 size={14} /></button>
                  </form>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    </>
  );
}
