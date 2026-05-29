import { Activity, Dumbbell, Gauge, Plus, Video } from "lucide-react";
import Link from "next/link";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { buildWeeklyPeriodizationTargets, estimateTrainingStress, recommendWorkoutAdjustment } from "@/lib/domain/workout-engine";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedExercises, listManagedWorkoutTemplates, listWorkoutTemplateGroupSummaries, type ManagedWorkoutTemplate } from "@/lib/repositories/training-management";
import { createCoachWorkoutBlueprintAction, createCoachWorkoutDayAction, createCoachWorkoutExerciseAction, createCoachWorkoutTemplateAction, setCoachWorkoutTemplateStatusAction, updateCoachWorkoutExerciseAction } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

const basePresets = [
  { name: "Hipertrofia 12 semanas", label: "Hipertrofia", detail: "4 días · gimnasio · intermedio", goal: "hypertrophy", level: "intermediate", location: "gym", daysPerWeek: 4, sessionMinutes: 60 },
  { name: "Pérdida de grasa 12 semanas", label: "Pérdida de grasa", detail: "4 días · gimnasio · intermedio", goal: "fat_loss", level: "intermediate", location: "gym", daysPerWeek: 4, sessionMinutes: 50 },
  { name: "Fuerza 12 semanas", label: "Fuerza", detail: "3 días · gimnasio · intermedio", goal: "strength", level: "intermediate", location: "gym", daysPerWeek: 3, sessionMinutes: 70 },
  { name: "Full-body principiante", label: "Full-body principiante", detail: "3 días · gimnasio · principiante", goal: "hypertrophy", level: "beginner", location: "gym", daysPerWeek: 3, sessionMinutes: 45 },
  { name: "En casa sin material", label: "En casa", detail: "3 días · casa · principiante", goal: "recomposition", level: "beginner", location: "home", daysPerWeek: 3, sessionMinutes: 40 },
];

type WorkoutTemplateDay = ManagedWorkoutTemplate["days"][number];

type CoachProgramsPageProps = {
  searchParams?: Promise<{ days?: string; month?: string }>;
};

const monthLabels: Record<number, { title: string; weeks: string; focus: string }> = {
  1: { title: "Mes 1 · Base técnica", weeks: "Semanas 1-4", focus: "Patrones, volumen base y adherencia." },
  2: { title: "Mes 2 · Progresión", weeks: "Semanas 5-8", focus: "Sobrecarga medible, más series efectivas y ajuste fino." },
  3: { title: "Mes 3 · Especialización", weeks: "Semanas 9-12", focus: "Bloque fuerte, consolidación, descarga y lectura de métricas." },
};

function monthForWeek(weekNumber: number) {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  return 3;
}

function groupDaysByMonth(days: WorkoutTemplateDay[]) {
  return [1, 2, 3].map((month) => ({
    month,
    ...monthLabels[month],
    days: days.filter((day) => monthForWeek(day.weekNumber) === month),
  }));
}

function groupDaysByWeek(days: WorkoutTemplateDay[]) {
  const weekNumbers = [...new Set(days.map((day) => day.weekNumber))].sort((left, right) => left - right);

  return weekNumbers.map((weekNumber) => ({
    weekNumber,
    days: days.filter((day) => day.weekNumber === weekNumber).sort((left, right) => left.dayNumber - right.dayNumber),
  }));
}

function parseDaysParam(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return [3, 4, 5, 6, 7].includes(parsed) ? parsed : null;
}

function parseMonthParam(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return [1, 2, 3].includes(parsed) ? parsed : 1;
}

