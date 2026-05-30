import { ChevronLeft, Utensils } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MacroStrip } from "@/components/macro-strip";
import { RecipeImage } from "@/components/recipe-image";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedRecipes } from "@/lib/repositories/nutrition-management";
import { getMemberNutritionVisibility } from "@/lib/repositories/nutrition-tracking";

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

  return (
    <section className="grid recipeDetail">
      <div className="span12 recipeDetailBack">
        <Link className="btn ghost sm" href="/app/recipes"><ChevronLeft size={16} /> Recetas</Link>
      </div>

      <article className="card span12 recipeDetailHero">
        <RecipeImage
          variant="detail"
          className="recipeDetailMedia"
          id={recipe.id}
          name={recipe.name}
          mealSlot={recipe.mealSlot}
          imageUrl={recipe.imageUrl}
        />
        <div className="recipeDetailHeading">
          {recipe.mealSlot ? <span className="eyebrow">{recipe.mealSlot}</span> : null}
          <h1>{recipe.name}</h1>
          {recipe.tags.length ? <p className="recipeTags">{recipe.tags.join(" · ")}</p> : null}
          <MacroStrip
            variant="card"
            proteinG={recipe.protein}
            fatG={recipe.fat}
            carbsG={recipe.carbs}
            calories={recipe.calories}
            hidden={visibility.hideMacros}
          />
        </div>
      </article>

      <article className="card span5 recipeIngredients">
        <h2>Ingredientes</h2>
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

      <article className="card span7 recipeSteps">
        <h2>Preparación</h2>
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
