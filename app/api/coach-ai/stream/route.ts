import type { NextRequest } from "next/server";
import { streamAsCoach } from "@/lib/ai/coach-chat";
import type { AiTokenUsage } from "@/lib/ai/usage";
import { checkAiQuota, recordAiUsage } from "@/lib/ai/usage";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { appendCoachAiMessage, getCoachBrain, getDefaultMember, listCoachAiMessages } from "@/lib/repositories/coach-brain";

export const dynamic = "force-dynamic";

// Per-member rate limit: max 8 requests per 60-second window.
// In-process Map is sufficient for a coaching app (low concurrency per user).
// Resets automatically as the Map entries expire; no persistence needed.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now >= entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { question?: string };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) return new Response("Missing question", { status: 400 });

    const brand = await getSelectedMemberAppBrand();
    const brain = await getCoachBrain(brand.id);
    if (!brain.enabled) return new Response("Assistant not active", { status: 403 });

    const member = await getDefaultMember(brand.id);
    if (!member) return new Response("Member not found", { status: 403 });

    // Per-member rate limit before any DB writes or AI calls.
    const rateLimitKey = `${brand.id}:${member.id}`;
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        "Has enviado demasiadas preguntas seguidas. Espera un momento antes de continuar.",
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    // Fetch history BEFORE inserting the user message so the new question is
    // never part of the context window — no content-match filter needed.
    const [history, quota] = await Promise.all([
      listCoachAiMessages(brand.id, member.id),
      checkAiQuota(brand.id, "coach_brain"),
    ]);

    // Persist the user turn regardless of quota so the coach can always see it.
    await appendCoachAiMessage({ workspaceId: brand.id, memberProfileId: member.id, role: "user", content: question });

    if (!quota.allowed) {
      const fallback = "Hemos alcanzado el límite de consultas de IA de este mes. Tu coach verá tu mensaje y te responderá personalmente.";
      await appendCoachAiMessage({ workspaceId: brand.id, memberProfileId: member.id, role: "assistant", content: fallback });
      return new Response(fallback, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const encoder = new TextEncoder();
    let fullAnswer = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAsCoach({
            brain,
            brandName: brand.name,
            member: { name: member.full_name, goal: (member as { goal?: string | null }).goal },
            history: history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            question,
            onUsage: (usage: AiTokenUsage, model: string) => {
              recordAiUsage({ workspaceId: brand.id, feature: "coach_brain", model, usage, memberProfileId: member.id }).catch(() => {});
            },
          })) {
            fullAnswer += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch {
          const err = "El asistente no está disponible ahora mismo. Inténtalo en un momento.";
          fullAnswer = fullAnswer || err;
          controller.enqueue(encoder.encode(fullAnswer));
        } finally {
          await appendCoachAiMessage({ workspaceId: brand.id, memberProfileId: member.id, role: "assistant", content: fullAnswer || "Sin respuesta." });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[coach-ai/stream]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
