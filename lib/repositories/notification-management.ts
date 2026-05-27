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
