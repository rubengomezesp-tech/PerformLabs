import { getMemberContext } from "@/lib/auth/member-access";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type OnboardingDraft = {
  step: number;
  answers: Record<string, unknown>;
};

// El quiz actual era useState puro: un refresh o una sesión caducada perdían
// las ~20 pantallas (D-4). El borrador se guarda por-paso, escopado SIEMPRE al
// perfil de la sesión (regla H5: jamás "el primer perfil del workspace").

const MAX_DRAFT_BYTES = 32 * 1024;

export async function getOnboardingDraft(workspaceId: string): Promise<OnboardingDraft | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return null;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_onboarding_drafts")
    .select("step,answers")
    .eq("member_profile_id", context.memberProfileId)
    .maybeSingle();
  if (!data) return null;
  const answers = data.answers && typeof data.answers === "object" && !Array.isArray(data.answers)
    ? data.answers as Record<string, unknown>
    : {};
  return { step: typeof data.step === "number" ? data.step : 0, answers };
}

export async function saveOnboardingDraft(workspaceId: string, step: number, answersJson: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return;
  if (answersJson.length > MAX_DRAFT_BYTES) return;
  let answers: unknown;
  try {
    answers = JSON.parse(answersJson);
  } catch {
    return;
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return;
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("member_onboarding_drafts").upsert({
    member_profile_id: context.memberProfileId,
    workspace_id: workspaceId,
    step: Number.isFinite(step) && step >= 0 ? Math.floor(step) : 0,
    answers: answers as Json,
    updated_at: new Date().toISOString(),
  }, { onConflict: "member_profile_id" });
  if (error) console.error("saveOnboardingDraft failed", error.message);
}

export async function clearOnboardingDraft(workspaceId: string): Promise<void> {
  if (!getSupabaseServiceEnv().ok || !workspaceId) return;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return;
  const supabase = createServiceSupabaseClient();
  await supabase.from("member_onboarding_drafts").delete().eq("member_profile_id", context.memberProfileId);
}
