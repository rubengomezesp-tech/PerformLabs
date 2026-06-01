import { notificationEvents } from "@/lib/domain/platform-logic";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type ManagedNotificationTemplate = {
  id: string;
  eventKey: string;
  channel: string;
  subject: string;
  body: string;
  isEnabled: boolean;
};

export type ManagedScheduledNotification = {
  id: string;
  name: string;
  channel: string;
  deliveryAt: string;
  status: string;
  message: string;
};

export type NotificationTemplateInput = {
  workspaceId: string;
  eventKey: string;
  channel: string;
  subject: string;
  body: string;
  isEnabled: boolean;
};

export type ScheduledNotificationInput = {
  workspaceId: string;
  name: string;
  channel: string;
  deliveryAt: string;
  message: string;
};

function jsonText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const text = (value as Record<string, unknown>)[key];
  return typeof text === "string" ? text : "";
}

function validChannel(channel: string) {
  return ["email", "push", "in_app"].includes(channel) ? channel : "in_app";
}

export async function listManagedNotificationTemplates(workspaceId?: string): Promise<ManagedNotificationTemplate[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("id,event_key,channel,subject,body,is_enabled,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load notification templates", error.message);
    return [];
  }

  return (data ?? []).map((template) => ({
    id: template.id,
    eventKey: template.event_key,
    channel: template.channel,
    subject: template.subject ?? "",
    body: jsonText(template.body, "message"),
    isEnabled: template.is_enabled,
  }));
}

export async function listManagedScheduledNotifications(workspaceId?: string): Promise<ManagedScheduledNotification[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_notifications")
    .select("id,name,channel,delivery_at,status,payload,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load scheduled notifications", error.message);
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    channel: item.channel,
    deliveryAt: item.delivery_at ?? "",
    status: item.status,
    message: jsonText(item.payload, "message"),
  }));
}

export async function saveManagedNotificationTemplate(input: NotificationTemplateInput) {
  if (!input.workspaceId) throw new Error("Selecciona una marca.");
  const event = notificationEvents.find((item) => item.key === input.eventKey);
  if (!event) throw new Error("Evento desconocido.");
  const channel = validChannel(input.channel);

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("notification_templates").upsert({
    workspace_id: input.workspaceId,
    event_key: input.eventKey,
    channel,
    subject: input.subject.trim() || null,
    body: { message: input.body.trim() },
    is_enabled: input.isEnabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: "workspace_id,event_key,channel" });

  if (error) throw new Error(`No se pudo guardar la plantilla: ${error.message}`);
}

export async function createManagedScheduledNotification(input: ScheduledNotificationInput) {
  if (!input.workspaceId) throw new Error("Selecciona una marca.");
  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio.");

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("scheduled_notifications").insert({
    workspace_id: input.workspaceId,
    name,
    channel: validChannel(input.channel),
    delivery_at: input.deliveryAt || null,
    payload: { message: input.message.trim() },
    audience_filter: { scope: "all_active_members" },
    status: "draft",
  });

  if (error) throw new Error(`No se pudo crear la notificacion: ${error.message}`);
}

export type DueScheduledNotification = {
  id: string;
  workspaceId: string;
  name: string;
  message: string;
};

/**
 * Platform-wide: scheduled push campaigns that are due to send (status
 * 'scheduled', delivery time reached or immediate). The cron dispatcher consumes
 * these — only `push` is processed since that's the only live transport.
 */
export async function listDueScheduledNotifications(limit = 200): Promise<DueScheduledNotification[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok) return [];

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_notifications")
    .select("id,workspace_id,name,payload,delivery_at,status,channel")
    .eq("status", "scheduled")
    .eq("channel", "push")
    .or(`delivery_at.is.null,delivery_at.lte.${new Date().toISOString()}`)
    .order("delivery_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("Unable to load due scheduled notifications", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    message: jsonText(row.payload, "message"),
  }));
}

/**
 * Atomically claim a campaign for sending: flips 'scheduled' -> 'sending' only if
 * it's still 'scheduled', so two overlapping cron runs can never both send it.
 * Returns true to the run that won the claim.
 */
export async function claimScheduledNotificationForSend(id: string): Promise<boolean> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !id) return false;
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_notifications")
    .update({ status: "sending" })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("id");
  if (error) {
    console.error("Unable to claim scheduled notification", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/** Engine-side terminal status update (trusted; no workspace scoping). */
export async function markScheduledNotificationStatus(id: string, status: "sent" | "failed" | "scheduled"): Promise<void> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !id) return;
  const supabase = createServiceSupabaseClient();
  await supabase.from("scheduled_notifications").update({ status }).eq("id", id);
}

/** Coach-side status change (workspace-scoped), for activate/cancel actions. */
export async function setScheduledNotificationStatus(workspaceId: string, id: string, status: string): Promise<void> {
  if (!workspaceId || !id) throw new Error("Falta el aviso.");
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("scheduled_notifications")
    .update({ status })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(`No se pudo actualizar el aviso: ${error.message}`);
}

/** The enabled push template for a workspace event, if any (for event-fired pushes). */
export async function getEnabledPushTemplate(workspaceId: string, eventKey: string): Promise<{ subject: string; body: string } | null> {
  if (!getSupabaseServiceEnv().ok || !workspaceId || !eventKey) return null;
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("subject,body,is_enabled,channel,event_key")
    .eq("workspace_id", workspaceId)
    .eq("event_key", eventKey)
    .eq("channel", "push")
    .eq("is_enabled", true)
    .maybeSingle();
  if (error || !data) return null;
  return { subject: data.subject ?? "", body: jsonText(data.body, "message") };
}
