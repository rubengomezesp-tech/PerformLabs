import { MessageSquare, MessagesSquare, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listSupportConversations } from "@/lib/repositories/support-management";
import { replyCoachMessageAction } from "./actions";
import { InboxLive } from "./inbox-live";

export const dynamic = "force-dynamic";

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

export default async function CoachMessagesPage() {
  const brand = await getSelectedMemberAppBrand();
  const conversations = await listSupportConversations(brand.id);
  const waitingCoach = conversations.filter((conversation) => conversation.status === "waiting_coach").length;

  return (
    <>
      <Topbar
        eyebrow="Mensajes"
        title="Bandeja de tus clientes."
        text="Lee y responde las conversaciones 1:1 de tus miembros. Las nuevas respuestas aparecen en directo, sin recargar."
      />
      <section className="grid">
        <article className="card span3">
          <p className="metric">Conversaciones<strong>{conversations.length}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Te tocan<strong>{waitingCoach}</strong></p>
        </article>

        {conversations.length ? (
          conversations.map((conversation) => (
            <article className="card span12 chatCard" key={conversation.id}>
              <div className="sectionHeader">
                <div>
                  <MessageSquare color="var(--gold)" aria-hidden="true" />
                  <h2>{conversation.memberName}</h2>
                  <p>{conversation.subject} · {conversation.category}</p>
                </div>
                <span className={conversation.status === "waiting_coach" ? "tag danger" : "tag"}>
                  {statusLabels[conversation.status] ?? conversation.status}
                </span>
              </div>

              <div className="chatThread chatThreadCoach">
                {conversation.messages.length ? (
                  conversation.messages.map((message) => {
                    // From the coach's seat, the coach's own replies sit on the right.
                    const mine = message.senderRole === "coach";
                    return (
                      <div className={mine ? "chatRow member" : "chatRow coach"} key={message.id}>
                        {!mine ? (
                          <span className="chatAvatar">{conversation.memberName.slice(0, 1).toUpperCase()}</span>
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

              <form action={replyCoachMessageAction} className="chatComposer">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="conversationId" type="hidden" value={conversation.id} />
                <textarea
                  name="message"
                  rows={1}
                  placeholder={`Responder a ${conversation.memberName}…`}
                  required
                  maxLength={2000}
                  autoComplete="off"
                />
                <SubmitButton className="btn primary chatSend" pendingLabel="">
                  <Send size={16} />
                </SubmitButton>
              </form>
            </article>
          ))
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="Aún no hay mensajes."
            text="Cuando un cliente te escriba desde su app, su conversación aparecerá aquí para que respondas."
          />
        )}
      </section>
      <InboxLive intervalMs={6000} />
    </>
  );
}
