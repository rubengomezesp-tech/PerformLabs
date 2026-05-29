import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CoachBrain = {
  workspaceId: string;
  enabled: boolean;
  assistantName: string;
  greeting: string;
  persona: string;
  tone: string;
  specialties: string;
  rules: string;
  substitutions: string;
  forbidden: string;
  configured: boolean;
};

export type CoachAiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type CoachAiQuestionInsight = {
  content: string;
  memberName: string;
  createdAt: string;
};

const DEFAULT_GREETING =
  "¡Hola! Soy el asistente de tu coach. Pregúntame lo que necesites sobre tu entreno, tu dieta o tus dudas del día a día.";

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function defaultBrain(workspaceId: string, configured: boolean): CoachBrain {
  return {
    workspaceId,
    enabled: false,
    assistantName: "Tu asistente",
    greeting: DEFAULT_GREETING,
    persona: "",
    tone: "",
    specialties: "",
    rules: "",
    substitutions: "",
    forbidden: "",
    configured,
  };
}

export async function getDefaultMember(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id,full_name,goal")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getCoachBrain(workspaceId?: string): Promise<CoachBrain> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return defaultBrain(workspaceId ?? "", false);

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("coach_ai_brains")
    .select("enabled,assistant_name,greeting,persona,tone,specialties,rules,substitutions,forbidden")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) return defaultBrain(workspaceId, !error);

  return {
    workspaceId,
    enabled: Boolean(data.enabled),
    assistantName: data.assistant_name || "Tu asistente",
    greeting: data.greeting || DEFAULT_GREETING,
    persona: data.persona || "",
    tone: data.tone || "",
    specialties: data.specialties || "",
    rules: data.rules || "",
    substitutions: data.substitutions || "",
    forbidden: data.forbidden || "",
    configured: true,
  };
}

export type SaveCoachBrainInput = {
  workspaceId: string;
  enabled: boolean;
  assistantName: string;
  greeting: string;
  persona: string;
  tone: string;
  specialties: string;
  rules: string;
  substitutions: string;
  forbidden: string;
};

export async function saveCoachBrain(input: SaveCoachBrainInput) {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la marca.");
  const supabase = createServiceSupabaseClient();

  const { error } = await (supabase as any)
    .from("coach_ai_brains")
    .upsert(
      {
        workspace_id: input.workspaceId,
        enabled: input.enabled,
        assistant_name: input.assistantName.trim().slice(0, 80) || "Tu asistente",
        greeting: input.greeting.trim().slice(0, 600) || DEFAULT_GREETING,
        persona: input.persona.trim().slice(0, 4000),
        tone: input.tone.trim().slice(0, 1500),
        specialties: input.specialties.trim().slice(0, 1500),
        rules: input.rules.trim().slice(0, 6000),
        substitutions: input.substitutions.trim().slice(0, 3000),
        forbidden: input.forbidden.trim().slice(0, 3000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );

  if (error) throw new Error(`No se pudo guardar el cerebro de IA: ${error.message}`);
}

export async function listCoachAiMessages(workspaceId: string, memberProfileId: string | null, limit = 30): Promise<CoachAiMessage[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId) || !isUuid(memberProfileId)) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("coach_ai_messages")
    .select("id,role,content,created_at")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: { id: string; role: string; content: string; created_at: string }) => ({
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function appendCoachAiMessage(input: {
  workspaceId: string;
  memberProfileId: string | null;
  role: "user" | "assistant";
  content: string;
}) {
  if (!isUuid(input.workspaceId)) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("coach_ai_messages").insert({
    workspace_id: input.workspaceId,
    member_profile_id: isUuid(input.memberProfileId) ? input.memberProfileId : null,
    role: input.role,
    content: input.content.slice(0, 6000),
  });
}

// Coach-side insight: what are clients actually asking the assistant?
export async function listRecentClientQuestions(workspaceId?: string, limit = 8): Promise<CoachAiQuestionInsight[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("coach_ai_messages")
    .select("content,created_at,member_profile_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const memberIds = [...new Set(data.map((row: { member_profile_id: string | null }) => row.member_profile_id).filter(Boolean))];
  const namesById = new Map<string, string>();
  if (memberIds.length) {
    const { data: members } = await supabase
      .from("member_profiles")
      .select("id,full_name")
      .in("id", memberIds as string[]);
    for (const member of members ?? []) namesById.set(member.id, member.full_name ?? "Cliente");
  }

  return data.map((row: { content: string; created_at: string; member_profile_id: string | null }) => ({
    content: row.content,
    memberName: (row.member_profile_id && namesById.get(row.member_profile_id)) || "Cliente",
    createdAt: row.created_at,
  }));
}
