import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type SupportConversationInput = {
  workspaceId: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
};

export type CoachSupportReplyInput = {
  workspaceId: string;
  conversationId: string;
  message: string;
  status: string;
};

export type SupportMessage = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type ManagedSupportConversation = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  memberName: string;
  lastMessageAt: string;
  createdAt: string;
  messages: SupportMessage[];
};

function normalizeCategory(value: string) {
  return ["general", "training", "nutrition", "progress", "billing", "technical"].includes(value) ? value : "general";
}

function normalizePriority(value: string) {
  return ["low", "normal", "high", "urgent"].includes(value) ? value : "normal";
}

function normalizeStatus(value: string) {
  return ["open", "waiting_coach", "waiting_member", "resolved", "archived"].includes(value) ? value : "waiting_member";
}

async function getDefaultMemberProfileId(workspaceId: string) {
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

export async function createSupportConversation(input: SupportConversationInput) {
  if (!input.workspaceId) throw new Error("Falta la marca.");
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) throw new Error("Asunto y mensaje son obligatorios.");

  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  if (!memberProfileId) throw new Error("Crea primero un miembro para abrir conversaciones.");

  const supabase = createServiceSupabaseClient();
  const conversation = await supabase
    .from("support_conversations")
    .insert({
      workspace_id: input.workspaceId,
      member_profile_id: memberProfileId,
      subject,
      category: normalizeCategory(input.category),
      priority: normalizePriority(input.priority),
      status: "waiting_coach",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (conversation.error || !conversation.data) {
    throw new Error(`No se pudo abrir la conversación: ${conversation.error?.message ?? "sin respuesta"}`);
  }

  const messageResult = await supabase.from("support_messages").insert({
    workspace_id: input.workspaceId,
    conversation_id: conversation.data.id,
    member_profile_id: memberProfileId,
    sender_role: "member",
    body: message,
  });

  if (messageResult.error) {
    throw new Error(`Se creó la conversación, pero no el mensaje: ${messageResult.error.message}`);
  }
}

export async function replyToSupportConversation(input: CoachSupportReplyInput) {
  if (!input.workspaceId || !input.conversationId) throw new Error("Falta conversación.");
  const message = input.message.trim();
  if (!message) throw new Error("El mensaje es obligatorio.");

  const supabase = createServiceSupabaseClient();
  const result = await supabase.from("support_messages").insert({
    workspace_id: input.workspaceId,
    conversation_id: input.conversationId,
    sender_role: "coach",
    body: message,
  });

  if (result.error) throw new Error(`No se pudo responder: ${result.error.message}`);

  const updated = await supabase
    .from("support_conversations")
    .update({
      status: normalizeStatus(input.status),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.conversationId);

  if (updated.error) throw new Error(`No se pudo actualizar la conversación: ${updated.error.message}`);
}

export async function listSupportConversations(workspaceId?: string): Promise<ManagedSupportConversation[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return [];

  const supabase = createServiceSupabaseClient();
  const conversations = await supabase
    .from("support_conversations")
    .select("id,subject,category,priority,status,last_message_at,created_at,member_profiles(full_name)")
    .eq("workspace_id", workspaceId)
    .neq("status", "archived")
    .order("last_message_at", { ascending: false })
    .limit(20);

  if (conversations.error) {
    console.error("Unable to load support conversations", conversations.error.message);
    return [];
  }

  const ids = (conversations.data ?? []).map((conversation) => conversation.id);
  const messages = ids.length
    ? await supabase
        .from("support_messages")
        .select("id,conversation_id,sender_role,body,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (messages.error) {
    console.error("Unable to load support messages", messages.error.message);
  }

  const messagesByConversation = new Map<string, SupportMessage[]>();
  for (const message of messages.data ?? []) {
    const current = messagesByConversation.get(message.conversation_id) ?? [];
    current.push({
      id: message.id,
      senderRole: message.sender_role,
      body: message.body,
      createdAt: message.created_at,
    });
    messagesByConversation.set(message.conversation_id, current);
  }

  return (conversations.data ?? []).map((conversation) => ({
    id: conversation.id,
    subject: conversation.subject,
    category: conversation.category,
    priority: conversation.priority,
    status: conversation.status,
    memberName: conversation.member_profiles?.full_name ?? "Cliente",
    lastMessageAt: conversation.last_message_at,
    createdAt: conversation.created_at,
    messages: messagesByConversation.get(conversation.id) ?? [],
  }));
}
