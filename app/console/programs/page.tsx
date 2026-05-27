import { Dumbbell, Plus, Save } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { listManagedExercises, listManagedWorkoutTemplates } from "@/lib/repositories/training-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { createWorkoutDayAction, createWorkoutExerciseAction, createWorkoutTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

type ProgramsPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [templates, exercises] = await Promise.all([
    listManagedWorkoutTemplates(selectedWorkspace?.id),
    listManagedExercises(selectedWorkspace?.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Builder de entrenamiento"
        title="Rutinas editables por cliente o plantilla."
        text="Crea semanas, días, notas de sesión y luego conectaremos ejercicios, series, reps, descansos y sustituciones."
        actions={<a className="btn primary" href="#nueva-rutina">Nueva rutina <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/programs" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver rutinas</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <article className="card span12" id="nueva-rutina">
            <h2>Nueva rutina</h2>
            <form action={createWorkoutTemplateAction} className="formGrid">
              <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
              <label>
                Nombre
                <input name="name" placeholder="Hipertrofia 12 semanas" required />
              </label>
              <label>
                Objetivo
                <input name="goal" placeholder="Volumen, definición, fuerza..." />
              </label>
              <label>
                Nivel
                <select name="level" defaultValue="intermediate">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label>
                Días/semana
                <input name="daysPerWeek" defaultValue="3" min="1" max="7" type="number" />
              </label>
              <div className="formActions">
                <button className="btn primary" type="submit">
                  Crear rutina <Save size={18} />
                </button>
              </div>
            </form>
          </article>
        ) : null}

        {templates.map((template) => (
          <article className="card span6" key={template.id}>
            <div className="sectionHeader">
              <div>
                <Dumbbell color="var(--gold)" />
                <h2>{template.name}</h2>
                <p>{template.goal || "Objetivo pendiente"} · {template.level || "Nivel pendiente"}</p>
              </div>
              <span className="tag">{statusLabels[template.status] ?? template.status}</span>
            </div>
            <ul className="list">
              <li className="row">Días por semana <strong>{template.daysPerWeek}</strong></li>
              <li className="row">Días creados <strong>{template.days.length}</strong></li>
            </ul>
            <div className="taskList" style={{ marginTop: 12 }}>
              {template.days.map((day) => (
                <article className="taskItem workoutDayItem" key={day.id}>
                  <div>
                    <strong>Semana {day.weekNumber} · Día {day.dayNumber}</strong>
                    <p>{day.title}</p>
                    {day.notes ? <p>{day.notes}</p> : null}
                    {day.exercises.length ? (
                      <ul className="list workoutExerciseList">
                        {day.exercises.map((exercise) => (
                          <li className="row" key={exercise.id}>
                            {exercise.exerciseName}
                            <span className="tag">{exercise.sets ?? "-"}x{exercise.reps || "?"} · {exercise.restSeconds ?? "-"}s</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <form action={createWorkoutExerciseAction} className="workoutExerciseForm">
                      <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
                      <input name="dayId" type="hidden" value={day.id} />
                      <label>
                        Ejercicio
                        <select name="exerciseId" defaultValue="">
                          <option value="">Selecciona</option>
                          {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Series
                        <input name="sets" defaultValue="3" type="number" />
                      </label>
                      <label>
                        Reps
                        <input name="reps" defaultValue="8-12" />
                      </label>
                      <label>
                        Descanso
                        <input name="restSeconds" defaultValue="90" type="number" />
                      </label>
                      <label className="spanFull">
                        Notas
                        <input name="notes" placeholder="Tempo, RIR, técnica..." />
                      </label>
                      <button className="btn" type="submit">Añadir ejercicio</button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
            <form action={createWorkoutDayAction} className="addTaskForm workoutDayForm">
              <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
              <input name="templateId" type="hidden" value={template.id} />
              <label>
                Semana
                <input name="weekNumber" defaultValue="1" min="1" type="number" />
              </label>
              <label>
                Día
                <input name="dayNumber" defaultValue={String(template.days.length + 1)} min="1" type="number" />
              </label>
              <label>
                Título
                <input name="title" placeholder="Push hipertrofia" required />
              </label>
              <label className="spanFull">
                Notas
                <textarea name="notes" rows={2} placeholder="Foco, intensidad, ejercicios pendientes de añadir..." />
              </label>
              <button className="btn" type="submit">Añadir día <Plus size={16} /></button>
            </form>
          </article>
        ))}

        {selectedWorkspace && templates.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Esta marca todavía no tiene rutinas."
            text="Crea una primera plantilla de entrenamiento para convertirla después en planes asignables a clientes."
          />
        ) : null}
      </section>
    </>
  );
}
