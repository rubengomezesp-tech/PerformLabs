/**
 * Seeds the shared base nutrition library (ingredients + recipes) used as the
 * platform-wide "Source: base" content that every coach inherits and can clone.
 *
 * Mirrors import-free-exercise-db.mjs conventions:
 *   node scripts/seed-nutrition-library.mjs            # dry-run (no writes)
 *   node scripts/seed-nutrition-library.mjs --apply    # write base library (workspace_id = null)
 *   node scripts/seed-nutrition-library.mjs --apply --workspace=<uuid>  # seed into one workspace
 *   node scripts/seed-nutrition-library.mjs --file=path/to/library.json  # custom dataset
 *
 * Idempotent: re-running upserts by slug and refreshes recipe ingredients.
 * Scale path: extend scripts/data/nutrition-seed.json or point --file at an
 * exported open dataset to grow toward thousands of recipes.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_FILE = new URL("./data/nutrition-seed.json", import.meta.url);

function readArgs() {
  const argv = process.argv.slice(2);
  const fileArg = argv.find((arg) => arg.startsWith("--file="));
  const workspaceArg = argv.find((arg) => arg.startsWith("--workspace="));
  return {
    apply: argv.includes("--apply"),
    file: fileArg ? fileArg.split("=")[1] : null,
    workspaceId: workspaceArg ? workspaceArg.split("=")[1] : null,
  };
}

async function loadEnvFile() {
  try {
    const envText = await readFile(".env.local", "utf8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // optional
  }
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || serviceRoleKey.includes("PEGAR_")) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

async function upsertIngredient(supabase, item, workspaceId, apply) {
  const slug = slugify(item.name);
  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .eq("slug", slug)
    .eq("is_base_library", workspaceId === null)
    .maybeSingle();

  if (existing?.id) return { id: existing.id, created: false };
  if (!apply) return { id: `dry-${slug}`, created: true };

  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      name: item.name,
      slug,
      calories_per_100g: item.kcal,
      protein_per_100g: item.protein ?? 0,
      carbs_per_100g: item.carbs ?? 0,
      fat_per_100g: item.fat ?? 0,
      allergens: item.allergens ?? [],
      tags: [...new Set([...(item.tags ?? []), "base"])],
      is_base_library: workspaceId === null,
      workspace_id: workspaceId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Ingrediente "${item.name}": ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertRecipe(supabase, recipe, ingredientIds, workspaceId, apply) {
  const slug = slugify(recipe.name);
  let recipeId;
  const { data: existing } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .eq("is_base_library", workspaceId === null)
    .maybeSingle();

  if (existing?.id) {
    recipeId = existing.id;
  } else if (apply) {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        name: recipe.name,
        slug,
        meal_slot: recipe.mealSlot ?? "lunch",
        instructions: recipe.instructions ?? "",
        tags: [...new Set([...(recipe.tags ?? []), "base"])],
        is_base_library: workspaceId === null,
        workspace_id: workspaceId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Receta "${recipe.name}": ${error.message}`);
    recipeId = data.id;
  } else {
    return { created: true };
  }

  if (apply) {
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    const rows = recipe.items
      .map((entry, index) => {
        const ingredientId = ingredientIds.get(entry.ingredient);
        if (!ingredientId) return null;
        return { recipe_id: recipeId, ingredient_id: ingredientId, grams: entry.grams, sort_order: index };
      })
      .filter(Boolean);
    if (rows.length) {
      const { error } = await supabase.from("recipe_ingredients").insert(rows);
      if (error) throw new Error(`Ingredientes de "${recipe.name}": ${error.message}`);
    }
  }

  return { created: !existing?.id };
}

async function main() {
  const { apply, file, workspaceId } = readArgs();
  await loadEnvFile();

  const raw = await readFile(file ? file : DEFAULT_FILE, "utf8");
  const library = JSON.parse(raw);
  const ingredients = library.ingredients ?? [];
  const recipes = library.recipes ?? [];

  console.log(`Nutrition library seed — ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Target: ${workspaceId ? `workspace ${workspaceId}` : "base library (workspace_id = null)"}`);
  console.log(`Dataset: ${ingredients.length} ingredientes, ${recipes.length} recetas\n`);

  const supabase = createSupabase();

  const ingredientIds = new Map();
  let createdIngredients = 0;
  for (const item of ingredients) {
    const { id, created } = await upsertIngredient(supabase, item, workspaceId, apply);
    ingredientIds.set(item.name, id);
    if (created) createdIngredients += 1;
  }
  console.log(`Ingredientes: ${createdIngredients} nuevos / ${ingredients.length} total`);

  let createdRecipes = 0;
  for (const recipe of recipes) {
    const { created } = await upsertRecipe(supabase, recipe, ingredientIds, workspaceId, apply);
    if (created) createdRecipes += 1;
  }
  console.log(`Recetas: ${createdRecipes} nuevas / ${recipes.length} total`);

  console.log(apply ? "\nListo. Librería base sembrada." : "\nDry-run completado. Ejecuta con --apply para escribir.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
