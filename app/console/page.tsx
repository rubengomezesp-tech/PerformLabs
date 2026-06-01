import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CheckCircle2, ClipboardCheck, Plus, Rocket, Sparkles } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { modules } from "@/lib/data";
import { listImplementationProjects } from "@/lib/repositories/implementation-projects";
import { getPlatformMetrics } from "@/lib/repositories/platform-metrics";
import { listSalesLeads } from "@/lib/repositories/sales-leads";

export const dynamic = "force-dynamic";

export default async function ConsoleHome() {
  const [{ metrics, queue }, leads, projects] = await Promise.all([
    getPlatformMetrics(),
    listSalesLeads(),
    listImplementationProjects(),
  ]);
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const qualifiedLeads = leads.filter((lead) => lead.status === "qualified").length;
  const activeProjects = projects.filter((project) => !["launched", "paused"].includes(project.status));
  const launchReadyProjects = projects.filter((project) => ["review", "launch_ready"].includes(project.status)).length;
  const pendingTasks = activeProjects.reduce(
    (total, project) => total + project.tasks.filter((task) => task.status !== "done").length,
    0,
  );
  const averageProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((total, project) => (
        total + (project.totalTasks ? (project.doneTasks / project.totalTasks) * 100 : 0)
      ), 0) / activeProjects.length)
    : 0;
  const deliveryStages = [
    { label: "Consulta", value: newLeads, detail: "Entrada comercial" },
    { label: "Cualificación", value: qualifiedLeads, detail: "Listo para propuesta" },
    { label: "Implantación", value: activeProjects.length, detail: "En producción interna" },
    { label: "Revisión", value: launchReadyProjects, detail: "Validación final" },
    { label: "Lanzamiento", value: projects.filter((project) => project.status === "launched").length, detail: "Apps activas" },
  ];
  const blueprint = [
    ["1", "Briefing", "Oferta, audiencia, método, dominio y expectativas."],
    ["2", "Marca", "Logo, colores, tono visual, pantalla inicial y app name."],
    ["3", "Estructura", "Módulos, navegación, permisos, productos y soporte."],
    ["4", "Contenido", "Entrenos, ejercicios, dietas, guías y mensajes base."],
    ["5", "Validación", "Pruebas de cliente, revisión mobile y checklist de salida."],
    ["6", "Lanzamiento", "Entrega operativa, seguimiento y mejora continua."],
  ];

  return (
    <>
      <Topbar
        eyebrow="Dashboard"
        title="Coordina implantaciones premium para entrenadores."
        text="Nuestro equipo acompaña al cliente, recoge requisitos y prepara dominio, logo, branding, clientes, entrenamientos, nutrición, pagos y contenido."
        actions={
          <>
            <Link className="btn" href="/console/projects">Ver proyectos <ClipboardCheck size={18} /></Link>
            <Link className="btn primary" href="/console/leads">Nueva implantación <Plus size={18} /></Link>
          </>
        }
      />

      <section className="grid">
        <article className="card span12 commandHero">
          <div>
            <span className="eyebrow">Centro de mando</span>
            <h2>Del primer mensaje a una app lista para operar.</h2>
            <p>
              La consola organiza ventas, requisitos, producción, contenido y lanzamiento en un flujo que el equipo puede ejecutar sin perder contexto.
            </p>
          </div>
          <div className="actions">
            <a className="btn primary" href="/console/leads">
              Crear intake <ArrowRight size={18} />
            </a>
            <a className="btn" href="/console/templates">
              Ajustar plantillas
            </a>
          </div>
        </article>

        <article className="card span4">
          <p className="metric">Progreso medio<strong>{averageProgress}%</strong></p>
        </article>
        <article className="card span4">
          <p className="metric">Tareas abiertas<strong>{pendingTasks}</strong></p>
        </article>
        <article className="card span4">
          <p className="metric">En revisión<strong>{launchReadyProjects}</strong></p>
        </article>

        <article className="card span12 deliveryStageCard">
          <div className="sectionHeader">
            <div>
              <Rocket color="var(--gold)" />
              <h2>Pipeline de implantación</h2>
              <p>Cada columna marca el estado real del negocio: captación, decisión, producción y salida.</p>
            </div>
            <span className="tag">{activeProjects.length} activos</span>
          </div>
          <div className="stageRail">
            {deliveryStages.map((stage, index) => (
              <div className="stageNode" key={stage.label}>
                <span>{index + 1}</span>
                <strong>{stage.label}</strong>
                <b>{stage.value}</b>
                <small>{stage.detail}</small>
              </div>
            ))}
          </div>
        </article>

        {metrics.map((metric) => (
          <article className="card span3" key={metric.label}>
            <span className="metric">
              {metric.label}
              <strong>{metric.value}</strong>
            </span>
            <p>{metric.detail}</p>
          </article>
        ))}

        <article className="card span7 focusPanel">
          <div className="sectionHeader">
            <div>
              <BriefcaseBusiness color="var(--gold)" />
              <h2>Prioridad del equipo</h2>
              <p>Lo que necesita movimiento para que ninguna implantación pierda ritmo.</p>
            </div>
          </div>
          {queue.length ? (
            <ul className="list">
              {queue.map((item) => (
                <li className="row" key={`${item.title}-${item.detail}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span className="tag">{item.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="inlineEmpty">
              <Plus color="var(--gold)" />
              <h3>No hay proyectos en cola.</h3>
              <p>Convierte un lead en proyecto para empezar la implantación guiada.</p>
              <a className="btn primary" href="/console/leads">Ir a leads</a>
            </div>
          )}
        </article>

        <article className="card span5 blueprintPanel">
          <div className="sectionHeader">
            <div>
              <Sparkles color="var(--gold)" />
              <h2>Blueprint de entrega</h2>
              <p>El proceso estándar que vendemos y ejecutamos como equipo.</p>
            </div>
          </div>
          <div className="blueprintList">
            {blueprint.map(([step, title, text]) => (
              <div className="blueprintStep" key={title}>
                <span>{step}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <CalendarCheck color="var(--gold)" />
              <h2>Capacidades incluidas</h2>
              <p>Bloques del producto que se reutilizan y se personalizan para cada marca.</p>
            </div>
          </div>
          <ul className="list">
            {modules.slice(0, 6).map((module) => (
              <li className="row" key={module.title}>
                <div>
                  <strong>{module.title}</strong>
                  <p>{module.text}</p>
                </div>
                <span className="tag"><CheckCircle2 size={13} /> {module.state}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
