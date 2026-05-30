import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type SupplementTiming = "morning" | "pre" | "post" | "meal" | "night" | "anytime";

export type Supplement = {
  id: string;
  name: string;
  dose: string;
  timing: SupplementTiming;
  notes: string;
};

export type MemberSupplement = Supplement & { takenToday: boolean };

export const TIMING_LABEL: Record<SupplementTiming, string> = {
  morning: "Por la mañana",
  pre: "Pre-entreno",
  post: "Post-entreno",
  meal: "Con la comida",
  night: "Por la noche",
  anytime: "Cualquier momento",
};

export const TIMING_ORDER: SupplementTiming[] = ["morning", "pre", "post", "meal", "night", "anytime"];

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeTiming(value: unknown): SupplementTiming {
  return TIMING_ORDER.includes(value as SupplementTiming) ? (value as SupplementTiming) : "anytime";
}

async function getDefaultMemberId(workspaceId: string): Promise<string | null> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function mapRow(row: any): Supplement {
  return { id: row.id, name: row.name, dose: row.dose ?? "", timing: normalizeTiming(row.timing), notes: row.notes ?? "" };
}

export async function listSupplements(workspaceId?: string): Promise<Supplement[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];
  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from("supplements")
    .select("id,name,dose,timing,notes,sort_order")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return data.map(mapRow);
}

/** Member view: supplements + whether each was ticked today. */
export async function getMemberSupplementsToday(workspaceId?: string): Promise<MemberSupplement[]> {
  const supplements = await listSupplements(workspaceId);
  if (!supplements.length || !isUuid(workspaceId)) return supplements.map((s) => ({ ...s, takenToday: false }));
  const memberId = await getDefaultMemberId(workspaceId);
  if (!memberId) return supplements.map((s) => ({ ...s, takenToday: false }));

  const supabase = createServiceSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await (supabase as any)
    .from("supplement_logs")
    .select("supplement_id")
    .eq("member_profile_id", memberId)
    .eq("taken_on", today);
  const taken = new Set<string>((data ?? []).map((row: { supplement_id: string }) => row.supplement_id));
  return supplements.map((s) => ({ ...s, takenToday: taken.has(s.id) }));
}

export async function createSupplement(input: {
  workspaceId: string;
  name: string;
  dose: string;
  timing: SupplementTiming;
  notes: string;
}): Promise<void> {
  if (!isUuid(input.workspaceId)) throw new Error("No se pudo identificar la marca.");
  if (!input.name.trim()) throw new Error("El suplemento necesita un nombre.");
  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any).from("supplements").insert({
    workspace_id: input.workspaceId,
    name: input.name.trim().slice(0, 120),
    dose: input.dose.trim().slice(0, 80),
    timing: normalizeTiming(input.timing),
    notes: input.notes.trim().slice(0, 300),
    sort_order: TIMING_ORDER.indexOf(normalizeTiming(input.timing)),
  });
  if (error) throw new Error(`No se pudo crear el suplemento: ${error.message}`);
}

export async function deleteSupplement(workspaceId: string, supplementId: string): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(supplementId)) return;
  const supabase = createServiceSupabaseClient();
  await (supabase as any).from("supplements").delete().eq("workspace_id", workspaceId).eq("id", supplementId);
}

export async function toggleSupplementLog(workspaceId: string, supplementId: string): Promise<void> {
  if (!isUuid(workspaceId) || !isUuid(supplementId)) return;
  const memberId = await getDefaultMemberId(workspaceId);
  if (!memberId) return;
  const supabase = createServiceSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const existing = await (supabase as any)
    .from("supplement_logs")
    .select("id")
    .eq("supplement_id", supplementId)
    .eq("member_profile_id", memberId)
    .eq("taken_on", today)
    .maybeSingle();

  if (existing.data?.id) {
    await (supabase as any).from("supplement_logs").delete().eq("id", existing.data.id);
    return;
  }
  await (supabase as any).from("supplement_logs").insert({
    workspace_id: workspaceId,
    supplement_id: supplementId,
    member_profile_id: memberId,
    taken_on: today,
  });
}
