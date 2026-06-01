import { getMemberContext } from "@/lib/auth/member-access";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type NotificationKey =
  | "coach_changes"
  | "workout_reminders"
  | "meal_reminders"
  | "checkin_reminders"
  | "in_app_messages"
  | "quiet_mode";

export type NotificationPreferences = Record<NotificationKey, boolean>;

// Defaults mirror the column defaults in member_notification_preferences, so an
// unsaved member sees sensible toggles (the important reminders on, opt-ins off).
const DEFAULTS: NotificationPreferences = {
  coach_changes: true,
  workout_reminders: true,
  meal_reminders: false,
  checkin_reminders: true,
  in_app_messages: true,
  quiet_mode: false,
};

export const NOTIFICATION_KEYS = Object.keys(DEFAULTS) as NotificationKey[];

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveMemberId(workspaceId?: string): Promise<string | null> {
  if (!isUuid(workspaceId)) return null;
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
}

/** The member's notification toggles, falling back to defaults when nothing is saved. */
export async function getMemberNotificationPreferences(workspaceId?: string): Promise<NotificationPreferences> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return { ...DEFAULTS };
  const memberProfileId = await resolveMemberId(workspaceId);
  if (!memberProfileId) return { ...DEFAULTS };

  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_notification_preferences")
    .select(NOTIFICATION_KEYS.join(","))
    .eq("member_profile_id", memberProfileId)
    .maybeSingle();

  // The select list is built from NOTIFICATION_KEYS at runtime, so narrow the row
  // to the known preference shape rather than letting it widen to a parser error.
  const row = data as Partial<NotificationPreferences> | null;
  if (!row) return { ...DEFAULTS };
  return NOTIFICATION_KEYS.reduce((acc, key) => {
    acc[key] = row[key] === undefined ? DEFAULTS[key] : Boolean(row[key]);
    return acc;
  }, {} as NotificationPreferences);
}

/** Sets a single notification toggle (upsert; other toggles keep their column defaults on first write). */
export async function setMemberNotificationPreference(workspaceId: string, key: NotificationKey, value: boolean): Promise<void> {
  if (!NOTIFICATION_KEYS.includes(key)) throw new Error("Preferencia no válida.");
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) throw new Error("No se pudo identificar la app del cliente.");
  const memberProfileId = await resolveMemberId(workspaceId);
  if (!memberProfileId) throw new Error("Todavía no hay perfil de cliente para guardar la preferencia.");

  const supabase = createServiceSupabaseClient();
  // `key` is a validated NotificationKey (a real boolean column), but a computed
  // property key widens the literal, so assert the row to the table's Insert type.
  const payload = {
    member_profile_id: memberProfileId,
    [key]: value,
    updated_at: new Date().toISOString(),
  } as Database["public"]["Tables"]["member_notification_preferences"]["Insert"];
  const { error } = await supabase
    .from("member_notification_preferences")
    .upsert(payload, { onConflict: "member_profile_id" });
  if (error) throw new Error(`No se pudo guardar la preferencia: ${error.message}`);
}
