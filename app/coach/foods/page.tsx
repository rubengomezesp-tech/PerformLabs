import { Salad, Sparkles, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { CATEGORY_LABEL, CATEGORY_ORDER, listFoodLibrary, type FoodCategory } from "@/lib/repositories/food-library";
import { createFoodItemAction, deleteFoodItemAction, seedStarterFoodsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachFoodsPage() {
  const brand = await getSelectedMemberAppBrand();
  const items = await listFoodLibrary(brand.id);
  const isFallback = items.length > 0 && items.every((food) => food.isStarter);
  const realCount = isFallback ? 0 : items.length;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    foods: items.filter((food) => food.category === category),
  })).filter((group) => group.foods.length > 0);

  return (
    <>
      <Topbar
        eyebrow="Alimentos"
        title="Tu biblioteca de alimentos."
        text="Define los alimentos de tu marca con sus macros. El cliente los añade a su diario en un toque, sin escribir nada."
      />
      <section className="grid">
        <article className="card span5">
          <div className="sectionHeader">
            <div>
              <Salad color="var(--accent)" aria-hidden="true" />
              <h2>Nuevo alimento</h2>
              <p>Macros por la ración indicada. Si no pones calorías, las calculamos.</p>
            </div>
          </div>
          <form action={createFoodItemAction} className="coachBrainForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>Nombre<input name="name" placeholder="Pechuga de pollo a la plancha" required maxLength={120} /></label>
            <div className="formGrid">
              <label>Marca (opcional)<input name="brand" placeholder="Hacendado" maxLength={80} /></label>
              <label>Ración<input name="servingLabel" placeholder="100 g" defaultValue="100 g" maxLength={40} /></label>
            </div>
            <label>
              Categoría
              <select name="category" defaultValue="protein">
                {CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABEL[category as FoodCategory]}</option>
                ))}
              </select>
            </label>
            <div className="foodMacroGrid">
              <label>Proteína (g)<input name="protein" type="number" inputMode="decimal" min="0" step="0.1" placeholder="31" /></label>
              <label>Carbos (g)<input name="carbs" type="number" inputMode="decimal" min="0" step="0.1" placeholder="0" /></label>
              <label>Grasas (g)<input name="fat" type="number" inputMode="decimal" min="0" step="0.1" placeholder="3.6" /></label>
              <label>Kcal<input name="calories" type="number" inputMode="numeric" min="0" step="1" placeholder="165" /></label>
            </div>
            <label>Foto del producto (URL, opcional)<input name="imageUrl" type="url" inputMode="url" placeholder="https://… (si la dejas vacía, se usa el icono de marca)" /></label>
            <SubmitButton className="btn primary" pendingLabel="Añadiendo…"><Salad size={16} /> Añadir a la biblioteca</SubmitButton>
          </form>
        </article>

        <article className="card span7">
          <div className="sectionHeader">
            <div>
              <Salad color="var(--accent)" aria-hidden="true" />
              <h2>Biblioteca</h2>
              <p>{isFallback ? "Mostrando alimentos base de ejemplo." : `${realCount} alimento(s) en tu biblioteca.`}</p>
            </div>
          </div>

          {isFallback ? (
            <div className="foodSeed">
              <Sparkles size={18} color="var(--accent)" aria-hidden="true" />
              <div>
                <strong>Empieza con {items.length} alimentos comunes.</strong>
                <p>Cárgalos como base editable y ajústalos a tu marca, o añade los tuyos a la izquierda.</p>
              </div>
              <form action={seedStarterFoodsAction}>
                <input name="workspaceId" type="hidden" value={brand.id} />
                <SubmitButton className="btn" pendingLabel="Cargando…"><Sparkles size={15} /> Cargar alimentos base</SubmitButton>
              </form>
            </div>
          ) : null}

          {byCategory.map((group) => (
            <div className="foodGroup" key={group.category}>
              <h3 className="foodCatTitle">{CATEGORY_LABEL[group.category as FoodCategory]}</h3>
              <ul className="foodList">
                {group.foods.map((food) => (
                  <li className="foodRow" key={food.id}>
                    <div className="foodInfo">
                      <strong>{food.name}{food.brand ? <span className="foodBrand"> · {food.brand}</span> : null}</strong>
                      <div className="catalogChips">
                        <span className="catalogChip">{food.servingLabel}</span>
                        <span className="catalogChip accent">{Math.round(food.calories)} kcal</span>
                        <span className="catalogChip">{food.protein} P</span>
                        <span className="catalogChip">{food.carbs} C</span>
                        <span className="catalogChip">{food.fat} G</span>
                      </div>
                    </div>
                    {food.isStarter || food.isBase ? (
                      // Base-library foods are shared by the platform; coaches can
                      // hide/duplicate but not delete them from their own library.
                      food.isBase ? <span className="catalogChip" title="Alimento base de la plataforma">Base</span> : null
                    ) : (
                      <form action={deleteFoodItemAction}>
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="foodId" type="hidden" value={food.id} />
                        <button type="submit" className="btn ghost sm" aria-label="Eliminar"><Trash2 size={14} /></button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </article>
      </section>
    </>
  );
}
