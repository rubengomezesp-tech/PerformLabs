/**
 * AI nutrition agent — generates a structured, macro-costed recipe from a
 * natural-language prompt. Uses the Anthropic Messages API over fetch (no SDK
 * dependency) and degrades gracefully when ANTHROPIC_API_KEY is absent, so the
 * feature ships dark and lights up the moment a key is configured.
 */
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";

export type AiRecipeIngredient = {
  name: string;
  grams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type AiRecipeDraft = {
  name: string;
  mealSlot: string;
  instructions: string;
  tags: string[];
  ingredients: AiRecipeIngredient[];
};

export type AiRecipeResult =
  | { ok: true; recipe: AiRecipeDraft }
  | { ok: false; error: string; notConfigured?: boolean };

export function isNutritionAgentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `Eres un nutricionista deportivo que diseña recetas para una app de coaching.
Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto antes ni después, sin markdown) con esta forma:
{
  "name": string,                     // nombre de la receta en español
  "mealSlot": "breakfast"|"lunch"|"dinner"|"snack",
  "instructions": string,             // pasos claros y breves
  "tags": string[],                   // p.ej. ["alto en proteina","sin gluten"]
  "ingredients": [                    // 2 a 10 ingredientes
    {
      "name": string,                 // ingrediente en español
      "grams": number,                // cantidad para la receta
      "caloriesPer100g": number,
      "proteinPer100g": number,
      "carbsPer100g": number,
      "fatPer100g": number
    }
  ]
}
Usa valores nutricionales realistas por 100g. No incluyas comentarios ni campos extra.`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("La IA no devolvió una receta válida.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeRecipe(raw: unknown): AiRecipeDraft {
  const record = (raw ?? {}) as Record<string, unknown>;
  const slots = ["breakfast", "lunch", "dinner", "snack"];
  const slot = typeof record.mealSlot === "string" && slots.includes(record.mealSlot) ? record.mealSlot : "lunch";
  const ingredientsRaw = Array.isArray(record.ingredients) ? record.ingredients : [];
  const ingredients = ingredientsRaw
    .map((item) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      return {
        name: String(entry.name ?? "").trim(),
        grams: toNumber(entry.grams),
        caloriesPer100g: toNumber(entry.caloriesPer100g),
        proteinPer100g: toNumber(entry.proteinPer100g),
        carbsPer100g: toNumber(entry.carbsPer100g),
        fatPer100g: toNumber(entry.fatPer100g),
      };
    })
    .filter((entry) => entry.name.length > 0)
    .slice(0, 10);

  if (!ingredients.length) {
    throw new Error("La receta generada no tiene ingredientes.");
  }

  return {
    name: String(record.name ?? "Receta sin nombre").trim().slice(0, 120),
    mealSlot: slot,
    instructions: String(record.instructions ?? "").trim().slice(0, 4000),
    tags: Array.isArray(record.tags) ? record.tags.map(String).slice(0, 8) : [],
    ingredients,
  };
}

export function recipeMacros(recipe: AiRecipeDraft) {
  return recipe.ingredients.reduce(
    (totals, item) => {
      const ratio = item.grams / 100;
      totals.calories += item.caloriesPer100g * ratio;
      totals.protein += item.proteinPer100g * ratio;
      totals.carbs += item.carbsPer100g * ratio;
      totals.fat += item.fatPer100g * ratio;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export async function generateRecipeDraft(prompt: string): Promise<AiRecipeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, notConfigured: true, error: "Configura ANTHROPIC_API_KEY para activar el agente de IA." };
  }
  const cleaned = prompt.trim();
  if (!cleaned) {
    return { ok: false, error: "Escribe qué receta quieres crear." };
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
        max_tokens: 1400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: cleaned }],
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `El agente de IA no está disponible (${response.status}).` };
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = data.content?.map((block) => block.text ?? "").join("") ?? "";
    return { ok: true, recipe: normalizeRecipe(extractJson(text)) };
  } catch {
    return { ok: false, error: "No se pudo contactar con el agente de IA." };
  }
}
