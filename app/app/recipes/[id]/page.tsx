import { ChefHat, ChevronLeft, NotebookPen, ShoppingBasket, Utensils } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeImage } from "@/components/recipe-image";
import { cloudinaryFetch } from "@/lib/cloudinary";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { getMemberNutritionVisibility } from "@/lib/repositories/nutrition-tracking";
import { logRecipeToDiaryAction } from "./actions";
import { RecipeMacroToggle } from "./recipe-macro-toggle";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberRecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const brand = await getSelectedMemberAppBrand();
  const [recipes, visibility] = await Promise.all([
    listManagedRecipes(brand.id, { includeBase: true }),
    getMemberNutritionVisibility(brand.id),
  ]);

  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) notFound();

  const steps = (recipe.instructions ?? "")
    .split(/\n+/)
    .map((step) => step.trim())
    .filter(Boolean);

  const totalGrams = recipe.ingredients.reduce((sum, ingredient) => sum + (ingredient.grams || 0), 0);
  // Serve a curated recipe photo through Cloudinary fetch (f_auto/q_auto, CDN,
  // zero storage). Fallback photos resolve inside RecipeImage untouched.
  const heroImageUrl = recipe.imageUrl
    ? cloudinaryFetch(recipe.imageUrl, { width: 960, height: 660 })
    : recipe.imageUrl;

  return (
    <section className="grid recipeDetail">
      <div className="span12 recipeDetailBack">
        <Link className="btn ghost sm" href="/app/recipes"><ChevronLeft size={16} /> Recetas</Link>
      </div>

      <article className="card span12 recipeDetailHero uiGlass uiSheen ntrbRecipeHero">
        <RecipeImage
          variant="detail"
          className="recipeDetailMedia"
          id={recipe.id}
          name={recipe.name}
          mealSlot={recipe.mealSlot}
          imageUrl={heroImageUrl}
        />
        <div className="recipeDetailHeading">
          {recipe.mealSlot ? <span className="eyebrow ntrbRecipeEyebrow">{recipe.mealSlot}</span> : null}
          <h1>{recipe.name}</h1>
          {recipe.tags.length ? <p className="recipeTags">{recipe.tags.join(" · ")}</p> : null}
          <RecipeMacroToggle
            protein={recipe.protein}
            fat={recipe.fat}
            carbs={recipe.carbs}
            calories={recipe.calories}
            totalGrams={totalGrams}
            hidden={visibility.hideMacros}
          />
          <form action={logRecipeToDiaryAction} className="ntrRecipeLogForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="name" type="hidden" value={recipe.name} />
            <input name="protein" type="hidden" value={recipe.protein} />
            <input name="fat" type="hidden" value={recipe.fat} />
            <input name="carbs" type="hidden" value={recipe.carbs} />
            <input name="calories" type="hidden" value={recipe.calories} />
            <button className="btn primary" type="submit">
              <NotebookPen size={16} /> Registrar en mi diario
            </button>
          </form>
        </div>
      </article>

      <article className="card span5 recipeIngredients uiSheen">
        <h2 className="ntrbRecipeSubhead"><span className="uiIconChip ntrbSectionChip"><ShoppingBasket size={18} /></span>Ingredientes</h2>
        {recipe.ingredients.length ? (
          <ul className="list">
            {recipe.ingredients.map((ingredient, index) => (
              <li className="row" key={`${ingredient.name}-${index}`}>
                <span>{ingredient.name}</span>
                {ingredient.grams ? <strong>{Math.round(ingredient.grams)} g</strong> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Esta receta todavía no tiene ingredientes detallados.</p>
        )}
      </article>

      <article className="card span7 recipeSteps uiSheen">
        <h2 className="ntrbRecipeSubhead"><span className="uiIconChip ntrbSectionChip"><ChefHat size={18} /></span>Preparación</h2>
        {steps.length ? (
          <ol className="recipeStepList">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="muted">Sin pasos detallados. Sigue las indicaciones de tu coach.</p>
        )}
        <Link className="btn" href="/app/meals"><Utensils size={16} /> Ver mi plan de hoy</Link>
      </article>
    </section>
  );
}
