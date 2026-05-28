import { BookOpen, MessageSquare, Plus, Send } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedContentPages } from "@/lib/repositories/content-management";
import { listSupportConversations } from "@/lib/repositories/support-management";
import { replyCoachSupportAction, saveCoachContentPageAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachContentPage() {
  const brand = await getSelectedMemberAppBrand();
  const [pages, conversations] = await Promise.all([
    listManagedContentPages(brand.id),
    listSupportConversations(brand.id),
  ]);
  const openConversations = conversations.filter((conversation) => conversation.status !== "resolved").length;

  return (
    <>
      <Topbar
        eyebrow="Contenido"
        title="Guías, soporte y pantallas de app."
        text="El entrenador mantiene educación, FAQs, onboarding y conversaciones dentro de su marca."
        actions={<a className="btn primary" href="#nueva-guia">Nueva guía <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span4">
          <p className="metric">Guías<strong>{pages.length}</strong></p>
        </article>
        <article className="card span4">
          <p className="metric">Soporte abierto<strong>{openConversations}</strong></p>
        </article>
        <article className="card span4">
          <p className="metric">Marca<strong>{brand.appName}</strong></p>
        </article>

        <article className="card span12 coachBuilderCard" id="nueva-guia">
          <div>
            <span className="eyebrow">Biblioteca educativa</span>
            <h2>Crear guía visible en la app.</h2>
            <p>FAQs, normas del programa, preparación de comidas, técnica, cardio o soporte.</p>
          </div>
          <form action={saveCoachContentPageAction} className="contentQuickForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Título
              <input name="title" placeholder="Guía de check-in semanal" required />
            </label>
            <label>
              Slug
              <input name="slug" placeholder="guia-check-in" />
            </label>
            <label>
              Estado
              <select name="status" defaultValue="active">
                <option value="active">Activo</option>
                <option value="draft">Borrador</option>
                <option value="archived">Archivado</option>
              </select>
            </label>
            <label>
              Encabezado
              <input name="heading" placeholder="Cómo hacer tu check-in" />
            </label>
            <label className="spanFull">
              Contenido
              <textarea name="notes" rows={4} placeholder="Instrucciones, pasos, criterios y enlaces internos..." />
            </label>
            <button className="btn primary" type="submit">Publicar guía</button>
          </form>
        </article>

        {pages.map((page) => (
          <article className="card span4 motionCard" key={page.id}>
            <BookOpen color="var(--gold)" />
            <h2>{page.heading}</h2>
            <p>{page.notes || page.title}</p>
            <span className="tag">{page.status}</span>
          </article>
        ))}

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <MessageSquare color="var(--gold)" />
              <h2>Bandeja de soporte.</h2>
              <p>Conversaciones abiertas desde la app del cliente, con respuesta del coach.</p>
            </div>
            <span className="tag">{conversations.length}</span>
          </div>
          <div className="supportInbox">
            {conversations.length ? conversations.map((conversation) => (
              <section className="supportInboxItem" key={conversation.id}>
                <div className="sectionHeader compact">
                  <div>
                    <span className="eyebrow">{conversation.memberName} · {conversation.category}</span>
                    <h3>{conversation.subject}</h3>
                    <p>{conversation.messages.at(-1)?.body ?? "Sin mensajes"}</p>
                  </div>
                  <span className={conversation.priority === "urgent" || conversation.priority === "high" ? "tag danger" : "tag"}>{conversation.status}</span>
                </div>
                <form action={replyCoachSupportAction} className="supportReplyForm">
                  <input name="workspaceId" type="hidden" value={brand.id} />
                  <input name="conversationId" type="hidden" value={conversation.id} />
                  <label>
                    Estado
                    <select name="status" defaultValue="waiting_member">
                      <option value="waiting_member">Respondido</option>
                      <option value="waiting_coach">Necesita coach</option>
                      <option value="resolved">Resuelto</option>
                    </select>
                  </label>
                  <label className="spanFull">
                    Respuesta
                    <textarea name="message" rows={3} placeholder="Respuesta clara, acción concreta y siguiente paso..." />
                  </label>
                  <button className="btn primary" type="submit">
                    Responder <Send size={16} />
                  </button>
                </form>
              </section>
            )) : <p className="muted">Sin conversaciones abiertas.</p>}
          </div>
        </article>
      </section>
    </>
  );
}