export default async function CoachProgramsPage({ searchParams }: CoachProgramsPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const templateGroups = await listWorkoutTemplateGroupSummaries(brand.id);
  const requestedDays = parseDaysParam(params?.days);
  const activeDaysPerWeek = requestedDays ?? templateGroups.find((group) => group.count)?.daysPerWeek ?? 4;
  const activeMonth = parseMonthParam(params?.month);
  const [templates, exercises] = await Promise.all([
    listManagedWorkoutTemplates(brand.id, { daysPerWeek: activeDaysPerWeek }),
    listManagedExercises(brand.id),
  ]);
  const exerciseOptions = exercises.slice(0, 80);
  const activeGroup = { daysPerWeek: activeDaysPerWeek, templates };
  const activeSessions = templates.reduce((total, template) => total + template.days.length, 0);
  const activeExercises = templates.reduce(
    (total, template) => total + template.days.reduce((dayTotal, day) => dayTotal + day.exercises.length, 0),
    0,
  );
  const weeklyTargets = buildWeeklyPeriodizationTargets(12);
  const trainingStress = estimateTrainingStress({
    daysPerWeek: 4,
    sessionMinutes: 60,
    experience: "intermediate",
    goal: "hypertrophy",
  });
  const workoutAdjustment = recommendWorkoutAdjustment({
    adherenceRate: 0.86,
    painFlags: 0,
    performanceTrend: "up",
    recoveryScore: 76,
    currentVolumeSets: 68,
  });

  return (
    <>
      <Topbar
        eyebrow="Programas"
        title="Rutinas de entrenamiento."
        text="Crea y edita los planes que verá cada cliente en su app: días por semana, meses, semanas, ejercicios, series, reps, descanso, técnica y notas."
        actions={
          <>
            <Dialog
              triggerClassName="btn primary"
              trigger={<>Generar 12 semanas <Dumbbell size={18} /></>}
              title="Generar rutina de 12 semanas"
              description="Crea una estructura periodizada con ejercicios. Luego la editas a mano."
            >
              <form action={createCoachWorkoutBlueprintAction} className="editForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <label>
                  Nombre
                  <input name="name" defaultValue="Hipertrofia elite 12 semanas" required />
                </label>
                <label>
                  Objetivo
                  <select name="goal" defaultValue="hypertrophy">
                    <option value="hypertrophy">Hipertrofia</option>
                    <option value="strength">Fuerza</option>
                    <option value="fat_loss">Perdida de grasa</option>
                    <option value="recomposition">Recomposicion</option>
                    <option value="mobility">Movilidad</option>
                  </select>
                </label>
                <label>
                  Nivel
                  <select name="level" defaultValue="intermediate">
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </label>
                <label>
                  Entorno
                  <select name="location" defaultValue="gym">
                    <option value="gym">Gimnasio</option>
                    <option value="home">Casa</option>
                    <option value="outdoor">Exterior</option>
                  </select>
                </label>
                <label>
                  Días/semana
                  <input name="daysPerWeek" defaultValue="4" min="3" max="7" type="number" />
                </label>
                <label>
                  Min/sesión
                  <input name="sessionMinutes" defaultValue="60" min="35" max="120" type="number" />
                </label>
                <label className="spanFull">
                  Lesiones / límites
                  <input name="injuries" placeholder="hombro, lumbar, rodilla..." />
                </label>
                <button className="btn primary spanFull" type="submit">Generar 12 semanas + ejercicios</button>
              </form>
            </Dialog>
            <Dialog
              triggerClassName="btn"
              trigger={<>Nuevo programa <Plus size={18} /></>}
              title="Nuevo programa (vacío)"
              description="Crea una rutina desde cero y añade días y ejercicios a mano."
            >
              <form action={createCoachWorkoutTemplateAction} className="editForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
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
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </label>
                <label>
                  Días/semana
                  <input name="daysPerWeek" defaultValue="3" min="1" max="7" type="number" />
                </label>
                <button className="btn primary spanFull" type="submit">Crear programa</button>
              </form>
            </Dialog>
            <a className="btn ghost" href="#editar-rutinas">Editar rutinas <Dumbbell size={18} /></a>
          </>
        }
      />
      <section className="grid">
        <article className="card span12 coachProgramGuide motionCard">
          <div className="sectionHeader">
            <div>
              <Dumbbell color="var(--accent)" />
              <h2>Cómo crear una rutina.</h2>
              <p>Usa “Generar 12 semanas” para una base con ejercicios, o “Nuevo programa” para empezar de cero.</p>
            </div>
          </div>
          <ol className="stepper">
            <li><span>1</span><div><strong>Crear</strong><p>Genera una base de 12 semanas o crea un programa vacío.</p></div></li>
            <li><span>2</span><div><strong>Editar</strong><p>Abre semanas y días y ajusta ejercicios y prescripción.</p></div></li>
            <li><span>3</span><div><strong>Publicar</strong><p>Pasa la rutina a “Activo” cuando esté lista.</p></div></li>
            <li><span>4</span><div><strong>Asignar</strong><p>Asígnala a un miembro y la verá en su app.</p></div></li>
          </ol>
        </article>

        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <Dumbbell color="var(--accent)" />
              <h2>Plantillas base · empieza en 1 clic.</h2>
              <p>Genera un programa completo de 12 semanas por objetivo y luego ajústalo. (Necesita la librería de ejercicios cargada.)</p>
            </div>
          </div>
          <div className="basePresetGrid">
            {basePresets.map((preset) => (
              <form action={createCoachWorkoutBlueprintAction} className="basePresetCard" key={preset.name}>
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="name" type="hidden" value={preset.name} />
                <input name="goal" type="hidden" value={preset.goal} />
                <input name="level" type="hidden" value={preset.level} />
                <input name="location" type="hidden" value={preset.location} />
                <input name="daysPerWeek" type="hidden" value={String(preset.daysPerWeek)} />
                <input name="sessionMinutes" type="hidden" value={String(preset.sessionMinutes)} />
                <input name="injuries" type="hidden" value="" />
                <strong>{preset.label}</strong>
                <span>{preset.detail}</span>
                <button className="btn primary sm" type="submit">Crear programa <Plus size={15} /></button>
              </form>
            ))}
          </div>
        </article>

        <details className="card span12 trainingIntelligenceCard advancedProgramPanel">
          <summary>
            <div>
              <Gauge color="var(--gold)" />
              <span>
                <h2>Herramienta avanzada de progresión.</h2>
                <p>Úsala cuando quieras revisar carga, recuperación, semanas de descarga y ajustes del bloque.</p>
              </span>
            </div>
            <span className="tag">{trainingStress.label}</span>
          </summary>
          <div className="trainingDecisionGrid">
            <section className="moduleGroup">
              <div className="appCardHeader">
                <Activity color="var(--gold)" />
                <h3>Decisión del bloque</h3>
              </div>
              <p>{workoutAdjustment.reason}</p>
              <p className="metric">
                Volumen sugerido
                <strong>{workoutAdjustment.nextVolumeSets} sets</strong>
              </p>
              <span className="tag">{workoutAdjustment.decision} · {workoutAdjustment.volumeChangePercent}%</span>
            </section>
            <section className="moduleGroup">
              <h3>Recuperación esperada</h3>
              <p>{trainingStress.recoveryNeed}</p>
              <ul className="list compactList">
                {workoutAdjustment.actions.map((action) => (
                  <li className="row" key={action}>{action}<span className="tag">coach</span></li>
                ))}
              </ul>
            </section>
          </div>
          <div className="weeklyPeriodizationGrid">
            {weeklyTargets.map((week) => (
              <article className={week.deload ? "weekLoadCard deload" : "weekLoadCard"} key={week.week}>
                <span>Semana {week.week}</span>
                <strong>{week.phase}</strong>
                <p>{week.rirTarget} · x{week.volumeMultiplier}</p>
                <small>{week.coachCue}</small>
              </article>
            ))}
          </div>
        </details>

        <article className="card span12 coachProgramCommand" id="editar-rutinas">
          <div>
            <span className="eyebrow">Editor de rutinas</span>
            <h2>Elige lo que quieres editar.</h2>
            <p>Selecciona cuántos días entrena el cliente y el mes del bloque. Después abre una semana y ajusta ejercicios, series, reps, tempo, descanso, técnica y notas.</p>
          </div>
          <div className="coachProgramControls">
            <nav className="coachProgramTabs" aria-label="Grupos de entrenamiento">
              {templateGroups.map((group) => (
                <Link
                  className={group.daysPerWeek === activeDaysPerWeek ? "tag isActive" : "tag"}
                  href={`/coach/programs?days=${group.daysPerWeek}&month=${activeMonth}`}
                  key={group.daysPerWeek}
                >
                  {group.daysPerWeek} días · {group.count}
                </Link>
              ))}
            </nav>
            <nav className="coachProgramTabs" aria-label="Mes del bloque">
              {[1, 2, 3].map((month) => (
                <Link
                  className={month === activeMonth ? "tag isActive" : "tag"}
                  href={`/coach/programs?days=${activeDaysPerWeek}&month=${month}`}
                  key={month}
                >
                  Mes {month}
                </Link>
              ))}
            </nav>
          </div>
          <div className="coachProgramStats">
            <span>Rutinas<strong>{activeGroup.templates.length}</strong></span>
            <span>Sesiones<strong>{activeSessions}</strong></span>
            <span>Ejercicios<strong>{activeExercises}</strong></span>
          </div>
        </article>

        <div className="span12 coachProgramGroups">
          {[activeGroup].map((group) => (
            <details className="card workoutMenuPanel coachProgramGroup" key={group.daysPerWeek} open>
              <summary>
                <span>
                  <small>Rutinas disponibles</small>
                  Clientes que entrenan {group.daysPerWeek} dias/semana
                </span>
                  <strong>Mes {activeMonth}</strong>
              </summary>
              <div className="coachProgramGroupGrid">
                {group.templates.map((template) => {
                  const visibleMonthGroups = groupDaysByMonth(template.days).filter((monthGroup) => monthGroup.month === activeMonth);
                  const visibleSessions = visibleMonthGroups.reduce((total, monthGroup) => total + monthGroup.days.length, 0);

                  return (
          <article className="card motionCard" key={template.id}>
            <div className="sectionHeader">
              <div>
                <Dumbbell color="var(--gold)" />
                <h2>Plan {template.daysPerWeek} días/semana</h2>
                <p>{template.name} · {monthLabels[activeMonth].title}</p>
              </div>
              <div className="statusControls">
                <span className="tag">{statusLabels[template.status] ?? template.status}</span>
                {template.status !== "active" ? (
                  <form action={setCoachWorkoutTemplateStatusAction}>
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="templateId" type="hidden" value={template.id} />
                    <input name="status" type="hidden" value="active" />
                    <button className="btn sm" type="submit">Publicar</button>
                  </form>
                ) : (
                  <form action={setCoachWorkoutTemplateStatusAction}>
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="templateId" type="hidden" value={template.id} />
                    <input name="status" type="hidden" value="draft" />
                    <button className="btn ghost sm" type="submit">Pasar a borrador</button>
                  </form>
                )}
                {template.status !== "archived" ? (
                  <form action={setCoachWorkoutTemplateStatusAction}>
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="templateId" type="hidden" value={template.id} />
                    <input name="status" type="hidden" value="archived" />
                    <button className="btn ghost sm" type="submit">Archivar</button>
                  </form>
                ) : null}
              </div>
            </div>

            <ul className="list">
              <li className="row">Disponibilidad <strong>{template.daysPerWeek} días/semana</strong></li>
              <li className="row">Mes visible <strong>Mes {activeMonth}</strong></li>
              <li className="row">Sesiones del mes <strong>{visibleSessions}</strong></li>
            </ul>

            <div className="taskList monthlyRoutineEditor" style={{ marginTop: 12 }}>
              {visibleMonthGroups.map((monthGroup) => (
                <details className="monthRoutinePanel coachMonthPanel" key={`${template.id}-${monthGroup.month}`} open>
                  <summary>
                    <span>
                      <small>{monthGroup.weeks}</small>
                      Editando {monthGroup.title}
                    </span>
                    <b>{monthGroup.days.length} sesiones</b>
                  </summary>
                  <p>{monthGroup.focus}</p>
                  {groupDaysByWeek(monthGroup.days).map((weekGroup) => (
                    <details className="weekRoutinePanel" key={`${template.id}-${monthGroup.month}-${weekGroup.weekNumber}`}>
                      <summary>
                        <span>
                          <small>Semana {weekGroup.weekNumber}</small>
                          Abrir {weekGroup.days.length} dias de entrenamiento
                        </span>
                        <b>{weekGroup.days.reduce((total, day) => total + day.exercises.length, 0)} ejercicios</b>
                      </summary>
                      {weekGroup.days.map((day) => (
                        <article className="taskItem workoutDayItem" key={day.id}>
                          <div>
                            <strong>Día {day.dayNumber} · Semana {day.weekNumber}</strong>
                            <p>{day.title}</p>
                            {day.notes ? <p>{day.notes}</p> : null}
                            {day.exercises.length ? (
                              <ul className="list workoutExerciseList">
                                {day.exercises.map((exercise) => (
                                  <li className="workoutExerciseEditor" key={exercise.id}>
                                    <details>
                                      <summary>
                                        <span>
                                          <strong>{exercise.exerciseName}</strong>
                                          <small>
                                            {exercise.tempo ? `Tempo ${exercise.tempo}` : "Tempo libre"}
                                            {exercise.targetRir ? ` · RIR ${exercise.targetRir}` : ""}
                                            {exercise.intensityTechnique ? ` · ${exercise.intensityTechnique}` : ""}
                                          </small>
                                        </span>
                                        <b>{exercise.sets ?? "-"}x{exercise.reps || "?"} · {exercise.restSeconds ?? "-"}s</b>
                                      </summary>
                                      {exercise.notes ? <p>{exercise.notes}</p> : null}
                                      <form action={updateCoachWorkoutExerciseAction} className="workoutExerciseForm editWorkoutExerciseForm">
                                        <input name="workspaceId" type="hidden" value={brand.id} />
                                        <input name="templateExerciseId" type="hidden" value={exercise.id} />
                                        <input name="dayId" type="hidden" value={day.id} />
                                        <input name="exerciseId" type="hidden" value={exercise.exerciseId} />
                                        <div className="lockedExerciseField">
                                          <span>Ejercicio</span>
                                          <strong>{exercise.exerciseName}</strong>
                                          <small>Prescripcion editable. Para cambiar el movimiento, anade una sustitucion o usa biblioteca.</small>
                                        </div>
                                        <label>
                                          Series
                                          <input name="sets" defaultValue={String(exercise.sets ?? 3)} min="1" type="number" />
                                        </label>
                                        <label>
                                          Reps
                                          <input name="reps" defaultValue={exercise.reps || "8-12"} />
                                        </label>
                                        <label>
                                          Tempo
                                          <input name="tempo" defaultValue={exercise.tempo || "3-1-1"} placeholder="3-1-1" />
                                        </label>
                                        <label>
                                          Descanso
                                          <input name="restSeconds" defaultValue={String(exercise.restSeconds ?? 90)} min="0" type="number" />
                                        </label>
                                        <label>
                                          RIR objetivo
                                          <input name="targetRir" defaultValue={exercise.targetRir || "2"} placeholder="0-3" />
                                        </label>
                                        <label>
                                          Técnica
                                          <select name="intensityTechnique" defaultValue={exercise.intensityTechnique}>
                                            <option value="">Sin técnica avanzada</option>
                                            <option value="Dropset">Dropset</option>
                                            <option value="Rest-pause">Rest-pause</option>
                                            <option value="Superserie">Superserie</option>
                                            <option value="Myo-reps">Myo-reps</option>
                                            <option value="Top set + back off">Top set + back off</option>
                                            <option value="AMRAP controlado">AMRAP controlado</option>
                                          </select>
                                        </label>
                                        <label className="spanFull">
                                          Notas
                                          <input name="notes" defaultValue={exercise.notes} placeholder="Dropset, sustitución, técnica, molestias..." />
                                        </label>
                                        <button className="btn primary" type="submit">Guardar cambios</button>
                                      </form>
                                    </details>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="muted">Todavia no hay ejercicios en este dia.</p>
                            )}

                            <form action={createCoachWorkoutExerciseAction} className="workoutExerciseForm">
                              <input name="workspaceId" type="hidden" value={brand.id} />
                              <input name="dayId" type="hidden" value={day.id} />
                              <label>
                                Ejercicio
                                <select name="exerciseId" defaultValue="" required>
                                  <option value="">Selecciona</option>
                                  {exerciseOptions.map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Series
                                <input name="sets" defaultValue="3" min="1" type="number" />
                              </label>
                              <label>
                                Reps
                                <input name="reps" defaultValue="8-12" />
                              </label>
                              <label>
                                Tempo
                                <input name="tempo" defaultValue="3-1-1" placeholder="3-1-1" />
                              </label>
                              <label>
                                Descanso
                                <input name="restSeconds" defaultValue="90" min="0" type="number" />
                              </label>
                              <label>
                                RIR objetivo
                                <input name="targetRir" defaultValue="2" placeholder="0-3" />
                              </label>
                              <label>
                                Técnica
                                <select name="intensityTechnique" defaultValue="">
                                  <option value="">Sin técnica avanzada</option>
                                  <option value="Dropset">Dropset</option>
                                  <option value="Rest-pause">Rest-pause</option>
                                  <option value="Superserie">Superserie</option>
                                  <option value="Myo-reps">Myo-reps</option>
                                  <option value="Top set + back off">Top set + back off</option>
                                  <option value="AMRAP controlado">AMRAP controlado</option>
                                </select>
                              </label>
                              <label className="spanFull">
                                Notas
                                <input name="notes" placeholder="Dropset: -20% carga x 8-12, técnica, lesión, sustituciones..." />
                              </label>
                              <button className="btn" type="submit">Añadir ejercicio <Video size={16} /></button>
                            </form>
                          </div>
                        </article>
                      ))}
                    </details>
                  ))}
                </details>
              ))}
            </div>

            <form action={createCoachWorkoutDayAction} className="addTaskForm workoutDayForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="templateId" type="hidden" value={template.id} />
              <label>
                Semana
                <input name="weekNumber" defaultValue="1" min="1" type="number" />
              </label>
              <label>
                Dia
                <input name="dayNumber" defaultValue={String(template.days.length + 1)} min="1" type="number" />
              </label>
              <label>
                Titulo
                <input name="title" placeholder="Push hipertrofia" required />
              </label>
              <label className="spanFull">
                Notas
                <textarea name="notes" rows={2} placeholder="Foco, intensidad, ejercicios pendientes de añadir..." />
              </label>
              <button className="btn" type="submit">Añadir dia <Plus size={16} /></button>
            </form>
          </article>
                  );
                })}
                {!group.templates.length ? (
                  <p className="muted coachProgramEmpty">Todavia no hay rutinas para {group.daysPerWeek} dias/semana.</p>
                ) : null}
              </div>
            </details>
          ))}
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Esta app todavia no tiene programas."
            text="Crea el primer programa desde la consola del entrenador y aparecera como base para la app cliente."
          />
        ) : null}
      </section>
    </>
  );
}
