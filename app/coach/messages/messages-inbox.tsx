"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare, MessagesSquare, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/ui";
import type { ManagedSupportConversation } from "@/lib/repositories/support-management";

const statusLabels: Record<string, string> = {
  open: "Abierta",
  waiting_coach: "Te toca",
  waiting_member: "Esperando al cliente",
  resolved: "Resuelta",
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Two-panel coach inbox: conversation list on the left, the selected thread +
 * composer on the right. On mobile it collapses to one column (list → thread,
 * with a back button). Selection is client state so it survives the InboxLive
 * poll/revalidation. The reply server action and chat styles are reused as-is.
 */
export function MessagesInbox({
  brandId,
  conversations,
  replyAction,
}: {
  brandId: string;
  conversations: ManagedSupportConversation[];
  replyAction: (formData: FormData) => void | Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!conversations.length) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="Aún no hay mensajes."
        text="Cuando un cliente te escriba desde su app, su conversación aparecerá aquí para que respondas."
      />
    );
  }

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  return (
    <div className="card span12 inbox" data-thread-open={active ? "true" : undefined}>
      <div className="inboxList" role="list">
        {conversations.map((conversation) => (
          <button
            type="button"
            role="listitem"
            key={conversation.id}
            className={`inboxItem${conversation.id === activeId ? " active" : ""}`}
            onClick={() => setActiveId(conversation.id)}
            aria-current={conversation.id === activeId}
          >
            <span className="inboxAvatar" aria-hidden="true">{conversation.memberName.slice(0, 1).toUpperCase()}</span>
            <span className="inboxItemBody">
              <strong>{conversation.memberName}</strong>
              <small>{conversation.subject}</small>
            </span>
            {conversation.status === "waiting_coach" ? <span className="inboxDot" aria-label="Te toca" /> : null}
          </button>
        ))}
      </div>

      <div className="inboxThread">
        {active ? (
          <>
            <div className="inboxThreadHead">
              <button type="button" className="inboxBack" onClick={() => setActiveId(null)} aria-label="Volver a la lista">
                <ArrowLeft size={18} />
              </button>
              <div className="inboxThreadTitle">
                <strong>{active.memberName}</strong>
                <small>{active.subject} · {active.category}</small>
              </div>
              <span className={active.status === "waiting_coach" ? "tag danger" : "tag"}>
                {statusLabels[active.status] ?? active.status}
              </span>
            </div>

            <div className="chatThread chatThreadCoach inboxMessages">
              {active.messages.length ? (
                active.messages.map((message) => {
                  const mine = message.senderRole === "coach";
                  return (
                    <div className={mine ? "chatRow member" : "chatRow coach"} key={message.id}>
                      {!mine ? (
                        <span className="chatAvatar">{active.memberName.slice(0, 1).toUpperCase()}</span>
                      ) : null}
                      <div className="chatBubble">
                        <p>{message.body}</p>
                        <time>{formatTime(message.createdAt)}</time>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="muted">Sin mensajes todavía.</p>
              )}
            </div>

            <form action={replyAction} className="chatComposer" key={active.id}>
              <input name="workspaceId" type="hidden" value={brandId} />
              <input name="conversationId" type="hidden" value={active.id} />
              <textarea
                name="message"
                rows={1}
                placeholder={`Responder a ${active.memberName}…`}
                required
                maxLength={2000}
                autoComplete="off"
              />
              <SubmitButton variant="primary" className="chatSend" aria-label="Enviar respuesta" successToast="Respuesta enviada">
                <Send size={16} />
              </SubmitButton>
            </form>
          </>
        ) : (
          <div className="inboxEmpty">
            <MessageSquare color="var(--soft)" aria-hidden="true" />
            <p>Elige una conversación para leerla y responder.</p>
          </div>
        )}
      </div>
    </div>
  );
}
