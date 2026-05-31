#!/usr/bin/env node
/**
 * Seed the base recipe library from scripts/data/base-recipes.json:
 *  1. Generate a consistent product photo per recipe → public/seed/recipes/<slug>.webp
 *     (resumable: skips existing files). Needs GEMINI_API_KEY.
 *  2. Emit idempotent SQL → scripts/data/base-recipes.sql (recipes + recipe_ingredients),
 *     which is applied to the DB via the Supabase MCP / migration runner.
 *
 *   GEMINI_API_KEY=... node scripts/seed-base-recipes.mjs          # images + sql
 *   SKIP_IMAGES=1 node scripts/seed-base-recipes.mjs               # sql only
 */
import fs from "node:fs";
import sharp from "sharp";

const OUT = "public/seed/recipes";
const DATA = "scripts/data/base-recipes.json";
const SQL_OUT = "scripts/data/base-recipes.sql";
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
fs.mkdirSync(OUT, { recursive: true });

// Base-library ingredient slug → id (workspace_id null, is_base_library true).
const ING = {
  "aceite-de-oliva": "4fa04a7c-ffb6-4cc3-9c1c-3a1b29281dcf",
  "aguacate": "ea4842ec-38a2-4531-bb38-018f2eed0bf0",
  "almendras": "fd11671f-22bc-45a8-8697-e0bf3b5b7093",
  "arroz-blanco-cocido": "6745a27a-2c60-4314-8c56-712abd9bfd60",
  "arroz-integral-cocido": "7e03ffe5-5589-4ce7-ab14-91c1ffaa5e79",
  "atun-al-natural": "e427ef42-ad2d-4395-8315-084b6ce7ae08",
  "avena": "3b54e405-bf20-44b2-8e97-738f195054e1",
  "boniato": "1076388d-55f2-48bf-85ef-b2a7a03d6445",
  "brocoli": "e365c48b-da61-487f-8f74-01c5258bdc70",
  "calabacin": "d7704f4b-0a9f-429a-9397-29ea0b7bc454",
  "clara-de-huevo": "8b3f229d-e11d-48fd-89a8-2a4d746e1884",
  "espinacas": "2793eb50-e358-4a37-8969-dba8c6e8e21e",
  "frutos-rojos": "f62ca310-785e-4da4-b424-8e87ad271fa2",
  "gambas": "a5502e6a-5717-462d-ad7a-890c8761498d",
  "garbanzos-cocidos": "de15e0e0-4888-4f56-8571-bf92ca43662b",
  "huevo-entero": "18025ed0-2bfe-45a8-8c91-a1dccbbc33ae",
  "leche-desnatada": "1fa28324-b212-4b00-a1a3-6742c189deea",
  "lechuga": "f60715dc-528d-47d6-95dd-450ad335141e",
  "lentejas-cocidas": "5f743dc9-5812-4839-9156-2d94545836ee",
  "mantequilla-de-cacahuete": "18ff2b77-f6cd-45a0-840f-3d02300eb193",
  "manzana": "d7ea11d3-ee5c-497d-87fb-2469d53e4ce1",
  "merluza": "e4cd63e9-2582-4685-9bc4-5cd48ae55518",
  "miel": "24ab2cb6-5514-472f-9208-d617eb1be50f",
  "naranja": "55a12fc4-0f84-415e-810e-4117a64efe7e",
  "nueces": "c693e325-813e-4a90-8676-56db325bcfe5",
  "pan-integral": "202eab4b-815f-4e1f-8e19-965585a52c90",
  "pasta-cocida": "d31283b6-e7e2-4649-a147-5e7c1641d694",
  "patata-cocida": "856698e3-288d-4f1b-a400-8fdcd973193b",
  "pavo-pechuga": "b538df25-7cc8-4f0f-8390-a7068319d0d7",
  "pechuga-de-pollo": "7c6c7976-94b6-48be-991d-8642d90a607b",
  "pimiento": "2964eca5-61b9-4ecd-b4b7-e0c249d0e00a",
  "platano": "73ed6e4f-9b46-48ef-ab47-a0db0383e9d9",
  "proteina-whey-polvo": "65efe8fe-e189-4a35-a8a9-73c6e23912d0",
  "queso-fresco-batido-0": "68f91f2f-c812-4fcb-b19b-c2393e1e5a5d",
  "quinoa-cocida": "2ed7dd11-98a1-4fa2-a3e8-079f333cd9c9",
  "requeson": "45bf2f7d-69d3-4906-b58e-69549d35ce88",
  "salmon": "0ffd7104-3182-4f3e-a7a5-e17b8ee369f6",
  "ternera-magra": "91278547-cd5b-4fb4-9e63-5560500b2b07",
  "tomate": "fc43b65c-b6be-4542-8947-38d6d7c2867d",
  "yogur-griego-natural": "b7094abe-889c-4872-995d-ee577619bcaf",
};

