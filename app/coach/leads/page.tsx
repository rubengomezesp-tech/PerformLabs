import type { CSSProperties } from "react";
import {
  CalendarClock,
  ExternalLink,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  Radar,
  Save,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { requireWorkspaceMutationAccess } from "@/lib/auth/access-control";
import { diagnosticAnswerLabel } from "@/lib/lead-capture/coach-inquiry";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listCoachInquiries, type CoachInquirySummary } from "@/lib/repositories/coach-inquiries";
import { updateCoachInquiryAction } from "./actions";

export const dynamic = "force-dynamic";

type CoachLeadsPageProps = {
  searchParams?: Promise<{ status?: string; priority?: string; page?: string }>;
};

const statusOptions = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Cualificado" },
  { value: "booked", label: "Llamada agendada" },
  { value: "won", label: "Cliente" },
  { value: "nurture", label: "Seguimiento" },
  { value: "lost", label: "Perdido" },
] as const;

const priorityOptions = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
] as const;

const pipelineStatuses = ["new", "contacted", "qualified", "booked", "won"] as const;

function optionLabel<T extends readonly { value: string; label: string }[]>(options: T, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("es-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

function whatsappPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? `1${digits}` : digits;
}

function leadsPageHref(
  page: number,
  status: string | undefined,
  priority: string | undefined,
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/coach/leads${query ? `?${query}` : ""}`;
}

function leadFitScore(lead: CoachInquirySummary) {
  const statusScore: Record<string, number> = {
    new: 8,
    contacted: 15,
    qualified: 25,
    booked: 32,
    won: 38,
    nurture: 12,
    lost: 0,
  };
  const priorityScore: Record<string, number> = { low: 2, normal: 8, high: 16 };
  let score = 28 + (statusScore[lead.status] ?? 0) + (priorityScore[lead.priority] ?? 0);

  if (lead.phone) score += 6;
  if (lead.answers) {
    if (lead.answers.goal === "stage") score += 10;
    if (lead.answers.goal === "recomp") score += 6;
    if (Number(lead.answers.sessions) >= 4) score += 8;
    if (lead.answers.place !== "online") score += 4;
    if (lead.answers.schedule === "flexible") score += 4;
  }

  return Math.min(100, score);
}

export default async function CoachLeadsPage({ searchParams }: CoachLeadsPageProps) {
  const [params, brand] = await Promise.all([
    searchParams,
    getSelectedMemberAppBrand(),
  ]);
  // Keep the authorization adjacent to the service-role read. A parent layout
  // is UI composition, not the data boundary for an RSC navigation.
  await requireWorkspaceMutationAccess(brand.id);
  const requestedStatus = params?.status ?? "";
  const requestedPriority = params?.priority ?? "";
  const statusFilter = statusOptions.find((option) => option.value === requestedStatus)?.value;
  const priorityFilter = priorityOptions.find((option) => option.value === requestedPriority)?.value;
  const rawPage = Number(params?.page ?? "1");
  const currentPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 2_000) : 1;
  const pageSize = 50;
  const pageRows = await listCoachInquiries(brand.id, {
    limit: pageSize + 1,
    offset: (currentPage - 1) * pageSize,
    status: statusFilter,
    priority: priorityFilter,
  });
  const hasNextPage = pageRows.length > pageSize;
  const leads = pageRows.slice(0, pageSize);
  const today = new Date().toISOString().slice(0, 10);
  const openStatuses = new Set(["new", "contacted", "qualified", "booked", "nurture"]);
  const overdue = leads.filter((lead) => (
    openStatuses.has(lead.status)
    && Boolean(lead.nextActionAt)
    && lead.nextActionAt.slice(0, 10) <= today
  )).length;
  const pipelineStages = pipelineStatuses.map((status) => ({
    status,
    label: optionLabel(statusOptions, status),
    count: leads.filter((lead) => lead.status === status).length,
  }));
  const publicSiteUrl = brand.publicDomain ? `https://${brand.publicDomain}` : "";

  return (
    <>
      <Topbar
        eyebrow="Leads"
        title="Convierte diagnósticos en clientes."
        text={`Cada solicitud de ${brand.name} llega aquí con objetivo, zona, disponibilidad y siguiente acción comercial. Página ${currentPage}.`}
        actions={publicSiteUrl ? (
          <a className="btn" href={publicSiteUrl} rel="noreferrer" target="_blank">
            Ver web pública <ExternalLink size={16} />
          </a>
        ) : null}
      />

      <section className="grid">
        <article className="card span3">
          <p className="metric">Nuevos visibles<strong>{leads.filter((lead) => lead.status === "new").length}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Acción visible<strong>{overdue}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Llamadas visibles<strong>{leads.filter((lead) => lead.status === "booked").length}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Clientes visibles<strong>{leads.filter((lead) => lead.status === "won").length}</strong></p>
        </article>

        <article className="card span12 pipelineCard">
          <div className="sectionHeader">
            <div>
              <Radar color="var(--gold)" aria-hidden="true" />
              <h2>Pipeline de esta página</h2>
              <p>Abre una etapa para cargar sus oportunidades y avanzar una página cada vez.</p>
            </div>
            <span className="tag">{leads.length} solicitudes</span>
          </div>
          <div className="leadPipeline">
            {pipelineStages.map((stage) => (
              <a className="pipelineStage" href={leadsPageHref(1, stage.status, priorityFilter)} key={stage.status}>
                <span>{stage.label}</span>
                <strong>{stage.count}</strong>
                <small>{leads.length ? Math.round((stage.count / leads.length) * 100) : 0}% de esta página</small>
              </a>
            ))}
          </div>
        </article>

        <article className="card span12">
          <form action="/coach/leads" className="leadFilters" method="get">
            <label>
              Estado
              <select defaultValue={statusFilter ?? ""} name="status">
                <option value="">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridad
              <select defaultValue={priorityFilter ?? ""} name="priority">
                <option value="">Todas</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn primary" type="submit">Filtrar</button>
              <a className="btn" href="/coach/leads">Limpiar</a>
            </div>
          </form>
        </article>

        {leads.map((lead) => {
          const fitScore = leadFitScore(lead);
          const phoneDigits = whatsappPhone(lead.phone);
          const locale = lead.locale === "en" ? "en" : "es";
          return (
            <article className="card span4 leadCard" key={lead.id}>
              <div className="leadCardHead">
                <div className="scoreRing" style={{ "--score": `${fitScore}%` } as CSSProperties}>
                  <strong>{fitScore}</strong>
                  <span>fit</span>
                </div>
                <div className="leadCardTitle">
                  <h2>{lead.fullName}</h2>
                  <p>{optionLabel(statusOptions, lead.status)} · {formatDate(lead.createdAt)}</p>
                </div>
                <span className={lead.priority === "high" ? "tag danger" : "tag"}>
                  {optionLabel(priorityOptions, lead.priority)}
                </span>
              </div>

              <ul className="list leadFacts">
                <li className="row">Origen <span>{lead.attribution.utmCampaign || lead.source || "Directo"}</span></li>
                {lead.answers ? (
                  <>
                    <li className="row">Objetivo <strong>{diagnosticAnswerLabel("goal", lead.answers.goal, locale)}</strong></li>
                    <li className="row">Modalidad <span>{diagnosticAnswerLabel("place", lead.answers.place, locale)}</span></li>
                    <li className="row">Zona <span>{diagnosticAnswerLabel("area", lead.answers.place === "online" ? "online" : lead.answers.area, locale)}</span></li>
                    <li className="row">Frecuencia <span>{diagnosticAnswerLabel("sessions", lead.answers.sessions, locale)}</span></li>
                    <li className="row">Horario <span>{diagnosticAnswerLabel("schedule", lead.answers.schedule, locale)}</span></li>
                    <li className="row">Bloqueo <span>{diagnosticAnswerLabel("obstacle", lead.answers.obstacle, locale)}</span></li>
                  </>
                ) : (
                  <li className="row">Tipo <span>{lead.kind === "coaching" ? "Coaching" : "Contacto"}</span></li>
                )}
                {lead.nextActionAt ? (
                  <li className="row"><CalendarClock size={14} /> Próxima acción <strong>{formatDate(lead.nextActionAt)}</strong></li>
                ) : null}
              </ul>

              {lead.message ? <p className="sessionCoachNotes">{lead.message}</p> : null}

              <div className="contactStack leadContact">
                <a href={`mailto:${lead.email}`}><Mail size={14} /> {lead.email}</a>
                {lead.phone ? <a href={`tel:${lead.phone}`}><Phone size={14} /> {lead.phone}</a> : null}
                {phoneDigits ? (
                  <a href={`https://wa.me/${phoneDigits}`} rel="noreferrer" target="_blank">
                    <MessageCircle size={14} /> Abrir WhatsApp
                  </a>
                ) : null}
              </div>

              <details className="editDetails">
                <summary><Save size={14} /> Gestionar lead</summary>
                <form action={updateCoachInquiryAction} className="leadControlGrid">
                  <input name="workspaceId" type="hidden" value={brand.id} />
                  <input name="inquiryId" type="hidden" value={lead.id} />
                  <label>
                    Estado
                    <select defaultValue={lead.status} name="status">
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Prioridad
                    <select defaultValue={lead.priority} name="priority">
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Próxima acción
                    <input defaultValue={lead.nextActionAt.slice(0, 10)} name="nextActionDate" type="date" />
                  </label>
                  <label className="spanFull">
                    Cualificación y siguiente paso
                    <textarea
                      defaultValue={lead.qualificationNotes}
                      maxLength={2000}
                      name="qualificationNotes"
                      placeholder="Qué necesita, objeciones, disponibilidad y qué acordaste hacer después..."
                      rows={4}
                    />
                  </label>
                  <SubmitButton className="spanFull" successToast="Lead actualizado" variant="primary">
                    Guardar cambios <Save size={16} />
                  </SubmitButton>
                </form>
              </details>
            </article>
          );
        })}

        {leads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={!statusFilter && !priorityFilter && currentPage === 1 ? "Todavía no hay solicitudes." : "No hay leads en esta página."}
            text={!statusFilter && !priorityFilter && currentPage === 1
              ? "Cuando alguien termine el diagnóstico de la web aparecerá aquí listo para contactar."
              : "Prueba con otro estado, prioridad o vuelve a la página anterior."}
          />
        ) : null}

        {currentPage > 1 || hasNextPage ? (
          <article className="card span12">
            <div className="formActions">
              {currentPage > 1 ? (
                <a className="btn" href={leadsPageHref(currentPage - 1, statusFilter, priorityFilter)}>← Página anterior</a>
              ) : null}
              <span className="tag">Página {currentPage} · hasta {pageSize} leads</span>
              {hasNextPage ? (
                <a className="btn primary" href={leadsPageHref(currentPage + 1, statusFilter, priorityFilter)}>Página siguiente →</a>
              ) : null}
            </div>
          </article>
        ) : null}
      </section>
    </>
  );
}
