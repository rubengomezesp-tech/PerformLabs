#!/usr/bin/env node
/**
 * import-open-food-facts.mjs — grow the shared base food library from Open Food Facts.
 *
 * Fetches Spanish products (countries_tags_en=spain) that have COMPLETE macros from
 * the OFF v2 search API, maps them to public.food_library_items as base-library rows
 * (workspace_id = null, is_base_library = true), so every white-label brand inherits
 * them via listFoodLibrary's `.or(workspace_id.eq.X,workspace_id.is.null)` merge.
 *
 * Mirrors scripts/import-free-exercise-db.mjs (fetch → chunked write, loads .env.local)
 * and scripts/seed-nutrition-library.mjs (SELECT-then-insert idempotency, no onConflict
 * needed). SAFE BY DEFAULT: prints a dry-run report and writes nothing. The FOUNDER
 * runs --apply on a networked machine (the container has no outbound network).
 *
 *   node scripts/import-open-food-facts.mjs                       # dry-run, 200 products
 *   node scripts/import-open-food-facts.mjs --limit=500           # dry-run, up to 500
 *   node scripts/import-open-food-facts.mjs --limit=500 --apply   # write to Supabase
 *   node scripts/import-open-food-facts.mjs --pages=10 --apply    # 10 pages (×page_size)
 *
 * Data: Open Food Facts, licensed under the Open Database License (ODbL). Product
 * photos are CC-BY-SA; we only store the OFF image URL (hotlink), most imported rows
 * have no photo and fall back to the on-brand placeholder (MyFitnessPal-style).
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search";
const COUNTRY = "spain";
const PAGE_SIZE = 100; // OFF v2 max is 100
const SOURCE_LICENSE = "ODbL (Open Food Facts)";
// OFF asks API clients to identify themselves with a descriptive User-Agent.
const USER_AGENT = "PerformLabs/1.0 (base-food-library import; rubengomezesp@gmail.com)";

const FIELDS = [
  "code",
  "product_name",
  "product_name_es",
  "brands",
  "nutriments",
  "categories_tags",
  "image_small_url",
  "serving_size",
  "countries_tags",
].join(",");

function readArgs() {
  const argv = process.argv.slice(2);
  const num = (prefix, fallback) => {
    const arg = argv.find((a) => a.startsWith(prefix));
    if (!arg) return fallback;
    const value = Number(arg.split("=")[1]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  return {
    apply: argv.includes("--apply"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    limit: num("--limit=", 200),
    pages: num("--pages=", null),
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
    // .env.local is optional; networked/CI runs can pass env vars directly.
  }
}

// ───────────────────────────────────────── mapping ──────────────────────────
// OFF categories_tags are an ordered hierarchy of "en:" leaves. We match the most
// specific known tokens first and fall back to "other". Tokens are substrings so
// "en:chicken-breasts" still hits "chicken". Order matters: protein/fat/dairy before
// the broad plant tokens, since many products carry several tags.
const CATEGORY_RULES = [
  ["dairy", ["milk", "yogurt", "yoghurt", "cheese", "dairy", "fromage", "queso", "leche", "kefir", "cottage", "curd"]],
  ["protein", ["meat", "poultry", "chicken", "turkey", "beef", "pork", "fish", "seafood", "salmon", "tuna", "egg", "tofu", "seitan", "tempeh", "legume", "lentil", "chickpea", "bean", "ham", "sausage", "protein"]],
  ["fat", ["oil", "olive-oil", "butter", "margarine", "nut", "almond", "walnut", "peanut", "seeds", "avocado", "mayonnaise", "lard"]],
  ["fruit", ["fruit", "berries", "apple", "banana", "orange", "citrus", "grape", "melon", "pineapple"]],
  ["veg", ["vegetable", "legume-vegetable", "salad", "tomato", "spinach", "broccoli", "carrot", "pepper", "onion", "potato", "mushroom"]],
  ["drink", ["beverage", "drink", "water", "juice", "soda", "sodas", "tea", "coffee", "wine", "beer", "milk-substitute", "plant-based-beverage"]],
  ["snack", ["snack", "biscuit", "cookie", "chocolate", "candy", "sweet", "chips", "crisps", "cake", "pastr", "cereal-bar", "ice-cream", "dessert", "confectioner"]],
  ["carb", ["cereal", "bread", "pasta", "rice", "flour", "noodle", "grain", "oat", "breakfast-cereal", "couscous", "quinoa", "tortilla", "crackers"]],
];

function mapCategory(categoriesTags) {
  const tags = (Array.isArray(categoriesTags) ? categoriesTags : []).map((t) => String(t).toLowerCase());
  if (!tags.length) return "other";
  for (const [category, tokens] of CATEGORY_RULES) {
    if (tags.some((tag) => tokens.some((token) => tag.includes(token)))) return category;
  }
  return "other";
}

function num(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function cleanText(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// Returns a mapped row, or null when the product is unusable (missing name or macros).
function mapProduct(product) {
  const name = cleanText(product.product_name_es || product.product_name, 120);
  if (!name || name.length < 2) return null;

  const n = product.nutriments ?? {};
  const protein = num(n["proteins_100g"]);
  const carbs = num(n["carbohydrates_100g"]);
  const fat = num(n["fat_100g"]);
  let calories = num(n["energy-kcal_100g"]);

  // Require the 3 macros; OFF often omits one when a product is incomplete.
  if (protein == null || carbs == null || fat == null) return null;
  // Skip zero/garbage rows (e.g. all-zero macros AND no calories → not real food data).
  if (protein === 0 && carbs === 0 && fat === 0 && (!calories || calories === 0)) return null;
  // Sanity bounds per 100 g — drop obviously broken values.
  if (protein > 100 || carbs > 100 || fat > 100 || protein < 0 || carbs < 0 || fat < 0) return null;

  // Derive kcal from macros when OFF didn't supply energy-kcal.
  if (calories == null || calories <= 0) calories = protein * 4 + carbs * 4 + fat * 9;
  if (calories > 950) return null; // > pure fat per 100 g ⇒ bad data.

  const brand = cleanText((product.brands ?? "").split(",")[0], 80) || null;
  const serving = cleanText(product.serving_size, 40);
  const imageUrl = typeof product.image_small_url === "string" && product.image_small_url.startsWith("http")
    ? product.image_small_url
    : null;

  return {
    workspace_id: null,
    is_base_library: true,
    name,
    brand,
    serving_label: "100 g", // OFF macros are per 100 g; serving_size is free-text/unreliable.
    serving_note: serving || null, // kept for the dry-run report only, not written.
    category: mapCategory(product.categories_tags),
    protein_g: round(protein),
    carbs_g: round(carbs),
    fat_g: round(fat),
    calories: Math.round(calories),
    image_url: imageUrl,
    verified: false, // crowd-sourced; coaches/platform can verify later.
    code: product.code ? String(product.code) : null, // for de-dupe/report only.
  };
}

// Drop the report-only fields before writing.
function toRow({ serving_note, code, ...row }) {
  return row;
}

// In-memory de-dupe key — mirrors the DB partial-unique key
// lower(name)+lower(brand)+lower(serving_label). OFF rows are all "100 g".
function identityKey(row) {
  return `${row.name.toLowerCase()}|${(row.brand ?? "").toLowerCase()}|${(row.serving_label ?? "").toLowerCase()}`;
}

async function fetchPage(page) {
  const url = `${OFF_SEARCH_URL}?countries_tags_en=${COUNTRY}&states_tags_en=nutrition-facts-completed&fields=${encodeURIComponent(FIELDS)}&page_size=${PAGE_SIZE}&page=${page}&sort_by=unique_scans_n`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`OFF search page ${page}: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return Array.isArray(json.products) ? json.products : [];
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
  const { apply, limit, pages } = readArgs();
  await loadEnvFile();

  const maxPages = pages ?? Math.ceil(limit / PAGE_SIZE);
  const seen = new Set();
  const mapped = [];
  let fetched = 0;
  let skipped = 0;

  for (let page = 1; page <= maxPages && mapped.length < limit; page += 1) {
    const products = await fetchPage(page);
    if (!products.length) break;
    fetched += products.length;
    for (const product of products) {
      const row = mapProduct(product);
      if (!row) { skipped += 1; continue; }
      const key = identityKey(row);
      if (seen.has(key)) continue; // de-dupe within this run.
      seen.add(key);
      mapped.push(row);
      if (mapped.length >= limit) break;
    }
  }

  const byCategory = mapped.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});
  const withImages = mapped.filter((row) => row.image_url).length;

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    source: OFF_SEARCH_URL,
    country: COUNTRY,
    license: SOURCE_LICENSE,
    fetched,
    mappedUsable: mapped.length,
    skippedNoMacros: skipped,
    withImages,
    byCategory,
    sample: mapped.slice(0, 5).map((row) => ({
      name: row.name,
      brand: row.brand,
      category: row.category,
      per100g: `${row.calories} kcal · ${row.protein_g}P / ${row.carbs_g}C / ${row.fat_g}G`,
      image: row.image_url ? "yes" : "placeholder",
      offServing: row.serving_note ?? "",
    })),
  }, null, 2));

  if (!apply) {
    console.log("\nDry-run completo. Ejecuta con --apply para escribir en Supabase (lo hace el fundador con red).");
    return;
  }

  const supabase = createSupabase();

  // Idempotent: skip base rows that already exist (lower(name)+lower(brand)).
  // Mirrors seed-nutrition-library.mjs — no onConflict needed, survives re-runs.
  const { data: existingRows, error: existingError } = await supabase
    .from("food_library_items")
    .select("name,brand,serving_label")
    .is("workspace_id", null);
  if (existingError) throw new Error(`No se pudo leer la base existente: ${existingError.message}`);
  const existing = new Set((existingRows ?? []).map((r) => `${String(r.name).toLowerCase()}|${String(r.brand ?? "").toLowerCase()}|${String(r.serving_label ?? "").toLowerCase()}`));

  const fresh = mapped.filter((row) => !existing.has(identityKey(row))).map(toRow);
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
  console.log(`\nListo. ${inserted} alimentos OFF añadidos a la biblioteca base.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
