import { Heart, NotebookPen, Plus, Salad, Search } from "lucide-react";
import Link from "next/link";
import { RecipeImage } from "@/components/recipe-image";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  listMemberFoodLibrary,
  type FoodCategory,
  type MemberFoodItem,
} from "@/lib/repositories/food-library";

/** English Loremflickr keywords by food category, so the thumb photo is relevant. */
const FOOD_KEYWORD: Record<FoodCategory, string> = {
  protein: "meat,protein",
  carb: "rice,grains",
  fat: "nuts,oil",
  dairy: "dairy,milk",
  veg: "vegetables",
  fruit: "fruit",
  snack: "snack",
  drink: "drink,beverage",
  other: "food,meal",
};
import { getMemberNutritionVisibility, listFoodDiaryEntries } from "@/lib/repositories/nutrition-tracking";
import { quickAddFoodAction, toggleFoodFavoriteAction } from "./actions";

export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type FoodsPageProps = {
  searchParams?: Promise<{ q?: string; date?: string }>;
};

function FoodRow({
  food,
  workspaceId,
  date,
  hideMacros,
}: {
  food: MemberFoodItem;
  workspaceId: string;
  date: string;
  hideMacros: boolean;
}) {
  return (
    <li className="foodRow">
      <RecipeImage
        variant="thumb"
        className="foodThumb"
        id={food.id}
        name={food.name}
        keyword={FOOD_KEYWORD[food.category]}
      />
      <div className="foodInfo">
        <strong>{food.name}{food.brand ? <span className="foodBrand"> · {food.brand}</span> : null}</strong>
        <small>
          {food.servingLabel}
          {hideMacros ? null : ` · ${Math.round(food.calories)} kcal · ${food.protein} P / ${food.carbs} C / ${food.fat} G`}
        </small>
      </div>
      <div className="foodActions">
        {food.isStarter ? null : (
          <form action={toggleFoodFavoriteAction} className="foodFavForm">
            <input name="workspaceId" type="hidden" value={workspaceId} />
            <input name="foodId" type="hidden" value={food.id} />
            <button
              type="submit"
              className={food.favorite ? "foodFav active" : "foodFav"}
              aria-label={food.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart size={15} fill={food.favorite ? "currentColor" : "none"} />
            </button>
          </form>
        )}
        <form action={quickAddFoodAction} className="foodAddForm">
          <input name="workspaceId" type="hidden" value={workspaceId} />
          <input name="foodId" type="hidden" value={food.id} />
          <input name="date" type="hidden" value={date} />
          <input
            className="foodQty"
            name="quantity"
            type="number"
            min="0.25"
            step="0.25"
            defaultValue="1"
            aria-label="Raciones"
          />
          <SubmitButton className="btn sm primary" pendingLabel="…"><Plus size={14} /> Añadir</SubmitButton>
        </form>
      </div>
    </li>
  );
}

export default async function MemberFoodsPage({ searchParams }: FoodsPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const query = (params?.q ?? "").trim();
  const date = params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayIso();

  const [{ favorites, items, isFallback }, visibility, diaryEntries] = await Promise.all([
    listMemberFoodLibrary(brand.id, query),
    getMemberNutritionVisibility(brand.id),
    listFoodDiaryEntries(brand.id, date),
  ]);
  const hideMacros = visibility.hideMacros;
  const loggedToday = diaryEntries.reduce(
    (totals, entry) => {
      totals.calories += entry.calories ?? 0;
      totals.protein += entry.protein ?? 0;
      totals.carbs += entry.carbs ?? 0;
      totals.fat += entry.fat ?? 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const isToday = date === todayIso();

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    foods: items.filter((food) => food.category === category),
  })).filter((group) => group.foods.length > 0);

  return (
    <>
      <Topbar
        eyebrow="Alimentos"
        title="Añade comida en un toque."
        text="Busca un alimento, elige las raciones y se suma a tu diario al instante. Sin escribir macros."
        actions={
          <>
            <Link className="btn" href={`/app/diary?date=${date}`}><NotebookPen size={16} /> Ver diario</Link>
          </>
        }
      />
      <section className="grid">
        <article className="card span12 foodSearchCard">
          <form method="get" action="/app/foods" className="foodSearch" role="search">
            <input type="hidden" name="date" value={date} />
            <Search size={17} className="foodSearchIcon" />
            <input name="q" defaultValue={query} placeholder="Buscar alimento (pollo, arroz, avena…)" aria-label="Buscar alimento" />
            <button className="btn sm" type="submit">Buscar</button>
          </form>
        </article>

        {!hideMacros && diaryEntries.length ? (
          <article className="card span12 ntrFoodsTotals" aria-live="polite">
            <div className="ntrFoodsTotalsHead">
              <NotebookPen size={16} color="var(--accent)" />
              <strong>{isToday ? "Llevas hoy" : "Registrado ese día"}</strong>
              <Link className="ntrFoodsTotalsLink" href={`/app/diary?date=${date}`}>Ver diario</Link>
            </div>
            <div className="ntrFoodsTotalsRow">
              <span><strong>{Math.round(loggedToday.calories)}</strong><small>kcal</small></span>
              <span><strong>{Math.round(loggedToday.protein)}<i>g</i></strong><small>Proteínas</small></span>
              <span><strong>{Math.round(loggedToday.carbs)}<i>g</i></strong><small>Carbos</small></span>
              <span><strong>{Math.round(loggedToday.fat)}<i>g</i></strong><small>Grasas</small></span>
              <span><strong>{diaryEntries.length}</strong><small>entradas</small></span>
            </div>
          </article>
        ) : null}

        {favorites.length ? (
          <article className="card span12 foodGroupCard">
            <div className="sectionHeader">
              <div>
                <Heart color="var(--accent)" />
                <h2>Tus favoritos</h2>
                <p>Lo que más registras, siempre a mano.</p>
              </div>
            </div>
            <ul className="foodList">
              {favorites.map((food) => (
                <FoodRow key={food.id} food={food} workspaceId={brand.id} date={date} hideMacros={hideMacros} />
              ))}
            </ul>
          </article>
        ) : null}

        {byCategory.length ? (
          byCategory.map((group) => (
            <article className="card span12 foodGroupCard" key={group.category}>
              <h3 className="foodCatTitle">{CATEGORY_LABEL[group.category as FoodCategory]}</h3>
              <ul className="foodList">
                {group.foods.map((food) => (
                  <FoodRow key={food.id} food={food} workspaceId={brand.id} date={date} hideMacros={hideMacros} />
                ))}
              </ul>
            </article>
          ))
        ) : (
          <article className="card span12 inlineEmpty">
            <Salad color="var(--accent)" />
            <strong>{query ? "Sin resultados para tu búsqueda." : "Aún no hay alimentos en tu biblioteca."}</strong>
            <p>{query ? "Prueba con otro nombre o pídele a tu coach que lo añada." : "Tu coach irá añadiendo los alimentos de tu plan aquí."}</p>
          </article>
        )}

        {isFallback ? (
          <p className="span12 foodFallbackNote">Mostrando alimentos comunes. Tu coach puede personalizar esta lista para tu marca.</p>
        ) : null}
      </section>
    </>
  );
}
