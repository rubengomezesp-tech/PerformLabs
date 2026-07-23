import { ChevronLeft, Droplets } from "lucide-react";
import Link from "next/link";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberMealPlanWeek } from "@/lib/repositories/nutrition-tracking";
import { PlanPrintButton } from "../plan-print-button";

export const dynamic = "force-dynamic";

function macroLine(item: {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}) {
  const cells = [
    item.calories !== null ? `${item.calories} kcal` : null,
    item.proteinG !== null ? `${item.proteinG}g P` : null,
    item.carbsG !== null ? `${item.carbsG}g C` : null,
    item.fatG !== null ? `${item.fatG}g G` : null,
  ].filter(Boolean) as string[];
  return cells.join(" · ");
}

export default async function MealPlanPrintPage() {
  const brand = await getSelectedMemberAppBrand();
  const week = await getMemberMealPlanWeek(brand.id);

  if (!week || !week.days.length) {
    return (
      <section className="grid planPrintRoot">
        <article className="card span12 planPendingCard">
          <h2>Todavía no hay un plan publicado para imprimir.</h2>
          <p>Cuando tu coach active tu plan de comidas podrás exportarlo aquí en una hoja limpia o como PDF.</p>
          <Link className="btn" href="/app/meals"><ChevronLeft size={16} /> Volver a comidas</Link>
        </article>
      </section>
    );
  }

  const waterGlasses = week.waterTargetMl ? Math.max(6, Math.round(week.waterTargetMl / 250)) : 8;
  const generatedOn = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date());

  return (
    <div className="planPrintRoot" style={{ ["--accent" as string]: brand.accentColor }}>
      <div className="planPrintToolbar" data-print-hidden>
        <Link className="btn ghost sm" href="/app/meals"><ChevronLeft size={16} /> Volver</Link>
        <PlanPrintButton />
      </div>

      <article className="planPrintSheet">
        <header className="planPrintHeader">
          <div className="planPrintBrand">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="planPrintLogo" src={brand.logoUrl} alt="" />
            ) : (
              <span className="planPrintMark" style={{ borderColor: brand.accentColor, color: brand.accentColor }}>
                {(brand.appName || brand.name || "PL").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{brand.appName || brand.name}</strong>
              <span>Plan de comidas</span>
            </div>
          </div>
          <div className="planPrintMeta">
            <strong>{week.planName}</strong>
            <span>Generado el {generatedOn}</span>
            <span className="planPrintWater"><Droplets size={13} /> Agua objetivo: {waterGlasses} vasos / día</span>
          </div>
        </header>

        <div className="planPrintDays">
          {week.days.map((day) => (
            <section className={day.isToday ? "planPrintDay isToday" : "planPrintDay"} key={day.dayId}>
              <div className="planPrintDayHead">
                <h2>{day.dayTitle}{day.isToday ? <span className="planPrintTodayTag">Hoy</span> : null}</h2>
                {!week.hideMacros && day.targetCalories ? (
                  <span className="planPrintDayTarget">
                    Objetivo: {day.targetCalories} kcal
                    {day.targetProteinG ? ` · ${day.targetProteinG}g P` : ""}
                    {day.targetCarbsG ? ` · ${day.targetCarbsG}g C` : ""}
                    {day.targetFatG ? ` · ${day.targetFatG}g G` : ""}
                  </span>
                ) : null}
              </div>
              {day.items.length ? (
                <ul className="planPrintMeals">
                  {day.items.map((item) => {
                    const macros = week.hideMacros ? "" : macroLine(item);
                    return (
                      <li className="planPrintMeal" key={item.id}>
                        <span className="planPrintMealSlot">{item.mealSlot}</span>
                        <div className="planPrintMealBody">
                          <strong>{item.title}</strong>
                          {item.instructions ? <p>{item.instructions}</p> : null}
                          {macros ? <span className="planPrintMealMacros">{macros}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="planPrintEmpty">Sin comidas asignadas para este día.</p>
              )}
            </section>
          ))}
        </div>

        <footer className="planPrintFooter">
          <span>{brand.appName || brand.name} · Plan de comidas personalizado</span>
          <span>Sigue las indicaciones de tu coach. Avisa de cualquier incidencia desde la app.</span>
        </footer>
      </article>
    </div>
  );
}
