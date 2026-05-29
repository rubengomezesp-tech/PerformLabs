import Anthropic from "@anthropic-ai/sdk";
import type { CoachBrain } from "@/lib/repositories/coach-brain";

/** Persona fidelity is the moat — use the strongest model. Override via env. */
const MODEL = process.env.COACH_BRAIN_MODEL ?? "claude-opus-4-8";

export type PlanBrief = {
  goal: string;
  level: string;
  location: string;
  daysPerWeek: number;
  sessionMinutes: number;
  injuries: string;
  focusNotes: string;
};

export type GeneratedExercise = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
};

export type GeneratedDay = {
  day: number;
  title: string;
  focus: string;
  exercises: GeneratedExercise[];
};

export type GeneratedWorkoutPlan = {
  name: string;
  summary: string;
  progression: string;
  days: GeneratedDay[];
};

export type PlanResult =
  | { ok: true; plan: GeneratedWorkoutPlan }
  | { ok: false; error: string; notConfigured?: boolean };

export function isPlanGeneratorConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function brainContext(brain: CoachBrain): string {
  const bits: string[] = [];
  if (brain.persona.trim()) bits.push(`Filosofía del coach:\n${brain.persona.trim()}`);
  if (brain.tone.trim()) bits.push(`Tono:\n${brain.tone.trim()}`);
  if (brain.specialties.trim()) bits.push(`Especialidades:\n${brain.specialties.trim()}`);
  if (brain.rules.trim()) bits.push(`Reglas y protocolos OBLIGATORIOS:\n${brain.rules.trim()}`);
  if (brain.substitutions.trim()) bits.push(`Sustituciones permitidas:\n${brain.substitutions.trim()}`);
  if (brain.forbidden.trim()) bits.push(`Prohibido:\n${brain.forbidden.trim()}`);
  return bits.length ? bits.join("\n\n") : "El coach todavía no ha definido su metodología; usa principios sólidos de entrenamiento de fuerza.";
}

function toStr(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizePlan(raw: unknown, brief: PlanBrief): GeneratedWorkoutPlan {
  const record = (raw ?? {}) as Record<string, unknown>;
  const daysRaw = Array.isArray(record.days) ? record.days : [];
  const days: GeneratedDay[] = daysRaw
    .map((dayRaw, dayIndex) => {
      const day = (dayRaw ?? {}) as Record<string, unknown>;
      const exercisesRaw = Array.isArray(day.exercises) ? day.exercises : [];
      const exercises: GeneratedExercise[] = exercisesRaw
        .map((exRaw) => {
          const ex = (exRaw ?? {}) as Record<string, unknown>;
          return {
            name: toStr(ex.name).slice(0, 120),
            sets: toStr(ex.sets, "3").slice(0, 20),
            reps: toStr(ex.reps, "10").slice(0, 30),
            rest: toStr(ex.rest, "90s").slice(0, 30),
            notes: toStr(ex.notes).slice(0, 300),
          };
        })
        .filter((ex) => ex.name.length > 0)
        .slice(0, 12);
      return {
        day: dayIndex + 1,
        title: toStr(day.title, `Día ${dayIndex + 1}`).slice(0, 120),
        focus: toStr(day.focus).slice(0, 120),
        exercises,
      };
    })
    .filter((day) => day.exercises.length > 0)
    .slice(0, 7);

  if (!days.length) {
    throw new Error("La IA no devolvió ejercicios. Inténtalo de nuevo.");
  }

  return {
    name: toStr(record.name, `Plan ${brief.goal}`).slice(0, 120),
    summary: toStr(record.summary).slice(0, 2000),
    progression: toStr(record.progression).slice(0, 2000),
    days,
  };
}

export async function generateWorkoutPlanDraft(params: {
  brain: CoachBrain;
  brandName: string;
  brief: PlanBrief;
}): Promise<PlanResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, notConfigured: true, error: "Configura ANTHROPIC_API_KEY para generar planes con IA." };
  }

  const { brain, brief } = params;
  const system = `Eres el motor de planificación de "${params.brandName}". Diseñas la semana de entrenamiento de un cliente siguiendo EXACTAMENTE la metodología del coach. No eres genérico: aplicas sus reglas, sus sustituciones y su filosofía. El coach revisará y aprobará tu propuesta, así que sé concreto y fiel a su estilo.

${brainContext(brain)}

Reglas de salida:
- Diseña EXACTAMENTE ${brief.daysPerWeek} día(s) de entreno para una semana representativa.
- Respeta las reglas del coach por encima de todo. Si entran en conflicto con el brief, prioriza la seguridad y las reglas del coach.
- Evita cargar zonas lesionadas indicadas. Propón alternativas seguras.
- Usa ejercicios reales y reconocibles. Series, repeticiones y descanso realistas para el objetivo y nivel.
- Devuelve también un resumen de por qué el plan refleja la metodología del coach y cómo progresar las siguientes semanas.`;

  const userPrompt = `Crea el plan semanal para este cliente:
- Objetivo: ${brief.goal || "no especificado"}
- Nivel: ${brief.level || "no especificado"}
- Dónde entrena: ${brief.location || "no especificado"}
- Días por semana: ${brief.daysPerWeek}
- Minutos por sesión: ${brief.sessionMinutes}
- Lesiones / limitaciones: ${brief.injuries || "ninguna indicada"}
- Notas del coach: ${brief.focusNotes || "ninguna"}`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: [
        {
          name: "propose_plan",
          description: "Devuelve el plan semanal de entrenamiento propuesto para que el coach lo revise.",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nombre del bloque/plan" },
              summary: { type: "string", description: "Resumen de cómo el plan refleja la metodología del coach" },
              progression: { type: "string", description: "Cómo progresar el plan las siguientes semanas (mesociclo)" },
              days: {
                type: "array",
                description: `Exactamente ${brief.daysPerWeek} días de entreno`,
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título del día, p.ej. 'Día 1 · Empuje'" },
                    focus: { type: "string", description: "Enfoque del día, p.ej. 'Pecho y tríceps'" },
                    exercises: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          sets: { type: "string", description: "Número de series, p.ej. '4'" },
                          reps: { type: "string", description: "Repeticiones, p.ej. '8-10'" },
                          rest: { type: "string", description: "Descanso, p.ej. '90s'" },
                          notes: { type: "string", description: "Indicación técnica o RIR/tempo" },
                        },
                        required: ["name", "sets", "reps", "rest"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["title", "focus", "exercises"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "summary", "days"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "propose_plan" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { ok: false, error: "No se pudo generar el plan. Inténtalo de nuevo." };
    }
    return { ok: true, plan: normalizePlan(toolUse.input, brief) };
  } catch {
    return { ok: false, error: "El generador de IA no está disponible ahora mismo." };
  }
}
