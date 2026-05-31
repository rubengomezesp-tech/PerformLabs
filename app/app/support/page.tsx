import { BookOpen, ChevronRight, Dumbbell, HelpCircle, Mail, MessageSquare, PlayCircle, Send, ShieldCheck, Utensils } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceContentPages } from "@/lib/repositories/member-experience";
import { getOrCreateMemberConversation, listSupportConversations } from "@/lib/repositories/support-management";
import { createSupportConversationAction } from "./actions";
import { ChatComposer } from "./chat-composer";
import { ChatLive } from "./chat-live";
import { ChatScroll } from "./chat-scroll";

export const dynamic = "force-dynamic";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default async function SupportPage() {
  const brand = await getSelectedMemberAppBrand();
  const [pages, conversations, conversation] = await Promise.all([
    listWorkspaceContentPages(brand.id),
    listSupportConversations(brand.id),
    getOrCreateMemberConversation(brand.id),
  ]);
  const supportPage = pages.find((page) => page.slug === "soporte");
  const chatMessages = conversation?.messages ?? [];
  const guides = [
    { icon: BookOpen, title: "Guía inicial", text: "Empieza por aquí" },
    { icon: PlayCircle, title: "Cómo usar la app", text: "Consejos rápidos" },
    { icon: Utensils, title: "Nutrición", text: "Guías y consejos" },
    { icon: Dumbbell, title: "Entrenamiento", text: "Guías y consejos" },
  ];

  return (
    <>
      <Topbar
        eyebrow="Soporte"
        title={`Contacto de ${brand.name}.`}
        text="Habla directamente con tu coach. Abre también conversaciones con contexto sobre entrenamiento, nutrición, progreso o acceso."
      />
      <section className="grid">
        {conversation ? (
          <article className="card span12 chatCard uiGlass uiSheen">
            <div className="sectionHeader chatHeader">
              <div className="chatHeaderId">
                <span className="chatHeaderAvatar" aria-hidden="true">{brand.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <h2>{brand.name}</h2>
                  <p>Mensajes 1:1 con tu coach, en directo. Las respuestas aparecen aquí sin recargar.</p>
                </div>
              </div>
              <span className="chatLiveDot" aria-label="En directo">En directo</span>
            </div>

            <div className="chatThread">
              {chatMessages.length ? (
                chatMessages.map((message) => {
                  const mine = message.senderRole === "member";
                  return (
                    <div className={mine ? "chatRow member" : "chatRow coach"} key={message.id}>
                      {!mine ? <span className="chatAvatar">{brand.name.slice(0, 1).toUpperCase()}</span> : null}
                      <div className="chatBubble">
                        <p>{message.body}</p>
                        <time>{formatTime(message.createdAt)}</time>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="chatEmpty">
                  <MessageSquare size={22} color="var(--accent)" />
                  <strong>Empieza la conversación.</strong>
                  <p>Escribe a tu coach lo que necesites: dudas del plan, sensaciones, una foto que comentar… te responderá por aquí.</p>
                </div>
              )}
              <ChatScroll count={chatMessages.length} />
            </div>

            <ChatComposer workspaceId={brand.id} />
            <ChatLive intervalMs={5000} />
          </article>
        ) : null}

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

        <article className="card span12 supportGuidesCard">
          <div className="sectionHeader">
            <div>
              <BookOpen color="var(--accent)" />
              <h2>Guías.</h2>
              <p>Lo esencial para sacarle partido a tu plan y a la app.</p>
            </div>
          </div>
          <div className="supportGuideList">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link className="supportGuide" href="/app/guides" key={guide.title}>
                  <span className="supportGuideIcon"><Icon size={18} /></span>
                  <span>
                    <strong>{guide.title}</strong>
                    <small>{guide.text}</small>
                  </span>
                  <ChevronRight size={18} />
                </Link>
              );
            })}
          </div>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <MessageSquare color="var(--accent)" />
              <h2>Mensajes del equipo.</h2>
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
                <strong className="supportThreadStatus">{conversation.status}</strong>
              </section>
            )) : (
              <div className="supportThreadEmpty">
                <span className="uiIconChip"><MessageSquare size={18} /></span>
                <p className="muted">Aún no hay conversaciones abiertas. Abre una arriba con todo el contexto que quieras.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
