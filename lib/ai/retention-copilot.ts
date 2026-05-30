import Anthropic from "@anthropic-ai/sdk";
import type { AiTokenUsage } from "@/lib/ai/usage";
import type { CoachBrain } from "@/lib/repositories/coach-brain";

/** Same balanced model as the member chat — it's the coach's voice, lower volume. */
const MODEL = process.env.COACH_BRAIN_MODEL ?? "claude-sonnet-4-6";

export type NudgeResult =
  | { ok: true; message: string; usage: AiTokenUsage; model: string }
  | { ok: false; error: string; notConfigured?: boolean };

export function isRetentionCopilotConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function brainVoice(brain: CoachBrain): string {
  const bits: string[] = [];
  if (brain.persona.trim()) bits.push(`Filosofía del coach: ${brain.persona.trim()}`);
  if (brain.tone.trim()) bits.push(`Tono y forma de hablar (imítalo): ${brain.tone.trim()}`);
  if (brain.forbidden.trim()) bits.push(`Nunca: ${brain.forbidden.trim()}`);
  return bits.length ? bits.join("\n") : "Tono cercano, motivador y directo, tuteando al cliente.";
}

/**
 * Drafts a short, personal re-engagement message FROM the coach TO an at-risk
 * client, in the coach's voice, addressing the specific churn reason. The coach
 * reviews and sends — never auto-sent.
 */
export async function draftRetentionMessage(params: {
  brain: CoachBrain;
  brandName: string;
  memberName: string;
  reasons: string[];
  riskScore: number;
}): Promise<NudgeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, notConfigured: true, error: "Configura ANTHROPIC_API_KEY para usar el copiloto." };
  }

  const system = `Eres ${params.brandName}, el coach. Escribe un mensaje BREVE y personal para reconectar con un cliente que está en riesgo de abandonar. Debe sonar a ti, no a una plantilla ni a una IA.

${brainVoice(params.brain)}

Reglas:
- Dirígete al cliente por su nombre, en segunda persona.
- Sé cálido y sin culpabilizar. Reconoce su situación, recuérdale su objetivo y propón un siguiente paso pequeño y concreto.
- 2 a 4 frases. Sin asunto, sin firma, sin emojis excesivos.
- No prometas resultados garantizados. No des consejo médico.
- Devuelve SOLO el texto del mensaje, nada más.`;

  const reasonText = params.reasons.length ? params.reasons.join("; ") : "lleva tiempo sin actividad";
  const userPrompt = `Cliente: ${params.memberName}
Riesgo de abandono: ${params.riskScore}/100
Motivos detectados: ${reasonText}

Escribe el mensaje para reengancharle.`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) return { ok: false, error: "No se pudo redactar el mensaje. Inténtalo de nuevo." };
    return { ok: true, message: text, usage: (message.usage ?? {}) as AiTokenUsage, model: MODEL };
  } catch {
    return { ok: false, error: "El copiloto no está disponible ahora mismo." };
  }
}
