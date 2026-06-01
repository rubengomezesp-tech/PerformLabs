#!/usr/bin/env node
/**
 * import-usda-foundation.mjs — grow the shared base food library from USDA FoodData
 * Central (Foundation Foods + SR Legacy): clean, GENERIC, single-ingredient foods
 * with lab-grade macros. Maps to public.food_library_items as base-library rows
 * (workspace_id = null, is_base_library = true), inherited by every brand.
 *
 * Two input modes:
 *   1) API  — FoodData Central search, needs FDC_API_KEY (data.gov key) on a
 *             networked machine. The FOUNDER runs this (container has no network).
 *   2) FILE — a downloaded FDC bulk JSON (Foundation/SR Legacy), via --file=path.json
 *             (https://fdc.nal.usda.gov/download-datasets/). Preferred for a full,
 *             reproducible load with no rate limits.
 *
 * Mirrors import-open-food-facts.mjs: SELECT-then-insert idempotency by lower(name)+
 * lower(brand) (USDA rows are brandless ⇒ keyed by name), chunked, dry-run by default.
 *
 *   node scripts/import-usda-foundation.mjs                                  # dry-run (API, 200)
 *   node scripts/import-usda-foundation.mjs --limit=400 --apply              # write (API)
 *   node scripts/import-usda-foundation.mjs --file=FoodData_foundation.json  # dry-run (file)
 *   node scripts/import-usda-foundation.mjs --file=FoodData_foundation.json --apply
 *
 * Data: USDA FoodData Central is in the public domain (U.S. Government work, CC0).
 * Names are English generics; a small ES translation map covers the most common
 * staples, the rest keep their English description (coaches can rename their copy).
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const FDC_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const DATA_TYPES = ["Foundation", "SR Legacy"];
const SOURCE_LICENSE = "Public domain (USDA FoodData Central)";

// FDC nutrientNumbers (stable across Foundation + SR Legacy schemas).
const N_ENERGY_KCAL = "208";
const N_PROTEIN = "203";
const N_FAT = "204"; // Total lipid (fat)
const N_CARBS = "205"; // Carbohydrate, by difference

function readArgs() {
  const argv = process.argv.slice(2);
  const fileArg = argv.find((a) => a.startsWith("--file="));
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  return {
    apply: argv.includes("--apply"),
    file: fileArg ? fileArg.split("=")[1] : null,
    limit: limitArg && Number(limitArg.split("=")[1]) > 0 ? Number(limitArg.split("=")[1]) : 200,
  };
}

async function loadEnvFile() {
  try {
    const envText = await readFile(".env.local", "utf8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  } catch {
    // optional
  }
}

// Common-staple EN→ES so the most-used foods read natively; everything else keeps
// the USDA English description (still searchable, coach renames their own copy).
const NAME_ES = new Map([
  ["chicken, broilers or fryers, breast, meat only, raw", "Pechuga de pollo cruda"],
  ["egg, whole, raw, fresh", "Huevo entero crudo"],
  ["rice, white, long-grain, regular, raw, unenriched", "Arroz blanco crudo"],
  ["oats, whole grain, rolled, old fashioned", "Avena en copos"],
  ["beans, black, mature seeds, cooked, boiled, without salt", "Alubias negras cocidas"],
  ["lentils, mature seeds, cooked, boiled, without salt", "Lentejas cocidas"],
  ["broccoli, raw", "Brócoli crudo"],
  ["spinach, raw", "Espinacas crudas"],
  ["banana, raw", "Plátano"],
  ["apple, raw, with skin", "Manzana con piel"],
  ["almonds, raw", "Almendras crudas"],
  ["oil, olive, extra virgin", "Aceite de oliva virgen extra"],
  ["sweet potato, raw, unprepared", "Boniato crudo"],
  ["potatoes, raw, skin", "Patata cruda"],
  ["tuna, fresh, bluefin, raw", "Atún fresco crudo"],
]);

// Foundation/SR description → our FoodCategory. The leading token is the food class.
const CATEGORY_RULES = [
  ["protein", ["chicken", "turkey", "beef", "pork", "lamb", "fish", "tuna", "salmon", "cod", "shrimp", "egg", "tofu", "beans", "lentils", "chickpeas", "peas, split", "ham", "veal"]],
  ["dairy", ["milk", "yogurt", "cheese", "cream", "kefir", "butter, "]],
  ["fat", ["oil", "nuts", "almonds", "walnuts", "peanut", "seeds", "avocado", "margarine", "lard"]],
  ["fruit", ["apple", "banana", "orange", "berries", "berry", "grape", "melon", "peach", "pear", "pineapple", "mango", "strawberr", "fruit"]],
  ["veg", ["broccoli", "spinach", "carrot", "tomato", "pepper", "onion", "lettuce", "cabbage", "potato", "sweet potato", "mushroom", "zucchini", "cucumber", "vegetable", "kale", "cauliflower"]],
  ["carb", ["rice", "oats", "bread", "pasta", "wheat", "flour", "quinoa", "couscous", "cereal", "noodle", "barley", "corn"]],
  ["drink", ["beverage", "juice", "water", "tea", "coffee", "drink"]],
  ["snack", ["chocolate", "cookie", "candy", "snack", "cracker", "chips"]],
];

function mapCategory(description) {
  const d = String(description ?? "").toLowerCase();
  for (const [category, tokens] of CATEGORY_RULES) {
    if (tokens.some((token) => d.includes(token))) return category;
  }
  return "other";
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nutrientValue(foodNutrients, number) {
  for (const item of foodNutrients ?? []) {
    // Search API shape: { nutrientNumber, value }. Bulk-file shape:
    // { nutrient: { number }, amount }.
    const n = item.nutrientNumber ?? item.nutrient?.number ?? item.number;
    const value = item.value ?? item.amount;
    if (String(n) === number && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

// Skip processed/branded/composite descriptions — we want clean generics only.
const SKIP_TOKENS = ["babyfood", "infant formula", "fast foods", "restaurant", "mcdonald", "frozen meal", "candies", "school lunch", "with sauce", "prepared", "reformulated"];

function mapFood(food) {
  const description = String(food.description ?? "").trim();
  if (!description || description.length < 2) return null;
  const lower = description.toLowerCase();
  if (SKIP_TOKENS.some((token) => lower.includes(token))) return null;

  const fn = food.foodNutrients ?? [];
  const protein = nutrientValue(fn, N_PROTEIN);
  const fat = nutrientValue(fn, N_FAT);
  const carbs = nutrientValue(fn, N_CARBS);
  let calories = nutrientValue(fn, N_ENERGY_KCAL);

  if (protein == null || fat == null || carbs == null) return null;
  if (protein === 0 && fat === 0 && carbs === 0 && (!calories || calories === 0)) return null;
  if ([protein, fat, carbs].some((v) => v < 0 || v > 100)) return null;
  if (calories == null || calories <= 0) calories = protein * 4 + carbs * 4 + fat * 9;
  if (calories > 950) return null;

  // Title-case the English description; prefer ES staple name when known.
  const titled = description.replace(/\b\w/g, (c) => c.toUpperCase());
  const name = (NAME_ES.get(lower) ?? titled).slice(0, 120);

  return {
    workspace_id: null,
    is_base_library: true,
    name,
    brand: null, // FDC Foundation/SR foods are generic, unbranded.
    serving_label: "100 g", // FDC nutrients are per 100 g.
    category: mapCategory(description),
    protein_g: round(protein),
    carbs_g: round(carbs),
    fat_g: round(fat),
    calories: Math.round(calories),
    image_url: null, // FDC ships no photos → on-brand placeholder.
    verified: true, // lab-grade reference data.
  };
}

function identityKey(row) {
  return `${row.name.toLowerCase()}|${(row.brand ?? "").toLowerCase()}|${(row.serving_label ?? "").toLowerCase()}`;
}

async function loadFromFile(file, limit) {
  const raw = JSON.parse(await readFile(file, "utf8"));
  // FDC bulk files wrap foods under FoundationFoods / SRLegacyFoods; also accept a
  // bare array or { foods: [] }.
  const foods =
    raw.FoundationFoods ?? raw.SRLegacyFoods ?? raw.foods ?? (Array.isArray(raw) ? raw : []);
  return foods.slice(0, limit);
}

async function loadFromApi(limit) {
  const apiKey = process.env.FDC_API_KEY || process.env.USDA_FDC_API_KEY || "DEMO_KEY";
  const pageSize = Math.min(200, limit); // FDC max pageSize is 200.
  const out = [];
  for (let page = 1; out.length < limit; page += 1) {
    const url = `${FDC_SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: "*",
        dataType: DATA_TYPES,
        pageSize,
        pageNumber: page,
        sortBy: "dataType.keyword",
      }),
    });
    if (!response.ok) {
      throw new Error(`FDC search page ${page}: ${response.status} ${response.statusText} (¿FDC_API_KEY válida?)`);
    }
    const json = await response.json();
    const foods = Array.isArray(json.foods) ? json.foods : [];
    if (!foods.length) break;
    out.push(...foods);
    if (foods.length < pageSize) break;
  }
  return out.slice(0, limit);
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || serviceRoleKey.includes("PEGAR_")) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const { apply, file, limit } = readArgs();
  await loadEnvFile();

  const rawFoods = file ? await loadFromFile(file, limit) : await loadFromApi(limit);

  const seen = new Set();
  const mapped = [];
  let skipped = 0;
  for (const food of rawFoods) {
    const row = mapFood(food);
    if (!row) { skipped += 1; continue; }
    const key = identityKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push(row);
  }

  const byCategory = mapped.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    source: file ? `file:${file}` : FDC_SEARCH_URL,
    dataTypes: DATA_TYPES,
    license: SOURCE_LICENSE,
    fetched: rawFoods.length,
    mappedUsable: mapped.length,
    skipped,
    byCategory,
    sample: mapped.slice(0, 5).map((row) => ({
      name: row.name,
      category: row.category,
      per100g: `${row.calories} kcal · ${row.protein_g}P / ${row.carbs_g}C / ${row.fat_g}G`,
    })),
  }, null, 2));

  if (!apply) {
    console.log("\nDry-run completo. Ejecuta con --apply para escribir en Supabase (lo hace el fundador con red/API key).");
    return;
  }

  const supabase = createSupabase();
  const { data: existingRows, error: existingError } = await supabase
    .from("food_library_items")
    .select("name,brand,serving_label")
    .is("workspace_id", null);
  if (existingError) throw new Error(`No se pudo leer la base existente: ${existingError.message}`);
  const existing = new Set((existingRows ?? []).map((r) => `${String(r.name).toLowerCase()}|${String(r.brand ?? "").toLowerCase()}|${String(r.serving_label ?? "").toLowerCase()}`));

  const fresh = mapped.filter((row) => !existing.has(identityKey(row)));
  console.log(`\nNuevos a insertar: ${fresh.length} (ya existían ${mapped.length - fresh.length}).`);

  const chunkSize = 100;
  let inserted = 0;
  for (let index = 0; index < fresh.length; index += chunkSize) {
    const chunk = fresh.slice(index, index + chunkSize);
    const { error } = await supabase.from("food_library_items").insert(chunk);
    if (error) throw new Error(`Error insertando bloque ${index}-${index + chunk.length}: ${error.message}`);
    inserted += chunk.length;
    console.log(`Insertados ${inserted}/${fresh.length}`);
  }
  console.log(`\nListo. ${inserted} alimentos USDA añadidos a la biblioteca base.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
