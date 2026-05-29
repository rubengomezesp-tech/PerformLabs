import Anthropic from "@anthropic-ai/sdk";

/** Latest Opus. Swap to "claude-haiku-4-5" if you prefer lower cost/latency. */
const MODEL = "claude-opus-4-8";

export type MealMacros = {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
};

const SYSTEM = `Eres un nutricionista que estima los macronutrientes de una comida descrita en lenguaje natural (normalmente en español).
Reglas:
- Estima por la cantidad TOTAL descrita. Si no se indican cantidades, asume una ración estándar para una persona.
- Devuelve gramos de proteína, grasa y carbohidratos, y las calorías totales en kcal.
- Sé realista y consistente con tablas nutricionales habituales. Redondea a enteros.
- Da un nombre corto y limpio de la comida (sin cantidades).
- No añadas explicaciones: usa la herramienta para devolver los datos.`;

/**
 * Estimates macros for a free-text meal description using Claude.
 * Server-side only — relies on ANTHROPIC_API_KEY (set in the deploy env).
 */
export async function analyzeMealText(description: string): Promise<MealMacros> {
  const text = description.trim();
  if (!text) {
    throw new Error("Describe tu comida para poder estimarla.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("La estimación con IA no está configurada todavía.");
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [
      {
        name: "log_macros",
        description: "Registra los macros estimados de la comida descrita.",
        input_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre corto y normalizado de la comida (sin cantidades)" },
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
    messages: [{ role: "user", content: `Estima los macros de: ${text}` }],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No se pudo estimar la comida. Inténtalo con otra descripción.");
  }

  const input = toolUse.input as Record<string, unknown>;
  const toNumber = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  };
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : text.slice(0, 80);

  return {
    name,
    protein: toNumber(input.protein),
    fat: toNumber(input.fat),
    carbs: toNumber(input.carbs),
    calories: toNumber(input.calories),
  };
}
