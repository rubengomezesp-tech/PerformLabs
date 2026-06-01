import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listSupportConversations } from "@/lib/repositories/support-management";
import { replyCoachMessageAction } from "./actions";
import { InboxLive } from "./inbox-live";
import { MessagesInbox } from "./messages-inbox";

export const dynamic = "force-dynamic";

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
        <MessagesInbox brandId={brand.id} conversations={conversations} replyAction={replyCoachMessageAction} />
      </section>
      <InboxLive intervalMs={6000} />
    </>
  );
}
