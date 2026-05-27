import { Bell, Mail, MessageCircle, Save, Smartphone } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { notificationEvents } from "@/lib/domain/platform-logic";
import { listManagedNotificationTemplates, listManagedScheduledNotifications } from "@/lib/repositories/notification-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { createScheduledNotificationAction, saveNotificationTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

const channelIcons = {
  email: Mail,
  push: Smartphone,
  in_app: MessageCircle,
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [templates, scheduled] = await Promise.all([
    listManagedNotificationTemplates(selectedWorkspace?.id),
    listManagedScheduledNotifications(selectedWorkspace?.id),
  ]);
  const emailCount = notificationEvents.filter((event) => event.channels.includes("email")).length;
  const pushCount = notificationEvents.filter((event) => event.channels.includes("push")).length;
  const inAppCount = notificationEvents.filter((event) => event.channels.includes("in_app")).length;

  return (
    <>
      <Topbar
        eyebrow="Notificaciones"
        title="Eventos, mensajes y recordatorios por marca."
        text="Base del sistema de email, push e in-app: pagos, check-ins, cambios de comida, swaps, progreso, soporte y cuenta."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/notifications" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver mensajes</button>
            </div>
          </form>
        </article>

        <article className="card span3"><p className="metric">Eventos<strong>{notificationEvents.length}</strong></p><p>Mapa inicial.</p></article>
        <article className="card span3"><p className="metric">Email<strong>{emailCount}</strong></p><p>Confirmaciones y cuenta.</p></article>
        <article className="card span3"><p className="metric">Push<strong>{pushCount}</strong></p><p>Check-ins y acciones urgentes.</p></article>
        <article className="card span3"><p className="metric">In-app<strong>{inAppCount}</strong></p><p>Actividad dentro de la app.</p></article>

        {selectedWorkspace ? (
          <>
            <article className="card span6">
              <h2>Plantilla de evento</h2>
              <form action={saveNotificationTemplateAction} className="formStack">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Evento
                  <select name="eventKey">
                    {notificationEvents.map((event) => (
                      <option key={event.key} value={event.key}>{event.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Canal
                  <select name="channel" defaultValue="in_app">
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                    <option value="in_app">In-app</option>
                  </select>
                </label>
                <label>
                  Asunto
                  <input name="subject" placeholder="Tu plan ha sido actualizado" />
                </label>
                <label>
                  Estado
                  <select name="isEnabled" defaultValue="true">
                    <option value="true">Activo</option>
                    <option value="false">Pausado</option>
                  </select>
                </label>
                <label>
                  Mensaje
                  <textarea name="body" rows={4} placeholder="Texto base con variables del evento." />
                </label>
                <button className="btn primary" type="submit">Guardar plantilla <Save size={18} /></button>
              </form>
            </article>

            <article className="card span6">
              <h2>Campaña programada</h2>
              <form action={createScheduledNotificationAction} className="formStack">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Recordatorio check-in domingo" required />
                </label>
                <label>
                  Canal
                  <select name="channel" defaultValue="in_app">
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                    <option value="in_app">In-app</option>
                  </select>
                </label>
                <label>
                  Envío
                  <input name="deliveryAt" type="datetime-local" />
                </label>
                <label>
                  Mensaje
                  <textarea name="message" rows={4} placeholder="Recuerda subir fotos, peso y notas antes de la revisión." />
                </label>
                <button className="btn primary" type="submit">Crear campaña <Bell size={18} /></button>
              </form>
            </article>
          </>
        ) : null}

        {templates.map((template) => {
          const Icon = channelIcons[template.channel as keyof typeof channelIcons] ?? Bell;
          return (
            <article className="card span4" key={template.id}>
              <Icon color="var(--gold)" />
              <h3>{template.eventKey}</h3>
              <p>{template.subject || "Sin asunto"}</p>
              <p>{template.body || "Sin cuerpo"}</p>
              <span className={template.isEnabled ? "tag" : "tag danger"}>{template.isEnabled ? "Activo" : "Pausado"}</span>
            </article>
          );
        })}

        {scheduled.map((item) => {
          const Icon = channelIcons[item.channel as keyof typeof channelIcons] ?? Bell;
          return (
            <article className="card span4" key={item.id}>
              <Icon color="var(--gold)" />
              <h3>{item.name}</h3>
              <p>{item.message || "Sin mensaje"}</p>
              <div className="row">Entrega <span>{item.deliveryAt || "Sin fecha"}</span></div>
              <span className="tag">{item.status}</span>
            </article>
          );
        })}
      </section>
    </>
  );
}
