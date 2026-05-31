import { getMemberContext } from "@/lib/auth/member-access";
import { getVerifiedUser } from "@/lib/auth/access-control";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * Everything the member Profile page ("Cuenta" + "Preferencias") needs to show
 * the member their OWN real data, resolved from their verified session.
 *
 * `fullName`, `email` and `subscriptionStatus` come from the auth user +
 * `member_profiles`; the preference fields come from `member_diet_preferences`
 * and `member_fitness_preferences`. Every field is nullable so the page can show
 * graceful fallbacks when a member hasn't completed onboarding yet.
 */
export type MemberProfileSummary = {
  fullName: string | null;
  email: string | null;
  subscriptionStatus: string | null;
  goal: string | null;
  mealsPerDay: number | null;
  daysPerWeek: number | null;
  dietStyle: string | null;
  trainingGoal: string | null;
  hideMacros: boolean;
};

/**
 * The member's REAL scope, resolved from their verified session — never a raw
 * (possibly flaky) brand id. Mirrors the pattern in `nutrition-tracking.ts`: the
 * member owns exactly one workspace, so we trust `getMemberContext`.
 */
async function resolveMemberScope(
  workspaceIdHint?: string,
): Promise<{ workspaceId: string; memberProfileId: string } | null> {
  const context = await getMemberContext(workspaceIdHint ?? "");
  if (!context) return null;
  return { workspaceId: context.workspaceId, memberProfileId: context.memberProfileId };
}

/**
 * Read the member's account + preferences for the Profile page. Returns null only
 * when there is no resolvable member (no session / no profile); otherwise returns
 * a summary where individual fields may be null when unset.
 */
export async function getMemberProfileSummary(
  workspaceIdHint?: string,
): Promise<MemberProfileSummary | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return null;

  const scope = await resolveMemberScope(workspaceIdHint);
  if (!scope) return null;

  const supabase = createServiceSupabaseClient();

  const [profileResult, dietResult, fitnessResult, user] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("full_name,goal,subscription_status")
      .eq("id", scope.memberProfileId)
      .maybeSingle(),
    supabase
      .from("member_diet_preferences")
      .select("meals_per_day,diet_style,hide_macros")
      .eq("member_profile_id", scope.memberProfileId)
      .maybeSingle(),
    supabase
      .from("member_fitness_preferences")
      .select("days_per_week,training_goal")
      .eq("member_profile_id", scope.memberProfileId)
      .maybeSingle(),
    // Email lives on the auth user, not on member_profiles. May be null for the
    // owner-preview session.
    getVerifiedUser().catch(() => null),
  ]);

  if (profileResult.error) {
    console.error("Unable to load member profile summary", profileResult.error.message);
  }

  const profile = profileResult.data;
  const diet = dietResult.data;
  const fitness = fitnessResult.data;

  return {
    fullName: profile?.full_name?.trim() || null,
    email: user?.email ?? null,
    subscriptionStatus: profile?.subscription_status ?? null,
    goal: profile?.goal?.trim() || null,
    mealsPerDay: diet?.meals_per_day ?? null,
    daysPerWeek: fitness?.days_per_week ?? null,
    dietStyle: diet?.diet_style?.trim() || null,
    trainingGoal: fitness?.training_goal?.trim() || null,
    hideMacros: Boolean(diet?.hide_macros),
  };
}

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  trialing: "Prueba",
  past_due: "Pago pendiente",
  paused: "En pausa",
  cancelled: "Cancelado",
  expired: "Caducado",
};

/** A friendly Spanish label for a subscription status, with a sensible default. */
export function subscriptionStatusLabel(status: string | null | undefined): string {
  if (!status) return "Sin plan";
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

const GOAL_LABELS: Record<string, string> = {
  definicion: "Perder grasa",
  volumen: "Ganar músculo",
  recomposicion: "Recomposición",
  rendimiento: "Rendimiento",
  salud: "Salud y forma",
};

/**
 * Best-effort friendly label for a stored goal. Goals are free text (the quiz
 * stores values like "Definicion"; coaches may type their own), so we map the
 * known onboarding values and otherwise show the stored text as-is.
 */
export function goalLabel(goal: string | null | undefined): string | null {
  if (!goal) return null;
  const trimmed = goal.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return GOAL_LABELS[normalized] ?? trimmed;
}
