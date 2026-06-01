import { Bell, CalendarClock, CheckCircle2, Mail, MessageSquareText, Radio, Send, Smartphone, Sparkles, Users } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { notificationEvents } from "@/lib/domain/platform-logic";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedNotificationTemplates, listManagedScheduledNotifications } from "@/lib/repositories/notification-management";
import { createCoachScheduledNotificationAction, saveCoachNotificationTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

const channelMeta = {
  push: { label: "Push", icon: Smartphone },
  in_app: { label: "In-app", icon: Bell },
  email: { label: "Email", icon: Mail },
};

const automationPlaybooks = [
  {
    title: "Adherencia diaria",
    text: "Recordatorio suave cuando hay entrenamiento o tareas pendientes.",
    tag: "Workout + habitos",
  },
  {
    title: "Check-in semanal",
    text: "Aviso antes del vencimiento y alerta si el cliente se retrasa.",
    tag: "Progreso",
  },
  {
    title: "Cambios del coach",
    text: "El miembro recibe aviso cuando se activa un plan nuevo o ajuste importante.",
    tag: "Plan actualizado",
  },
];

export default async function CoachNotificationsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [templates, scheduled] = await Promise.all([
    listManagedNotificationTemplates(brand.id),
    listManagedScheduledNotifications(brand.id),
  ]);
  const enabledTemplates = templates.filter((template) => template.isEnabled).length;
  const draftNotifications = scheduled.filter((item) => item.status === "draft").length;
  const pushTemplates = templates.filter((template) => template.channel === "push" && template.isEnabled).length;
  const defaultEvent = notificationEvents.find((event) => event.key === "progress.update_due") ?? notificationEvents[0];
  const defaultTemplate = templates.find((template) => template.eventKey === defaultEvent?.key && template.channel === "push");

  return (
    <>
      <Topbar
        eyebrow="Avisos"
        title="Centro de comunicación del coach."
        text="Plantillas, push, avisos in-app, email, recordatorios y mensajes programados para mantener al cliente activo sin perseguirlo manualmente."
        actions={<a className="btn primary" href="#nuevo-aviso">Crear aviso <Send size={18} /></a>}
      />
      <section className="grid">
        <article className="card span3 motionCard">
          <p className="metric">Plantillas activas<strong>{enabledTemplates}</strong></p>
          <p>Eventos con mensaje preparado por canal.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Push listos<strong>{pushTemplates}</strong></p>
          <p>Base preparada para activar proveedor push cuando toque.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Avisos draft<strong>{draftNotifications}</strong></p>
          <p>Campañas guardadas antes de envío.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Eventos base<strong>{notificationEvents.length}</strong></p>
          <p>Cuenta, pagos, progreso, comida, entreno y fotos.</p>
        </article>

        <article className="card span12 nutritionLabCard">
          <div className="sectionHeader">
            <div>
              <Sparkles color="var(--gold)" aria-hidden="true" />
              <h2>Playbooks de retención.</h2>
              <p>La experiencia premium no es mandar ruido: es tocar al cliente en el momento correcto con contexto útil.</p>
            </div>
            <span className="tag">{brand.appName}</span>
          </div>
          <div className="notificationPlaybookGrid">
            {automationPlaybooks.map((playbook) => (
              <section className="moduleGroup" key={playbook.title}>
                <div className="appCardHeader">
                  <Radio color="var(--gold)" aria-hidden="true" />
                  <h3>{playbook.title}</h3>
                </div>
                <p>{playbook.text}</p>
                <span className="tag">{playbook.tag}</span>
              </section>
            ))}
          </div>
        </article>

        <article className="card span7" id="nuevo-aviso">
          <div className="sectionHeader">
            <div>
              <CalendarClock color="var(--gold)" aria-hidden="true" />
              <h2>Programar aviso.</h2>
              <p>Mensaje puntual para todos los miembros activos. Queda en draft hasta conectar envío real o revisión final.</p>
            </div>
          </div>
          <form action={createCoachScheduledNotificationAction} className="notificationComposer">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Nombre interno
              <input name="name" placeholder="Recordatorio check-in viernes" required />
            </label>
            <label>
              Canal
              <select name="channel" defaultValue="push">
                <option value="push">Push</option>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label>
              Fecha y hora
              <input name="deliveryAt" type="datetime-local" />
            </label>
            <label className="spanFull">
              Mensaje
              <textarea name="message" rows={5} placeholder="Tienes tu check-in listo. Sube peso, fotos y sensaciones para que podamos ajustar tu siguiente fase." required />
            </label>
            <button className="btn primary" type="submit">
              Guardar aviso <Send size={16} />
            </button>
          </form>
        </article>

        <article className="card span5">
          <div className="sectionHeader">
            <div>
              <Users color="var(--gold)" aria-hidden="true" />
              <h2>Audiencia inteligente.</h2>
              <p>Segmentos preparados para que el coach no tenga que pensar desde cero cada vez.</p>
            </div>
          </div>
          <ul className="list">
            <li className="row">Todos los activos <span className="tag">Base</span></li>
            <li className="row">Check-in pendiente <span className="tag">Progreso</span></li>
            <li className="row">Entreno sin registrar <span className="tag">Adherencia</span></li>
            <li className="row">Plan recién activado <span className="tag">Onboarding</span></li>
            <li className="row">Pago fallido <span className="tag danger">Billing</span></li>
          </ul>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <MessageSquareText color="var(--gold)" aria-hidden="true" />
              <h2>Plantilla por evento.</h2>
              <p>Edita el mensaje que se dispara cuando pasa algo importante en la app del cliente.</p>
            </div>
            <span className="tag">Email · Push · In-app</span>
          </div>
          <form action={saveCoachNotificationTemplateAction} className="notificationTemplateForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Evento
              <select name="eventKey" defaultValue={defaultEvent?.key}>
                {notificationEvents.map((event) => (
                  <option key={event.key} value={event.key}>{event.title}</option>
                ))}
              </select>
            </label>
            <label>
              Canal
              <select name="channel" defaultValue={defaultTemplate?.channel ?? "push"}>
                <option value="push">Push</option>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label>
              Asunto
              <input name="subject" defaultValue={defaultTemplate?.subject ?? "Tu coach ha actualizado tu plan"} placeholder="Solo email / fallback" />
            </label>
            <label className="toggleRow">
              Activa
              <input name="isEnabled" defaultChecked={defaultTemplate?.isEnabled ?? true} type="checkbox" />
            </label>
            <label className="spanFull">
              Mensaje
              <textarea name="body" defaultValue={defaultTemplate?.body ?? "Tienes una actualización en tu app. Entra cuando puedas y revisa el siguiente paso."} rows={4} />
            </label>
            <button className="btn primary" type="submit">
              Guardar plantilla <CheckCircle2 size={16} />
            </button>
          </form>
        </article>

        <article className="card span6">
          <h2>Plantillas actuales</h2>
          <ul className="list">
            {templates.length ? templates.slice(0, 8).map((template) => {
              const meta = channelMeta[template.channel as keyof typeof channelMeta] ?? channelMeta.in_app;
              const Icon = meta.icon;
              return (
                <li className="row" key={template.id}>
                  <div>
                    <strong><Icon size={15} /> {template.subject || template.eventKey}</strong>
                    <p>{template.body || "Sin mensaje definido"}</p>
                  </div>
                  <span className={template.isEnabled ? "tag" : "tag danger"}>{meta.label}</span>
                </li>
              );
            }) : <li className="row">Sin plantillas todavia <span className="tag">Crear arriba</span></li>}
          </ul>
        </article>

        <article className="card span6">
          <h2>Avisos programados</h2>
          <ul className="list">
            {scheduled.length ? scheduled.slice(0, 8).map((item) => {
              const meta = channelMeta[item.channel as keyof typeof channelMeta] ?? channelMeta.in_app;
              const Icon = meta.icon;
              return (
                <li className="row" key={item.id}>
                  <div>
                    <strong><Icon size={15} /> {item.name}</strong>
                    <p>{item.message || "Sin mensaje"} · {item.deliveryAt || "Sin fecha"}</p>
                  </div>
                  <span className="tag">{item.status}</span>
                </li>
              );
            }) : <li className="row">Sin avisos programados <span className="tag">Crear arriba</span></li>}
          </ul>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Smartphone color="var(--gold)" aria-hidden="true" />
              <h2>Checklist para push real.</h2>
              <p>Queda preparado el producto; la capa de envío se conecta cuando definamos proveedor y publicación.</p>
            </div>
          </div>
          <div className="notificationReadinessGrid">
            {[
              "Permiso en app del miembro",
              "Preferencias por canal",
              "Plantillas por evento",
              "Cola de mensajes programados",
              "Segmentos de audiencia",
              "Proveedor push/web push",
            ].map((item, index) => (
              <span key={item}>
                <CheckCircle2 color={index < 5 ? "var(--green)" : "var(--soft)"} size={16} />
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
