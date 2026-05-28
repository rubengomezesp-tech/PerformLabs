import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const DATASET_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const SOURCE_DATASET = "free-exercise-db";
const SOURCE_LICENSE = "Unlicense";

function readArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));

  return {
    apply: args.has("--apply"),
    limit: limitArg ? Number(limitArg.split("=")[1]) : null,
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
    // .env.local is optional; deployed/CI runs can pass env vars directly.
  }
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function locationsFor(exercise) {
  const equipment = String(exercise.equipment ?? "").toLowerCase();
  if (!equipment || equipment === "body only" || equipment.includes("bands")) {
    return ["home", "gym"];
  }

  if (["barbell", "cable", "machine", "e-z curl bar"].some((item) => equipment.includes(item))) {
    return ["gym"];
  }

  return ["home", "gym"];
}

function mapExercise(exercise) {
  const id = String(exercise.id || slugify(exercise.name));
  const imageUrls = asArray(exercise.images).map((imagePath) => `${IMAGE_BASE_URL}${imagePath}`);
  const instructions = asArray(exercise.instructions).join("\n");

  return {
    workspace_id: null,
    name: String(exercise.name),
    slug: slugify(String(exercise.name)),
    muscle_groups: asArray(exercise.primaryMuscles),
    secondary_muscle_groups: asArray(exercise.secondaryMuscles),
    equipment: asArray(exercise.equipment),
    locations: locationsFor(exercise),
    difficulty: exercise.level ? String(exercise.level) : null,
    instructions: instructions || null,
    default_video_url: null,
    is_base_library: true,
    source_dataset: SOURCE_DATASET,
    source_id: id,
    source_license: SOURCE_LICENSE,
    source_url: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${id}.json`,
    image_urls: imageUrls,
    force_type: exercise.force ? String(exercise.force) : null,
    mechanic: exercise.mechanic ? String(exercise.mechanic) : null,
    movement_category: exercise.category ? String(exercise.category) : null,
  };
}

async function main() {
  const { apply, limit } = readArgs();
  await loadEnvFile();

  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`No se pudo descargar Free Exercise DB: ${response.status} ${response.statusText}`);
  }

  const rawExercises = await response.json();
  const mapped = rawExercises
    .filter((exercise) => exercise?.name)
    .slice(0, limit ?? rawExercises.length)
    .map(mapExercise);

  const muscles = new Set(mapped.flatMap((exercise) => [...exercise.muscle_groups, ...exercise.secondary_muscle_groups]));
  const equipment = new Set(mapped.flatMap((exercise) => exercise.equipment));

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    source: DATASET_URL,
    license: SOURCE_LICENSE,
    exercises: mapped.length,
    muscles: muscles.size,
    equipment: equipment.size,
    sample: mapped.slice(0, 3).map((exercise) => ({
      name: exercise.name,
      muscles: exercise.muscle_groups,
      equipment: exercise.equipment,
      images: exercise.image_urls.length,
    })),
  }, null, 2));

  if (!apply) {
    console.log("Dry-run completo. Ejecuta con --apply para escribir en Supabase.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const chunkSize = 100;
  let imported = 0;
  for (let index = 0; index < mapped.length; index += chunkSize) {
    const chunk = mapped.slice(index, index + chunkSize);
    const { error } = await supabase
      .from("exercises")
      .upsert(chunk, { onConflict: "source_dataset,source_id" });

    if (error) {
      throw new Error(`Error importando bloque ${index}-${index + chunk.length}: ${error.message}`);
    }

    imported += chunk.length;
    console.log(`Importados ${imported}/${mapped.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
