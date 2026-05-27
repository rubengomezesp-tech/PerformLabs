import { AppWindow, CalendarDays, CheckCircle2, ChevronLeft, ClipboardCheck, CreditCard, ExternalLink, Globe2, Palette, Rocket, Save, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { baseAppBlueprint } from "@/lib/domain/app-blueprint";
import { getImplementationProjectDetail } from "@/lib/repositories/implementation-projects";
import { addProjectTaskAction, createOperationalWorkspaceAction, updateProjectAction, updateProjectBriefAction, updateProjectTaskAction } from "../actions";

export const dynamic = "force-dynamic";

const statusOptions = [
  ["discovery", "Descubrimiento"],
  ["brand_setup", "Marca"],
  ["content_setup", "Contenido"],
  ["review", "Revisión"],
  ["launch_ready", "Listo para lanzar"],
  ["launched", "Lanzado"],
  ["paused", "Pausado"],
];

const taskStatusOptions = [
  ["pending", "Pendiente"],
  ["in_progress", "En progreso"],
  ["blocked", "Bloqueada"],
  ["done", "Hecha"],
];

const domainStrategyOptions = [
  ["undecided", "Pendiente"],
  ["new_domain", "Comprar dominio nuevo"],
  ["existing_domain", "Usar dominio del cliente"],
  ["subdomain", "Usar subdominio"],
];

const logoStatusOptions = [
  ["pending", "Pendiente"],
  ["received", "Recibido"],
  ["needs_design", "Diseñar nosotros"],
  ["approved", "Aprobado"],
];

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

function toDateTimeLocal(value: string) {
  return value ? value.slice(0, 16) : "";
}

function getReadinessChecks(project: NonNullable<Awaited<ReturnType<typeof getImplementationProjectDetail>>>) {
  const domainReady = project.brief.domainStrategy !== "undecided"
    && (project.brief.domainStrategy === "new_domain" ? Boolean(project.brief.desiredDomain) : true);

  return [
    {
      label: "Nombre",
      ok: Boolean(project.brief.appName || project.projectName),
      text: project.brief.appName || project.projectName || "Pendiente",
    },
    {
      label: "Dominio",
      ok: domainReady,
      text: project.brief.desiredDomain || "Decisión pendiente",
    },
    {
      label: "Marca",
      ok: Boolean(project.brief.accentColor || project.brief.primaryColor),
      text: project.brief.logoStatus === "approved" ? "Logo aprobado" : "Puede avanzar con color base",
    },
    {
      label: "Oferta",
      ok: Boolean(project.brief.offerSummary || project.brief.pricingNotes),
      text: project.brief.offerSummary ? "Oferta definida" : "Falta concretar oferta",
    },
    {
      label: "Contenido",
      ok: Boolean(project.brief.contentNotes || project.brief.exerciseVideoNotes || project.brief.nutritionNotes),
      text: project.brief.contentNotes ? "Contenido orientado" : "Falta orientar contenido",
    },
  ];
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getImplementationProjectDetail(id);

  if (!project) {
    notFound();
  }

  const progress = project.totalTasks ? Math.round((project.doneTasks / project.totalTasks) * 100) : 0;
  const tasksByPhase = project.tasks.reduce<Record<string, typeof project.tasks>>((groups, task) => {
    groups[task.phase] = groups[task.phase] ?? [];
    groups[task.phase].push(task);
    return groups;
  }, {});
  const readinessChecks = getReadinessChecks(project);
  const readinessScore = Math.round((readinessChecks.filter((check) => check.ok).length / readinessChecks.length) * 100);

  return (
    <>
      <Topbar
        eyebrow="Briefing"
        title={project.projectName}
        text="Ficha interna de implantación: decisiones de marca, dominio, oferta, contenido y lanzamiento antes de montar la app."
        actions={
          <Link className="btn" href="/console/projects">
            <ChevronLeft size={16} /> Proyectos
          </Link>
        }
      />

      <section className="grid">
        <article className="card span3">
          <p className="metric">Progreso<strong>{progress}%</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Tareas<strong>{project.doneTasks}/{project.totalTasks}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Estado<strong>{statusOptions.find(([value]) => value === project.status)?.[1] ?? project.status}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Fecha<strong>{project.launchTargetDate || "Pendiente"}</strong></p>
        </article>

        <article className="card span12 launchCard">
          <div className="sectionHeader">
            <div>
              <AppWindow color="var(--gold)" />
              <h2>App base operativa</h2>
              <p>
                Crea la marca real a partir del briefing: ajustes, PWA, navegación, contenido inicial, producto principal y vista cliente.
              </p>
            </div>
            {project.workspaceId ? <span className="tag">Creada</span> : <span className="tag danger">Pendiente</span>}
          </div>
          <div className="readinessGrid">
            {readinessChecks.map((check) => (
              <div className={check.ok ? "readinessItem isReady" : "readinessItem"} key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.ok ? "Listo" : "Revisar"}</span>
                <p>{check.text}</p>
              </div>
            ))}
          </div>
          <div className="progressTrack">
            <span style={{ width: `${readinessScore}%` }} />
          </div>
          {project.workspaceId ? (
            <div className="actions">
              <Link className="btn primary" href="/console/apps">
                Ver en Marcas <ExternalLink size={16} />
              </Link>
              <Link className="btn" href={`/console/brand?brand=${project.workspaceId}`}>
                Configurar marca
              </Link>
              <Link className="btn" href={`/console/content?brand=${project.workspaceId}`}>
                Contenido
              </Link>
              <Link className="btn" href={`/console/programs?brand=${project.workspaceId}`}>
                Programas
              </Link>
              <Link className="btn" href={`/console/diet-templates?brand=${project.workspaceId}`}>
                Dietas
              </Link>
              <Link className="btn" href={`/app/select?brand=${project.workspaceId}`}>
                Vista cliente
              </Link>
            </div>
          ) : (
            <form action={createOperationalWorkspaceAction} className="launchForm">
              <input name="projectId" type="hidden" value={project.id} />
              <button className="btn primary" type="submit">
                Crear app operativa <Rocket size={16} />
              </button>
              <p>Primero guarda el briefing si acabas de cambiar nombre, dominio, colores u oferta.</p>
            </form>
          )}
          <div className="engineGrid compactEngineGrid">
            {baseAppBlueprint.slice(0, 3).map((module) => (
              <article className="engineTile" key={module.key}>
                <span>{module.consoleArea}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <small>{module.clientExperience}</small>
              </article>
            ))}
          </div>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Rocket color="var(--gold)" />
              <h2>Control de proyecto</h2>
              <p>Dueño interno, estado de entrega y fecha objetivo para el equipo.</p>
            </div>
          </div>
          <form action={updateProjectAction} className="projectControls">
            <input name="id" type="hidden" value={project.id} />
            <label>
              Estado del proyecto
              <select name="status" defaultValue={project.status}>
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Agente responsable
              <input name="assignedAgent" defaultValue={project.assignedAgent} placeholder="Equipo, Ruben, Marina..." />
            </label>
            <label>
              Fecha objetivo
              <input name="launchTargetDate" type="date" defaultValue={project.launchTargetDate} />
            </label>
            <button className="btn" type="submit">
              Guardar proyecto <Save size={16} />
            </button>
          </form>
        </article>

        <article className="card span12">
          <form action={updateProjectBriefAction} className="briefForm">
            <input name="projectId" type="hidden" value={project.id} />
            <section className="briefSection">
              <div className="briefTitle">
                <Palette color="var(--gold)" />
                <div>
                  <h2>Marca y experiencia</h2>
                  <p>Nombre de app, identidad visual y tono que verá el cliente final.</p>
                </div>
              </div>
              <div className="briefGrid">
                <label>
                  Nombre de la app
                  <input name="appName" defaultValue={project.brief.appName} placeholder="Ej. Elite Training Club" />
                </label>
                <label>
                  Estado del logo
                  <select name="logoStatus" defaultValue={project.brief.logoStatus}>
                    {logoStatusOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Color principal
                  <input name="primaryColor" defaultValue={project.brief.primaryColor} placeholder="#0f0f0f" />
                </label>
                <label>
                  Color acento
                  <input name="accentColor" defaultValue={project.brief.accentColor} placeholder="#d8bd6b" />
                </label>
                <label className="spanFull">
                  Notas de marca
                  <textarea name="brandNotes" defaultValue={project.brief.brandNotes} rows={4} placeholder="Referencias, estilo, tono, cosas que evitar..." />
                </label>
              </div>
            </section>

            <section className="briefSection">
              <div className="briefTitle">
                <Globe2 color="var(--gold)" />
                <div>
                  <h2>Dominio y acceso</h2>
                  <p>Decisión de URL, preparación de acceso y coordinación técnica interna.</p>
                </div>
              </div>
              <div className="briefGrid">
                <label>
                  Estrategia de dominio
                  <select name="domainStrategy" defaultValue={project.brief.domainStrategy}>
                    {domainStrategyOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Dominio deseado
                  <input name="desiredDomain" defaultValue={project.brief.desiredDomain} placeholder="entrenador.com" />
                </label>
                <label>
                  Reunión inicial
                  <input name="kickoffCallAt" type="datetime-local" defaultValue={toDateTimeLocal(project.brief.kickoffCallAt)} />
                </label>
              </div>
            </section>

            <section className="briefSection">
              <div className="briefTitle">
                <CreditCard color="var(--gold)" />
                <div>
                  <h2>Oferta y venta</h2>
                  <p>Qué va a vender el entrenador, a quién, y cómo debe quedar preparado el cobro.</p>
                </div>
              </div>
              <div className="briefGrid">
                <label className="spanFull">
                  Público objetivo
                  <textarea name="targetAudience" defaultValue={project.brief.targetAudience} rows={3} placeholder="Tipo de cliente, dolores, nivel, país, idioma..." />
                </label>
                <label className="spanFull">
                  Oferta principal
                  <textarea name="offerSummary" defaultValue={project.brief.offerSummary} rows={3} placeholder="Programa, duración, promesa, entregables..." />
                </label>
                <label>
                  Proveedor de cobro
                  <input name="paymentProvider" defaultValue={project.brief.paymentProvider} placeholder="Stripe, externo, pendiente..." />
                </label>
                <label className="spanFull">
                  Notas comerciales
                  <textarea name="pricingNotes" defaultValue={project.brief.pricingNotes} rows={3} placeholder="Planes, trials, cupones, acceso inicial..." />
                </label>
              </div>
            </section>

            <section className="briefSection">
              <div className="briefTitle">
                <Video color="var(--gold)" />
                <div>
                  <h2>Contenido base</h2>
                  <p>Material necesario para que la app no nazca vacía.</p>
                </div>
              </div>
              <div className="briefGrid">
                <label className="spanFull">
                  Estructura de contenido
                  <textarea name="contentNotes" defaultValue={project.brief.contentNotes} rows={3} placeholder="Guías, bienvenida, FAQs, onboarding, soporte..." />
                </label>
                <label className="spanFull">
                  Vídeos de ejercicios
                  <textarea name="exerciseVideoNotes" defaultValue={project.brief.exerciseVideoNotes} rows={3} placeholder="Biblioteca base, vídeos propios, pendientes por grabar..." />
                </label>
                <label className="spanFull">
                  Nutrición
                  <textarea name="nutritionNotes" defaultValue={project.brief.nutritionNotes} rows={3} placeholder="Plantillas, categorías, restricciones, estilo de dietas..." />
                </label>
              </div>
            </section>

            <section className="briefSection">
              <div className="briefTitle">
                <CalendarDays color="var(--gold)" />
                <div>
                  <h2>Lanzamiento</h2>
                  <p>Riesgos, puntos legales y preparación final antes de entregar.</p>
                </div>
              </div>
              <div className="briefGrid">
                <label className="spanFull">
                  Legal y permisos
                  <textarea name="legalNotes" defaultValue={project.brief.legalNotes} rows={3} placeholder="Textos legales, privacidad, condiciones, disclaimers..." />
                </label>
                <label className="spanFull">
                  Plan de lanzamiento
                  <textarea name="launchNotes" defaultValue={project.brief.launchNotes} rows={3} placeholder="Soft launch, primeros clientes, revisión final..." />
                </label>
                <label className="spanFull">
                  Riesgos internos
                  <textarea name="internalRisks" defaultValue={project.brief.internalRisks} rows={3} placeholder="Bloqueos, decisiones pendientes, dependencias..." />
                </label>
              </div>
            </section>

            <div className="saveBar">
              <button className="btn primary" type="submit">
                Guardar briefing <Save size={16} />
              </button>
            </div>
          </form>
        </article>

        <article className="card span12">
          <div className="taskBoard">
            <div className="taskBoardHeader">
              <div>
                <ClipboardCheck color="var(--gold)" />
                <div>
                  <h2>Checklist operativo</h2>
                  <p>Trabajo accionable por fase para llevar la implantación hasta el lanzamiento.</p>
                </div>
              </div>
            </div>

            {Object.entries(tasksByPhase).map(([phase, tasks]) => (
              <section className="phaseBlock" key={phase}>
                <span className="phaseTag">{phase}</span>
                <div className="taskList">
                  {tasks.map((task) => (
                    <form action={updateProjectTaskAction} className="taskItem" key={task.id}>
                      <input name="id" type="hidden" value={task.id} />
                      <input name="projectId" type="hidden" value={project.id} />
                      <div className="taskCopy">
                        <CheckCircle2 color={task.status === "done" ? "var(--green)" : "var(--soft)"} size={18} />
                        <div>
                          <strong>{task.title}</strong>
                          {task.description ? <p>{task.description}</p> : null}
                        </div>
                      </div>
                      <label>
                        Estado
                        <select name="status" defaultValue={task.status}>
                          {taskStatusOptions.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Fecha
                        <input name="dueDate" type="date" defaultValue={task.dueDate} />
                      </label>
                      <button className="btn iconButton" type="submit" aria-label={`Guardar ${task.title}`}>
                        <Save size={16} />
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            ))}

            <form action={addProjectTaskAction} className="addTaskForm">
              <input name="projectId" type="hidden" value={project.id} />
              <label>
                Fase
                <input name="phase" placeholder="Contenido, Diseño, Pagos..." />
              </label>
              <label>
                Nueva tarea
                <input name="title" placeholder="Ej. Crear onboarding inicial" />
              </label>
              <label>
                Fecha
                <input name="dueDate" type="date" />
              </label>
              <label className="spanFull">
                Detalle interno
                <textarea name="description" placeholder="Qué hay que pedir, preparar o validar..." rows={3} />
              </label>
              <button className="btn primary" type="submit">
                Añadir tarea
              </button>
            </form>
          </div>
        </article>
      </section>
    </>
  );
}
