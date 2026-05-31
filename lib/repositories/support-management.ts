import { getMemberContext } from "@/lib/auth/member-access";
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

export type MemberSupportMessageInput = {
  workspaceId: string;
  body: string;
};

export type MemberConversation = {
  id: string;
  subject: string;
  status: string;
  messages: SupportMessage[];
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
  const context = await getMemberContext(workspaceId);
  if (!context || context.workspaceId !== workspaceId) return null;
  return context.memberProfileId;
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

/**
 * The member's single 1:1 thread with their coach. We treat the most recent
 * non-archived conversation as the canonical chat, lazily creating one the first
 * time the member opens the page so the thread is never empty-by-error. The
 * member is always resolved from the verified session (`getMemberContext`) — the
 * service-role read is scoped to that member's `member_profile_id`, so a member
 * can never see another member's thread even though RLS is bypassed server-side.
 */
export async function getOrCreateMemberConversation(workspaceId: string): Promise<MemberConversation | null> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !workspaceId) return null;

  const memberProfileId = await getDefaultMemberProfileId(workspaceId);
  if (!memberProfileId) return null;

  const supabase = createServiceSupabaseClient();
  const existing = await supabase
    .from("support_conversations")
    .select("id,subject,status")
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", memberProfileId)
    .neq("status", "archived")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    console.error("Unable to load member conversation", existing.error.message);
    return null;
  }

  let conversation = existing.data;
  if (!conversation) {
    const created = await supabase
      .from("support_conversations")
      .insert({
        workspace_id: workspaceId,
        member_profile_id: memberProfileId,
        subject: "Chat con tu coach",
        category: "general",
        priority: "normal",
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id,subject,status")
      .single();
    if (created.error || !created.data) {
      console.error("Unable to create member conversation", created.error?.message);
      return null;
    }
    conversation = created.data;
  }

  const messages = await supabase
    .from("support_messages")
    .select("id,sender_role,body,created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (messages.error) {
    console.error("Unable to load member messages", messages.error.message);
  }

  // Mark coach replies as read for this member now that they're viewing them.
  await supabase
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversation.id)
    .eq("sender_role", "coach")
    .is("read_at", null);

  return {
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status,
    messages: (messages.data ?? []).map((message) => ({
      id: message.id,
      senderRole: message.sender_role,
      body: message.body,
      createdAt: message.created_at,
    })),
  };
}

/**
 * Send a message as the member into their own 1:1 thread. Resolves the member
 * from the verified session and verifies the target conversation belongs to that
 * member before inserting — so a forged `conversationId` in a direct POST can't
 * write into another member's (or workspace's) thread.
 */
export async function sendMemberSupportMessage(input: MemberSupportMessageInput) {
  if (!input.workspaceId) throw new Error("Falta la marca.");
  const body = input.body.trim();
  if (!body) throw new Error("El mensaje es obligatorio.");

  const memberProfileId = await getDefaultMemberProfileId(input.workspaceId);
  if (!memberProfileId) throw new Error("Inicia sesión para escribir a tu coach.");

  const conversation = await getOrCreateMemberConversation(input.workspaceId);
  if (!conversation) throw new Error("No se pudo abrir tu conversación.");

  const supabase = createServiceSupabaseClient();
  const result = await supabase.from("support_messages").insert({
    workspace_id: input.workspaceId,
    conversation_id: conversation.id,
    member_profile_id: memberProfileId,
    sender_role: "member",
    body,
  });

  if (result.error) throw new Error(`No se pudo enviar: ${result.error.message}`);

  const updated = await supabase
    .from("support_conversations")
    .update({
      status: "waiting_coach",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", conversation.id)
    .eq("member_profile_id", memberProfileId);

  if (updated.error) throw new Error(`No se pudo actualizar la conversación: ${updated.error.message}`);
}