const recipes = JSON.parse(fs.readFileSync(DATA, "utf8"));

// Validate every ingredient slug exists before doing anything.
for (const r of recipes) {
  for (const i of r.ingredients) {
    if (!ING[i.slug]) throw new Error(`Unknown ingredient slug "${i.slug}" in recipe "${r.slug}"`);
  }
}

async function genImage(r) {
  const out = `${OUT}/${r.slug}.webp`;
  if (fs.existsSync(out)) { console.log(`skip ${r.slug}`); return "skip"; }
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: r.image_prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
  } catch (e) { console.warn(`net ${r.slug}: ${e.message}`); return "err"; }
  const j = await res.json();
  if (j.error) { console.warn(`ERR ${r.slug}: ${j.error.status} ${String(j.error.message).slice(0, 90)}`); return "err"; }
  const img = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!img) { console.warn(`no-image ${r.slug}`); return "err"; }
  await sharp(Buffer.from(img.inlineData.data, "base64")).resize(800, 800, { fit: "cover" }).webp({ quality: 82 }).toFile(out);
  console.log(`OK ${r.slug} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
  return "ok";
}

const esc = (s) => String(s).replace(/'/g, "''");
const arr = (a) => `ARRAY[${a.map((t) => `'${esc(t)}'`).join(",")}]::text[]`;

function emitSql() {
  const rv = recipes
    .map((r) => `  ('${esc(r.name)}','${r.slug}','${r.meal_slot}','${esc(r.instructions)}',${arr(r.tags)},'/seed/recipes/${r.slug}.webp')`)
    .join(",\n");
  const riv = recipes
    .flatMap((r) => r.ingredients.map((i, idx) => `  ('${r.slug}','${i.slug}',${Number(i.grams)},${idx})`))
    .join(",\n");
  const sql = `-- Base recipe library seed (idempotent). Generated by scripts/seed-base-recipes.mjs.
with v(name,slug,meal_slot,instructions,tags,image_url) as (values
${rv}
)
insert into public.recipes (name,slug,meal_slot,instructions,tags,image_url,is_base_library,workspace_id)
select v.name,v.slug,v.meal_slot,v.instructions,v.tags,v.image_url,true,null
from v
where not exists (select 1 from public.recipes r where r.slug = v.slug);

with ri(recipe_slug,ingredient_slug,grams,sort_order) as (values
${riv}
)
insert into public.recipe_ingredients (recipe_id,ingredient_id,grams,sort_order)
select r.id, i.id, ri.grams, ri.sort_order
from ri
join public.recipes r on r.slug = ri.recipe_slug
join public.ingredients i on i.slug = ri.ingredient_slug
where not exists (
  select 1 from public.recipe_ingredients x where x.recipe_id = r.id and x.ingredient_id = i.id
);
`;
  fs.writeFileSync(SQL_OUT, sql);
  console.log(`wrote ${SQL_OUT} (${recipes.length} recipes, ${recipes.reduce((n, r) => n + r.ingredients.length, 0)} ingredient links)`);
}

let ok = 0, err = 0, skip = 0;
if (process.env.GEMINI_API_KEY && !process.env.SKIP_IMAGES) {
  for (const r of recipes) {
    const res = await genImage(r);
    if (res === "ok") ok++; else if (res === "skip") skip++; else err++;
  }
  console.log(`images: ok=${ok} skip=${skip} err=${err}`);
}
emitSql();
