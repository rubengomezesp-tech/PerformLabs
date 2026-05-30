import Anthropic from "@anthropic-ai/sdk";
import type { AiTokenUsage } from "@/lib/ai/usage";
import type { MealMacros } from "@/lib/ai/smart-add";

/** Vision-capable + cost-aware. Sonnet handles food estimation well at ~3x less than Opus. */
const MODEL = process.env.VISION_NUTRITION_MODEL ?? "claude-sonnet-4-6";

export type VisionMealResult =
  | { ok: true; macros: MealMacros; usage: AiTokenUsage; model: string }
  | { ok: false; error: string; notConfigured?: boolean };

export function isVisionNutritionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `Eres un nutricionista que estima los macronutrientes de una comida a partir de una FOTO.
Reglas:
- Identifica los alimentos del plato y estima la cantidad total visible.
- Devuelve gramos de proteína, grasa y carbohidratos, y las calorías totales en kcal.
- Sé realista; ante duda, estima a la baja de forma sensata. Redondea a enteros.
- Da un nombre corto y claro del plato (sin cantidades).
- Usa SIEMPRE la herramienta para devolver los datos.`;

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function analyzeMealPhoto(base64: string, mediaType: string): Promise<VisionMealResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, notConfigured: true, error: "El análisis por foto aún no está activo." };
  }
  if (!base64) return { ok: false, error: "No se recibió la imagen." };
  const media = ALLOWED_MEDIA.has(mediaType) ? mediaType : "image/jpeg";

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [
        {
          name: "log_macros",
          description: "Registra los macros estimados de la comida de la foto.",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nombre corto del plato (sin cantidades)" },
              protein: { type: "number", description: "Proteína total en gramos" },
              fat: { type: "number", description: "Grasa total en gramos" },
              carbs: { type: "number", description: "Carbohidratos totales en gramos" },
              calories: { type: "number", description: "Calorías totales en kcal" },
            },
            required: ["name", "protein", "fat", "carbs", "calories"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "log_macros" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media as "image/jpeg", data: base64 } },
            { type: "text", text: "Estima los macros de esta comida a partir de la foto." },
          ],
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { ok: false, error: "No se pudo estimar la comida. Prueba con otra foto." };
    }
    const input = toolUse.input as Record<string, unknown>;
    const toNumber = (value: unknown) => {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
    };
    const name = typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : "Comida";

    return {
      ok: true,
      macros: {
        name,
        protein: toNumber(input.protein),
        fat: toNumber(input.fat),
        carbs: toNumber(input.carbs),
        calories: toNumber(input.calories),
      },
      usage: (message.usage ?? {}) as AiTokenUsage,
      model: MODEL,
    };
  } catch {
    return { ok: false, error: "No se pudo analizar la foto ahora mismo. Inténtalo de nuevo." };
  }
}
