#!/usr/bin/env node
/**
 * Platform media: generate accurate, consistent product photos for recipes and
 * food-library items that have no curated image, store them in Supabase Storage,
 * and write the public URL back to `image_url`.
 *
 * This is the platform-default tier of the media system. Coaches can still override
 * with their own image URL (white-label); rows with an image are skipped.
 *
 * Usage:
 *   GEMINI_API_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/generate-product-images.mjs --type all --limit 50
 *
 * Flags:
 *   --type recipes|foods|all   What to generate for (default: all)
 *   --limit N                   Max rows to process per type (default: 25)
 *   --workspace <uuid>          Restrict to one workspace (optional)
 *   --dry-run                   Build prompts and report, but don't call the API
 *
 * Env:
 *   GEMINI_API_KEY              Google AI Studio key (Gemini image model)
 *   GEMINI_IMAGE_MODEL          Override model (default: gemini-2.5-flash-image)
 *   NEXT_PUBLIC_SUPABASE_URL    Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   Service role key (server-only)
 *   MEDIA_BUCKET                Storage bucket (default: product-media)
 */

import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.MEDIA_BUCKET || "product-media";
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

function parseArgs(argv) {
  const args = { type: "all", limit: 25, workspace: "", dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--type") args.type = argv[++i];
    else if (arg === "--limit") args.limit = Number(argv[++i]) || 25;
    else if (arg === "--workspace") args.workspace = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
  }
  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env ${name}. See the header of this script for required vars.`);
    process.exit(1);
  }
  return value;
}

/** Consistent, on-brand prompt so the whole catalogue looks like one photo set. */
function promptFor(kind, name) {
  const subject =
    kind === "recipe"
      ? `the prepared dish "${name}", plated and ready to eat`
      : `the single food product "${name}"`;
  return [
    `Professional food photography of ${subject}.`,
    "Fitness/nutrition app catalogue style: clean, appetizing, true to the real food,",
    "soft natural light, shallow depth of field, neutral dark background, slight steam/freshness,",
    "centred square composition, high detail, photorealistic. No text, no logos, no watermark, no hands.",
  ].join(" ");
}

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
  });
  if (error && !/exist/i.test(error.message)) {
    throw new Error(`Could not ensure bucket ${BUCKET}: ${error.message}`);
  }
}

async function generateImage(ai, prompt) {
  const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        buffer: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }
  throw new Error("No image returned by the model");
}

async function processTable(supabase, ai, { table, kind, limit, workspace, dryRun }) {
  let query = supabase
    .from(table)
    .select("id,name,image_url,workspace_id")
    .or("image_url.is.null,image_url.eq.")
    .limit(limit);
  if (workspace) query = query.eq("workspace_id", workspace);

  const { data, error } = await query;
  if (error) throw new Error(`Query ${table} failed: ${error.message}`);
  if (!data?.length) {
    console.log(`· ${table}: nothing to do (all rows have images)`);
    return { done: 0, failed: 0 };
  }

  let done = 0;
  let failed = 0;
  for (const row of data) {
    const prompt = promptFor(kind, row.name);
    if (dryRun) {
      console.log(`  [dry-run] ${table}/${row.id} ← ${row.name}`);
      done += 1;
      continue;
    }
    try {
      const { buffer, mimeType } = await generateImage(ai, prompt);
      const ext = mimeType.includes("jpeg") ? "jpg" : "png";
      const path = `${table}/${row.id}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const upd = await supabase.from(table).update({ image_url: publicUrl }).eq("id", row.id);
      if (upd.error) throw new Error(upd.error.message);
      console.log(`  ✓ ${table}/${row.id} ← ${row.name}`);
      done += 1;
    } catch (err) {
      console.warn(`  ✗ ${table}/${row.id} (${row.name}): ${err.message}`);
      failed += 1;
    }
  }
  return { done, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let ai = null;
  if (!args.dryRun) {
    const apiKey = requireEnv("GEMINI_API_KEY");
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({ apiKey });
    await ensureBucket(supabase);
  }

  const targets = [];
  if (args.type === "recipes" || args.type === "all") targets.push({ table: "recipes", kind: "recipe" });
  if (args.type === "foods" || args.type === "all") targets.push({ table: "food_library_items", kind: "food" });

  console.log(`Generating product images (model=${MODEL}, bucket=${BUCKET}, dryRun=${args.dryRun})`);
  let totalDone = 0;
  let totalFailed = 0;
  for (const target of targets) {
    const { done, failed } = await processTable(supabase, ai, {
      ...target,
      limit: args.limit,
      workspace: args.workspace,
      dryRun: args.dryRun,
    });
    totalDone += done;
    totalFailed += failed;
  }
  console.log(`Done. generated=${totalDone} failed=${totalFailed}`);
  if (totalFailed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
