import { ChefHat, Filter, Utensils } from "lucide-react";
import Link from "next/link";
import { MemberEmpty } from "@/components/member-empty";
import { MacroStrip } from "@/components/macro-strip";
import { RecipeImage } from "@/components/recipe-image";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { getMemberNutritionVisibility } from "@/lib/repositories/nutrition-tracking";

export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type RecipesPageProps = {
  searchParams?: Promise<{ q?: string; slot?: string }>;
};

export default async function MemberRecipesPage({ searchParams }: RecipesPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const [allRecipes, visibility] = await Promise.all([
    listManagedRecipes(brand.id, { includeBase: true }),
    getMemberNutritionVisibility(brand.id),
  ]);

  const query = normalize((params?.q ?? "").trim());
  const slot = (params?.slot ?? "").trim();
  const slots = [...new Set(allRecipes.map((recipe) => recipe.mealSlot).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const recipes = allRecipes
    .filter((recipe) => !query || normalize(recipe.name).includes(query) || recipe.tags.some((tag) => normalize(tag).includes(query)))
    .filter((recipe) => !slot || recipe.mealSlot === slot);
  const hasFilters = Boolean(query || slot);

  return (
    <>
      <Topbar
        eyebrow="Recetas"
        title="Recetas para tu plan."
        text="Explora recetas con sus ingredientes y modo de preparación. Encuentra ideas para cumplir tu plan sin aburrirte."
        actions={<Link className="btn" href="/app/meals"><Utensils size={16} /> Mi plan</Link>}
      />
      <section className="grid">
        <article className="card span12 uiGlass uiSheen ntrbRecipeFilters">
          <form action="/app/recipes" className="recipeFilters" method="get">
            <label>
              Buscar
              <input name="q" defaultValue={params?.q ?? ""} placeholder="pollo, avena, ensalada..." />
            </label>
            <label>
              Momento
              <select name="slot" defaultValue={slot}>
                <option value="">Todas</option>
                {slots.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Filtrar <Filter size={16} /></button>
              {hasFilters ? <Link className="btn ghost" href="/app/recipes">Limpiar</Link> : null}
            </div>
          </form>
        </article>

        {recipes.length ? (
          <div className="span12 recipeGrid">
            {recipes.map((recipe, index) => (
              <Link className="recipeCard uiSheen ntrbRecipeCard uiFadeUp" style={{ ["--i" as string]: index % 8 }} href={`/app/recipes/${recipe.id}`} key={recipe.id}>
                <RecipeImage
                  className="recipeMedia"
                  id={recipe.id}
                  name={recipe.name}
                  mealSlot={recipe.mealSlot}
                  imageUrl={recipe.imageUrl}
                >
                  {recipe.mealSlot ? <span className="recipeSlot ntrbRecipeSlot">{recipe.mealSlot}</span> : null}
                </RecipeImage>
                <div className="recipeBody">
                  <h3>{recipe.name}</h3>
                  {recipe.tags.length ? <p className="recipeTags">{recipe.tags.slice(0, 3).join(" · ")}</p> : null}
                  <MacroStrip
                    proteinG={recipe.protein}
                    fatG={recipe.fat}
                    carbsG={recipe.carbs}
                    calories={recipe.calories}
                    hidden={visibility.hideMacros}
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <MemberEmpty
            icon={ChefHat}
            title={hasFilters ? "No hay recetas con estos filtros." : "Todavía no hay recetas publicadas."}
            text={hasFilters ? "Prueba con otra búsqueda o cambia el momento del día." : "Tu coach añadirá recetas a tu marca y aparecerán aquí."}
            action={hasFilters ? <Link className="btn ghost" href="/app/recipes">Limpiar filtros</Link> : undefined}
          />
        )}
      </section>
    </>
  );
}
