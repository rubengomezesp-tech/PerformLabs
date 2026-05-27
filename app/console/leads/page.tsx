import { ArrowRight, CheckCircle2, ClipboardList, Mail, MessageSquareText, Phone, Plus, Radar, Save, Sparkles, UserRound } from "lucide-react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { listImplementationTemplates } from "@/lib/repositories/implementation-projects";
import { listSalesLeads } from "@/lib/repositories/sales-leads";
import { addLeadNoteAction, convertLeadToProjectAction, createLeadAction, updateLeadAction } from "./actions";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; priority?: string }>;
};

const goalLabels: Record<string, string> = {
  launch: "Lanzar primera app",
  upgrade: "Mejorar sistema actual",
  scale: "Escalar clientes y equipo",
  brand: "Elevar marca",
};

const statusOptions = [
  ["new", "Nuevo"],
  ["contacted", "Contactado"],
  ["qualified", "Cualificado"],
  ["lost", "Perdido"],
  ["won", "Ganado"],
];

const priorityOptions = [
  ["low", "Baja"],
  ["normal", "Normal"],
  ["high", "Alta"],
];

function getLeadScore(lead: Awaited<ReturnType<typeof listSalesLeads>>[number]) {
  const statusScore: Record<string, number> = {
    new: 16,
    contacted: 34,
    qualified: 62,
    won: 86,
    lost: 8,
  };
  const priorityScore: Record<string, number> = {
    low: 4,
    normal: 10,
    high: 22,
  };

  return Math.min(
    100,
    (statusScore[lead.status] ?? 18)
      + (priorityScore[lead.priority] ?? 10)
      + (lead.assignedAgent ? 10 : 0)
      + (lead.monthlyClients ? 6 : 0)
      + (lead.notes ? 6 : 0)
      + (lead.noteCount ? 8 : 0),
  );
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const [leads, templates] = await Promise.all([
    listSalesLeads(),
    listImplementationTemplates(),
  ]);
  const query = params?.q?.trim().toLowerCase() ?? "";
  const statusFilter = params?.status ?? "";
  const priorityFilter = params?.priority ?? "";
  const filteredLeads = leads.filter((lead) => {
    const matchesQuery = query
      ? [lead.fullName, lead.email, lead.brandName, lead.notes].some((value) => value.toLowerCase().includes(query))
      : true;
    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesPriority = priorityFilter ? lead.priority === priorityFilter : true;

    return matchesQuery && matchesStatus && matchesPriority;
  });
  const activeTemplates = templates.filter((template) => template.isActive);
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const withAgent = leads.filter((lead) => lead.assignedAgent).length;
  const converted = leads.filter((lead) => lead.projectId).length;
  const pipelineStages = statusOptions.map(([value, label]) => ({
    value,
    label,
    count: leads.filter((lead) => lead.status === value).length,
  }));

  return (
    <>
      <Topbar
        eyebrow="Leads"
        title="CRM de consultas comerciales."
        text="Asignamos agente, cualificamos cada oportunidad y convertimos los leads viables en proyectos de implantación."
      />
      <section className="grid">
        <article className="card span8 intakePanel">
          <div className="sectionHeader">
            <div>
              <Sparkles color="var(--gold)" />
              <h2>Intake de nueva implantación</h2>
              <p>Registra una consulta de llamada, DM o email y deja preparado el primer diagnóstico comercial.</p>
            </div>
            <span className="tag">Nuevo lead</span>
          </div>
          <form action={createLeadAction} className="intakeForm">
            <label>
              Nombre del entrenador
              <input name="fullName" placeholder="Ej. Laura Martinez" required />
            </label>
            <label>
              Email
              <input name="email" placeholder="laura@email.com" required type="email" />
            </label>
            <label>
              Marca o proyecto
              <input name="brandName" placeholder="Ej. Laura Performance" />
            </label>
            <label>
              Teléfono
              <input name="phone" placeholder="+34..." />
            </label>
            <label>
              Web actual
              <input name="websiteUrl" placeholder="dominio actual o Instagram" />
            </label>
            <label>
              Clientes actuales
              <input name="monthlyClients" placeholder="Ej. 25 online / 80 presenciales" />
            </label>
            <label>
              Objetivo principal
              <select name="mainGoal" defaultValue="launch">
                {Object.entries(goalLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="spanFull">
              Resumen de la oportunidad
              <textarea name="notes" placeholder="Qué quiere vender, urgencia, objeciones, estilo de marca y próximos pasos..." rows={4} />
            </label>
            <button className="btn primary" type="submit">
              Crear consulta <Plus size={16} />
            </button>
          </form>
        </article>

        <article className="card span4 processPanel">
          <Radar color="var(--gold)" />
          <h2>Ruta de conversión</h2>
          <p>La consola debe forzar claridad: contacto rápido, diagnóstico, propuesta y proyecto creado.</p>
          <div className="processSteps">
            {["Responder", "Cualificar", "Proponer", "Convertir"].map((step, index) => (
              <span key={step}>
                <CheckCircle2 size={16} />
                <strong>{index + 1}. {step}</strong>
              </span>
            ))}
          </div>
        </article>

        <article className="card span12 pipelineCard">
          <div className="sectionHeader">
            <div>
              <ClipboardList color="var(--gold)" />
              <h2>Pipeline comercial</h2>
              <p>Visión rápida para saber dónde está cada oportunidad antes de pasar a producción.</p>
            </div>
          </div>
          <div className="leadPipeline">
            {pipelineStages.map((stage) => (
              <a className="pipelineStage" href={`/console/leads?status=${stage.value}`} key={stage.value}>
                <span>{stage.label}</span>
                <strong>{stage.count}</strong>
                <small>{leads.length ? Math.round((stage.count / leads.length) * 100) : 0}% del total</small>
              </a>
            ))}
          </div>
        </article>

        <article className="card span3">
          <p className="metric">Nuevas<strong>{newLeads}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Con agente<strong>{withAgent}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Convertidas<strong>{converted}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Total<strong>{leads.length}</strong></p>
        </article>

        <article className="card span12">
          <form action="/console/leads" className="leadFilters" method="get">
            <label>
              Buscar
              <input name="q" defaultValue={params?.q ?? ""} placeholder="Nombre, email, marca o nota" />
            </label>
            <label>
              Estado
              <select name="status" defaultValue={statusFilter}>
                <option value="">Todos</option>
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridad
              <select name="priority" defaultValue={priorityFilter}>
                <option value="">Todas</option>
                {priorityOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn primary" type="submit">Filtrar</button>
              <a className="btn" href="/console/leads">Limpiar</a>
            </div>
          </form>
        </article>

        {filteredLeads.map((lead) => (
          <article className="card span6 leadCard" key={lead.id}>
            <div className="sectionHeader">
              <div>
                <UserRound color="var(--gold)" />
                <h2>{lead.fullName}</h2>
                <p>{lead.brandName || "Marca sin definir"}</p>
              </div>
              <span className={lead.priority === "high" ? "tag danger" : "tag"}>
                {lead.priority}
              </span>
            </div>

            <div className="leadQuality">
              <div className="scoreRing" style={{ "--score": `${getLeadScore(lead)}%` } as CSSProperties}>
                <strong>{getLeadScore(lead)}</strong>
                <span>fit</span>
              </div>
              <div>
                <span className="eyebrow">Diagnóstico comercial</span>
                <p>
                  {lead.projectId
                    ? "Proyecto creado. Mantén actualizado el briefing y la fecha objetivo."
                    : lead.status === "new"
                      ? "Responder rápido, confirmar objetivo y agendar siguiente paso."
                      : "Cualificar alcance, urgencia, marca y contenido antes de convertir."}
                </p>
              </div>
            </div>

            <ul className="list">
              <li className="row">Objetivo <span>{goalLabels[lead.mainGoal] ?? (lead.mainGoal || "Pendiente")}</span></li>
              <li className="row">Clientes actuales <span>{lead.monthlyClients || "Pendiente"}</span></li>
              <li className="row">Estado <span className="tag">{lead.status}</span></li>
              <li className="row">Agente <span>{lead.assignedAgent || "Sin asignar"}</span></li>
              <li className="row">Notas <strong>{lead.noteCount}</strong></li>
            </ul>

            <div className="contactStack leadContact">
              <a href={`mailto:${lead.email}`}><Mail size={14} /> {lead.email}</a>
              {lead.phone ? <span><Phone size={14} /> {lead.phone}</span> : null}
            </div>

            <form action={updateLeadAction} className="leadControlGrid">
              <input name="id" type="hidden" value={lead.id} />
              <label>
                Estado
                <select name="status" defaultValue={lead.status}>
                  {statusOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Prioridad
                <select name="priority" defaultValue={lead.priority}>
                  {priorityOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Agente asignado
                <input name="assignedAgent" defaultValue={lead.assignedAgent} placeholder="Ruben, Marina, Equipo..." />
              </label>
              <label>
                Próxima acción
                <input name="nextActionAt" type="datetime-local" />
              </label>
              <label className="spanFull">
                Cualificación
                <textarea name="qualificationNotes" defaultValue={lead.notes} rows={3} />
              </label>
              <button className="btn" type="submit">
                Guardar lead <Save size={16} />
              </button>
            </form>

            <form action={addLeadNoteAction} className="leadNoteForm">
              <input name="leadId" type="hidden" value={lead.id} />
              <input name="authorName" type="hidden" value="Equipo" />
              <label>
                Nota interna
                <textarea name="note" placeholder="Resumen de llamada, objeciones, presupuesto, urgencia..." rows={3} />
              </label>
              {lead.latestNote ? (
                <p className="muted"><MessageSquareText size={14} /> Última nota: {lead.latestNote}</p>
              ) : null}
              <button className="btn" type="submit">
                Añadir nota <MessageSquareText size={16} />
              </button>
            </form>

            <form action={convertLeadToProjectAction} className="convertForm">
              <input name="leadId" type="hidden" value={lead.id} />
              {activeTemplates.length ? (
                <label>
                  Plantilla de entrega
                  <select name="templateId" defaultValue={activeTemplates[0]?.id}>
                    {activeTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button className="btn primary" disabled={Boolean(lead.projectId)} type="submit">
                {lead.projectId ? "Proyecto creado" : "Convertir en proyecto"}
                <ArrowRight size={16} />
              </button>
            </form>
          </article>
        ))}

        {filteredLeads.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={leads.length === 0 ? "Todavía no hay consultas comerciales." : "No hay leads con esos filtros."}
            text={leads.length === 0 ? "Cuando alguien complete el formulario de la landing aparecerá aquí con estado, prioridad y siguiente acción." : "Prueba con otro estado, prioridad o búsqueda para revisar la cola comercial."}
          />
        ) : null}
      </section>
    </>
  );
}
