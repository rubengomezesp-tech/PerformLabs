"use server";

import { revalidatePath } from "next/cache";
import { answerAsCoach } from "@/lib/ai/coach-chat";
import { checkAiQuota, recordAiUsage } from "@/lib/ai/usage";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import {
  appendCoachAiMessage,
  getCoachBrain,
  getDefaultMember,
  listCoachAiMessages,
} from "@/lib/repositories/coach-brain";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function askCoachAiAction(formData: FormData) {
  const question = readText(formData, "question");
  if (!question) return;

  const brand = await getSelectedMemberAppBrand();
  const brain = await getCoachBrain(brand.id);
  if (!brain.enabled) return;

  // Require an authenticated member: server actions are reachable directly, so
  // without this guard an anonymous/cross-tenant POST could spend a workspace's
  // AI quota via the brand cookie. In open/demo mode getDefaultMember resolves
  // the demo member, so local still works.
  const member = await getDefaultMember(brand.id);
  if (!member) return;
  const memberProfileId = member.id;

  // Persist the question first so the coach sees it even if the model hiccups.
  await appendCoachAiMessage({ workspaceId: brand.id, memberProfileId, role: "user", content: question });

  // Monthly quota guard — protects margin and caps runaway usage.
  const quota = await checkAiQuota(brand.id, "coach_brain");
  if (!quota.allowed) {
    await appendCoachAiMessage({
      workspaceId: brand.id,
      memberProfileId,
      role: "assistant",
      content: "Hemos alcanzado el límite de consultas de IA de este mes. Tu coach verá tu mensaje y te responderá personalmente.",
    });
    revalidatePath("/app/coach-ai");
    return;
  }

  const history = await listCoachAiMessages(brand.id, memberProfileId);
  const result = await answerAsCoach({
    brain,
    brandName: brand.name,
    member: { name: member?.full_name, goal: (member as { goal?: string | null } | null)?.goal },
    history: history.filter((message) => message.content !== question || message.role !== "user").map((message) => ({ role: message.role, content: message.content })),
    question,
  });

  if (result.ok) {
    await recordAiUsage({ workspaceId: brand.id, feature: "coach_brain", model: result.model, usage: result.usage, memberProfileId });
  }

  const answer = result.ok
    ? result.answer
    : "Ahora mismo no puedo responderte. Tu coach lo verá y te contestará en cuanto pueda.";

  await appendCoachAiMessage({ workspaceId: brand.id, memberProfileId, role: "assistant", content: answer });

  revalidatePath("/app/coach-ai");
}
