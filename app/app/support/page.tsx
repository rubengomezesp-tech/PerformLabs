import { HelpCircle, Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceContentPages } from "@/lib/repositories/member-experience";
import { listSupportConversations } from "@/lib/repositories/support-management";
import { createSupportConversationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const brand = await getSelectedMemberAppBrand();
  const [pages, conversations] = await Promise.all([
    listWorkspaceContentPages(brand.id),
    listSupportConversations(brand.id),
  ]);
  const supportPage = pages.find((page) => page.slug === "soporte");

  return (
    <>
      <Topbar
        eyebrow="Soporte"
        title={`Contacto de ${brand.name}.`}
        text="Abre una conversación con contexto para que el coach pueda responder sobre entrenamiento, nutrición, progreso o acceso."
      />
      <section className="grid">
        <article className="card span7 supportComposerCard">
          <div className="sectionHeader">
            <div>
              <MessageSquare color="var(--gold)" />
              <h2>Nueva conversación.</h2>
              <p>{supportPage?.notes ?? "Cuanto más contexto incluyas, más precisa será la respuesta del equipo."}</p>
            </div>
            <span className="tag">Privado</span>
          </div>
          <form action={createSupportConversationAction} className="supportConversationForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Asunto
              <input name="subject" placeholder="Molestia en sentadilla, duda de macros..." required />
            </label>
            <label>
              Categoría
              <select name="category" defaultValue="training">
                <option value="training">Entrenamiento</option>
                <option value="nutrition">Nutrición</option>
                <option value="progress">Progreso</option>
                <option value="technical">Técnico</option>
                <option value="billing">Pagos</option>
                <option value="general">General</option>
              </select>
            </label>
            <label>
              Prioridad
              <select name="priority" defaultValue="normal">
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label className="spanFull">
              Mensaje
              <textarea name="message" rows={5} placeholder="Explica qué ocurre, desde cuándo, qué has probado y si necesitas ajuste del plan." required />
            </label>
            <button className="btn primary" type="submit">
              Enviar al coach <Send size={16} />
            </button>
          </form>
        </article>

        <article className="card span5">
          <Mail color="var(--gold)" />
          <h2>Contacto de respaldo</h2>
          <p>{brand.supportEmail}</p>
          <ul className="list">
            <li className="row"><ShieldCheck size={16} /> Cuenta y acceso <span className="tag">Email</span></li>
            <li className="row"><HelpCircle size={16} /> Dudas del plan <span className="tag">Chat</span></li>
          </ul>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <MessageSquare color="var(--gold)" />
              <h2>Conversaciones recientes.</h2>
              <p>Todo queda ordenado dentro de la app, separado de WhatsApp y mensajes sueltos.</p>
            </div>
            <span className="tag">{conversations.length}</span>
          </div>
          <div className="supportThreadList">
            {conversations.length ? conversations.map((conversation) => (
              <section className="supportThread" key={conversation.id}>
                <div>
                  <span className="tag">{conversation.category}</span>
                  <h3>{conversation.subject}</h3>
                  <p>{conversation.messages.at(-1)?.body ?? "Sin mensajes"}</p>
                </div>
                <strong>{conversation.status}</strong>
              </section>
            )) : <p className="muted">Aún no hay conversaciones abiertas.</p>}
          </div>
        </article>
      </section>
    </>
  );
}
