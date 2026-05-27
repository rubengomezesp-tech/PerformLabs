import { Apple, Repeat, ShoppingBasket } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { meals } from "@/lib/data";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedDietTemplates, listManagedRecipes } from "@/lib/repositories/nutrition-management";

export default async function MealsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [templates, recipes] = await Promise.all([
    listManagedDietTemplates(brand.id),
    listManagedRecipes(brand.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Plan de comidas"
        title={`Nutrición diaria de ${brand.appName}.`}
        text="Comidas, macros, recetas, lista de compra, ingredientes que no gustan y cambios sugeridos."
      />
      <section className="grid">
        {recipes.length ? (
          recipes.map((recipe) => (
            <article className="card span4" key={recipe.id}>
              <Apple color="var(--gold)" />
              <h3>{recipe.mealSlot}</h3>
              <p>{recipe.name}</p>
              <ul className="list">
                <li className="row">Kcal <strong>{recipe.calories}</strong></li>
                <li className="row">Macros <span>{recipe.protein}P / {recipe.carbs}C / {recipe.fat}G</span></li>
                <li className="row">Ingredientes <strong>{recipe.ingredients.length}</strong></li>
              </ul>
              <button className="btn" style={{ width: "100%", marginTop: 12 }}>
                <Repeat size={16} /> Solicitar cambio
              </button>
            </article>
          ))
        ) : templates.length ? (
          templates.map((template) => (
            <article className="card span4" key={template.id}>
              <Apple color="var(--gold)" />
              <h3>{template.name}</h3>
              <p>{template.goal || "Plantilla nutricional"}</p>
              <ul className="list">
                <li className="row">Kcal <span>{template.caloriesMin ?? "?"} - {template.caloriesMax ?? "?"}</span></li>
                <li className="row">Proteína <span>{template.proteinRatio ? `${Math.round(template.proteinRatio * 100)}%` : "Pendiente"}</span></li>
                <li className="row">Estado <span className="tag">{template.status}</span></li>
              </ul>
              <button className="btn" style={{ width: "100%", marginTop: 12 }}>
                <Repeat size={16} /> Solicitar cambio
              </button>
            </article>
          ))
        ) : (
          meals.map((meal) => (
            <article className="card span3" key={meal.name}>
              <Apple color="var(--gold)" />
              <h3>{meal.name}</h3>
              <p>{meal.meal}</p>
              <div className="row">
                <span>{meal.kcal} kcal</span>
                <span>{meal.protein}g proteína</span>
              </div>
              <button className="btn" style={{ width: "100%", marginTop: 12 }}>
                <Repeat size={16} /> Cambiar
              </button>
            </article>
          ))
        )}
        <article className="card span12">
          <ShoppingBasket color="var(--gold)" />
          <h2>Lista de compras</h2>
          <p>Selecciona días, genera lista agrupada y envíala por email.</p>
        </article>
      </section>
    </>
  );
}
