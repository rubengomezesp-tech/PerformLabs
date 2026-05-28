import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Mail, Plus, Rocket, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { listImplementationProjects } from "@/lib/repositories/implementation-projects";
import { addProjectTaskAction, updateProjectAction, updateProjectTaskAction } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  discovery: "Descubrimiento",
  brand_setup: "Marca",
  content_setup: "Contenido",
  review: "Revisión",
  launch_ready: "Listo para lanzar",
  launched: "Lanzado",
  paused: "Pausado",
};

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

function getProjectProgress(project: Awaited<ReturnType<typeof listImplementationProjects>>[number]) {
  return project.totalTasks ? Math.round((project.doneTasks / project.totalTasks) * 100) : 0;
}

export default async function ProjectsPage() {
  const projects = await listImplementationProjects();
  const active = projects.filter((project) => !["launched", "paused"].includes(project.status)).length;
  const launched = projects.filter((project) => project.status === "launched").length;
  const pendingTasks = projects.reduce((total, project) => total + project.tasks.filter((task) => task.status !== "done").length, 0);
  const stageColumns = statusOptions.map(([value, label]) => ({
    value,
    label,
    projects: projects.filter((project) => project.status === value),
  }));
  const nextLaunch = projects
    .filter((project) => project.launchTargetDate && project.status !== "launched")
    .sort((left, right) => left.launchTargetDate.localeCompare(right.launchTargetDate))[0];

  return (
    <>
      <Topbar
        eyebrow="Proyectos"
        title="Implantaciones en marcha."
        text="Cada proyecto nace desde un lead cualificado y avanza con checklist: requisitos, marca, dominio, contenido, pagos y lanzamiento."
      />
      <section className="grid">
        <article className="card span3">
          <p className="metric">Activos<strong>{active}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Lanzados<strong>{launched}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Tareas abiertas<strong>{pendingTasks}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Total<strong>{projects.length}</strong></p>
        </article>

        <article className="card span12 deliveryBoard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Tablero de producción</h2>
              <p>Estado real de cada implantación: quién la lleva, cuánto avanza y qué fecha estamos defendiendo.</p>
            </div>
            <div className="deliveryBoardSummary">
              <span>
                Próximo lanzamiento
                <strong>{nextLaunch?.launchTargetDate || "Sin fecha"}</strong>
              </span>
              <span>
                Proyectos activos
                <strong>{active}</strong>
              </span>
            </div>
          </div>
          <div className="projectPipelineBoard">
            {stageColumns.map((column) => (
              <section className="pipelineColumn" key={column.value}>
                <header>
                  <span>{column.label}</span>
                  <strong>{column.projects.length}</strong>
                </header>
                <div className="pipelineColumnBody">
                  {column.projects.slice(0, 3).map((project) => {
                    const progress = getProjectProgress(project);

                    return (
                      <Link className="pipelineProject" href={`/console/projects/${project.id}`} key={project.id}>
                        <span>{project.clientName}</span>
                        <strong>{project.projectName}</strong>
                        <small>{project.launchTargetDate || "Fecha pendiente"}</small>
                        <div className="progressTrack">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                  {column.projects.length === 0 ? <p className="pipelineEmpty">Sin proyectos</p> : null}
                  {column.projects.length > 3 ? <p className="pipelineMore">+{column.projects.length - 3} más</p> : null}
                </div>
              </section>
            ))}
          </div>
        </article>

        {projects.map((project) => {
          const progress = getProjectProgress(project);
          const tasksByPhase = project.tasks.reduce<Record<string, typeof project.tasks>>((groups, task) => {
            groups[task.phase] = groups[task.phase] ?? [];
            groups[task.phase].push(task);
            return groups;
          }, {});

          return (
            <article className="card span12 projectCard" key={project.id}>
              <div className="sectionHeader">
                <div>
                  <Rocket color="var(--gold)" />
                  <h2>{project.projectName}</h2>
                  <p>{statusLabels[project.status] ?? project.status}</p>
                </div>
                <div className="actions">
                  <span className="tag">{progress}%</span>
                  <Link className="btn" href={`/console/projects/${project.id}`}>
                    Abrir briefing <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <ul className="list">
                <li className="row"><UserRound size={16} /> Cliente <strong>{project.clientName}</strong></li>
                <li className="row"><Mail size={16} /> Email <span>{project.clientEmail}</span></li>
                <li className="row">Agente <span>{project.assignedAgent || "Sin asignar"}</span></li>
                <li className="row"><CalendarDays size={16} /> Fecha objetivo <span>{project.launchTargetDate || "Sin fecha"}</span></li>
                <li className="row">App operativa <span className={project.workspaceId ? "tag" : "tag danger"}>{project.workspaceId ? "Creada" : "Pendiente"}</span></li>
                <li className="row">Checklist <strong>{project.doneTasks}/{project.totalTasks}</strong></li>
              </ul>
              <div className="progressTrack">
                <span style={{ width: `${progress}%` }} />
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
                  <input name="assignedAgent" defaultValue={project.assignedAgent} placeholder="Equipo comercial, agente asignado..." />
                </label>
                <label>
                  Fecha objetivo
                  <input name="launchTargetDate" type="date" defaultValue={project.launchTargetDate} />
                </label>
                <button className="btn" type="submit">
                  Guardar proyecto <Save size={16} />
                </button>
              </form>

              <div className="taskBoard">
                <div className="taskBoardHeader">
                  <div>
                    <ClipboardCheck color="var(--gold)" />
                    <h3>Checklist de entrega</h3>
                    <p>Cada bloque representa trabajo real que nuestro equipo coordina con el entrenador.</p>
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
                    <input name="title" placeholder="Ej. Preparar vídeos de espalda" />
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
                    Añadir tarea <Plus size={16} />
                  </button>
                </form>
              </div>
            </article>
          );
        })}

        {projects.length === 0 ? (
          <article className="card span12">
            <ClipboardCheck color="var(--gold)" />
            <h2>No hay implantaciones todavía</h2>
            <p>Convierte un lead cualificado para crear su proyecto y checklist de entrega.</p>
          </article>
        ) : null}
      </section>
    </>
  );
}
