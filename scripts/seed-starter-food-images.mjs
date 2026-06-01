#!/usr/bin/env node
/**
 * One-off: generate consistent product photos for the built-in STARTER_FOODS
 * catalogue and write them to public/seed/foods/<slug>.webp. Resumable (skips
 * files that already exist). The repo helper derives the same /seed/foods/<slug>.webp
 * path from each food name, so no per-row wiring is needed.
 *
 *   GEMINI_API_KEY=... node scripts/seed-starter-food-images.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("Missing GEMINI_API_KEY"); process.exit(1); }
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "public/seed/foods";
fs.mkdirSync(OUT, { recursive: true });

// Keep in sync with starterFoodSlug() in lib/repositories/food-library.ts
const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const FOODS = [
  "Pechuga de pollo a la plancha", "Pechuga de pavo", "Huevo entero", "Claras de huevo",
  "Atún al natural", "Salmón", "Merluza", "Ternera magra", "Gambas", "Tofu firme",
  "Proteína whey", "Arroz blanco cocido", "Arroz integral cocido", "Pasta cocida",
  "Patata cocida", "Boniato", "Pan integral", "Avena", "Quinoa cocida", "Lentejas cocidas",
  "Garbanzos cocidos", "Aceite de oliva virgen extra", "Aguacate", "Almendras", "Nueces",
  "Mantequilla de cacahuete", "Leche desnatada", "Yogur griego natural", "Queso batido 0%",
  "Requesón", "Brócoli", "Espinacas", "Tomate", "Plátano", "Manzana", "Chocolate negro 85%",
];

const prompt = (name) =>
  `Professional product food photography of "${name}", a single realistic serving on a clean neutral surface, ` +
  `soft studio lighting, appetizing, true to the real food, neutral dark background, centred square composition, ` +
  `high detail, photorealistic. No text, no logos, no watermark, no hands.`;

async function gen(name) {
  const s = slugify(name);
  const out = `${OUT}/${s}.webp`;
  if (fs.existsSync(out)) { console.log(`skip ${s}`); return "skip"; }
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt(name) }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
  } catch (e) { console.warn(`net ${s}: ${e.message}`); return "err"; }
  const j = await res.json();
  if (j.error) { console.warn(`ERR ${s}: ${j.error.status} ${String(j.error.message).slice(0, 90)}`); return "err"; }
  const parts = j.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) { console.warn(`no-image ${s}`); return "err"; }
  await sharp(Buffer.from(img.inlineData.data, "base64")).resize(600, 600, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
  console.log(`OK ${s} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
  return "ok";
}

let ok = 0, err = 0, skip = 0;
for (const name of FOODS) {
  const r = await gen(name);
  if (r === "ok") ok++; else if (r === "skip") skip++; else err++;
}
console.log(`DONE ok=${ok} skip=${skip} err=${err} total=${FOODS.length}`);
if (err > 0) process.exitCode = 1;
