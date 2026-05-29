import { CalendarClock, CheckCircle2, Dumbbell, Play, Repeat2, Timer, Video } from "lucide-react";
import Link from "next/link";
import { Dialog } from "@/components/dialog";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberTrainingContext, type MemberAssignedWorkoutDay, type MemberAssignedWorkoutExercise } from "@/lib/repositories/member-onboarding";
import { listManagedExercises, type ManagedWorkoutTemplate } from "@/lib/repositories/training-management";
import { getWorkoutPerformanceSummary } from "@/lib/repositories/workout-performance";
import { requestWorkoutIssueAction, saveWorkoutSessionAction, swapWorkoutExerciseAction } from "./actions";

type WorkoutTemplateDay = ManagedWorkoutTemplate["days"][number];
type WorkoutTemplateExercise = WorkoutTemplateDay["exercises"][number];
type WorkoutDayView = WorkoutTemplateDay | MemberAssignedWorkoutDay;
type WorkoutExerciseView = WorkoutTemplateExercise | MemberAssignedWorkoutExercise;

const monthLabels: Record<number, { title: string; weeks: string; focus: string }> = {
  1: { title: "Mes 1 · Base técnica", weeks: "Semanas 1-4", focus: "Aprender patrón, tempo y volumen sostenible." },
  2: { title: "Mes 2 · Progresión", weeks: "Semanas 5-8", focus: "Subir cargas, reps o densidad con técnica limpia." },
  3: { title: "Mes 3 · Especialización", weeks: "Semanas 9-12", focus: "Cerrar fuerte, medir avances y preparar rotación." },
};

function monthForWeek(weekNumber: number) {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  return 3;
}

function groupDaysByMonth(days: WorkoutDayView[]) {
  return [1, 2, 3].map((month) => ({
    month,
    ...monthLabels[month],
    days: days.filter((day) => monthForWeek(day.weekNumber) === month),
  }));
}

function publicTemplateName(template?: ManagedWorkoutTemplate | null) {
  if (!template) return "Fase pendiente";
  if (template.name.toLowerCase().includes("modulo")) {
    return `Fase de entrenamiento · ${template.daysPerWeek} dias/semana`;
  }

  return template.name;
}

function sourceExerciseId(exercise: WorkoutExerciseView) {
  return "sourceTemplateExerciseId" in exercise ? exercise.sourceTemplateExerciseId ?? "" : exercise.id;
}

function estimatedMinutesFor(day: WorkoutDayView | null) {
  return day && "estimatedMinutes" in day && day.estimatedMinutes ? day.estimatedMinutes : 60;
}

function formatReviewDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

export default async function WorkoutsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [performance, trainingContext, exerciseOptions] = await Promise.all([
    getWorkoutPerformanceSummary(brand.id),
    getMemberTrainingContext(brand.id),
    listManagedExercises(brand.id, { limit: 200 }),
  ]);
  const hasApprovedTraining = Boolean(trainingContext.activeAssignment);
  const assignedDay = trainingContext.activeAssignedDay;
  const canSwap = Boolean(assignedDay) && exerciseOptions.length > 0;
  const activeTemplate = hasApprovedTraining ? trainingContext.activeTemplate : null;
  const activeDay = hasApprovedTraining ? assignedDay ?? activeTemplate?.days[0] ?? null : null;
  const calendarDays: WorkoutDayView[] = hasApprovedTraining
    ? trainingContext.assignedDays.length ? trainingContext.assignedDays : activeTemplate?.days ?? []
    : [];
  const templateIdForLog = hasApprovedTraining ? trainingContext.activeAssignment?.sourceTemplateId ?? activeTemplate?.id ?? "" : "";
  const dayIdForLog = hasApprovedTraining ? assignedDay?.sourceTemplateDayId ?? activeDay?.id ?? "" : "";
  const totalSessionVideos = activeDay?.exercises.filter((exercise) => exercise.videoUrl).length ?? 0;
  const sessionExercises = activeDay?.exercises.length ?? 0;
  const activeWeekNumber = activeDay?.weekNumber ?? 1;
  const weekProgressPercent = Math.min(100, Math.max(8, Math.round((activeWeekNumber / 12) * 100)));
  const weeklyGoal = hasApprovedTraining ? trainingContext.activeAssignment?.daysPerWeek ?? activeTemplate?.daysPerWeek ?? trainingContext.preferredDaysPerWeek ?? 4 : 0;
  const estimatedMinutes = estimatedMinutesFor(activeDay);
  const coachAssignment = hasApprovedTraining ? trainingContext.activeAssignment : null;
  const coachReview = formatReviewDate(coachAssignment?.nextReviewOn ?? "");

  return (
    <>
      <Topbar
        eyebrow="Entreno"
        title="Tu rutina de hoy."
        text="Sigue los ejercicios, apunta lo que haces y guarda la sesión para ver tu progreso."
      />
      <section className="grid">
        <article className="span12 workoutAppHero">
          <div>
            <span className="eyebrow">Hoy toca</span>
            <h2>{activeDay?.title ?? "Plan en revisión"}</h2>
            <p>{activeDay ? "Completa la rutina y apunta reps y kilos. Si algo te impide hacerla, avisa con un motivo concreto." : "Tu coach está revisando tu briefing antes de activar tu primera rutina."}</p>
            <div className="workoutHeroMeta">
              <span><Dumbbell size={16} /> {activeDay ? `${sessionExercises} ejercicios` : "Pendiente de activar"}</span>
              <span><Video size={16} /> {activeDay ? totalSessionVideos ? `${totalSessionVideos} vídeos` : "Sin vídeos" : "Vídeos después"}</span>
              <span><Timer size={16} /> {activeDay ? `${estimatedMinutes} min aprox.` : "Revisión coach"}</span>
              {activeDay && coachReview ? (
                <span><CalendarClock size={16} /> Revisión {coachReview}</span>
              ) : (
                <span><Repeat2 size={16} /> Avisos con motivo</span>
              )}
            </div>
            <div className="workoutActionRail">
              {activeDay ? (
                <a className="btn primary" href="#sesion-activa">Empezar sesión <Play size={18} /></a>
              ) : (
                <Link className="btn primary" href="/app/onboarding">Completar briefing <Play size={18} /></Link>
              )}
              <Link className="btn" href="/app/progress">Ver progreso</Link>
            </div>
          </div>
          <div className="memberHeroSignal">
            <span className="tag">{activeDay ? "Tu avance" : "Revisión del coach"}</span>
            <strong>{activeDay ? `Semana ${activeWeekNumber}` : "Plan pendiente"}</strong>
            <p>{activeDay ? "Vas avanzando en tu plan. Guarda cada entrenamiento para ver mejoras reales." : "Cuando el coach lo publique, aquí aparecerá exactamente qué entrenar."}</p>
            <div className="workoutProgressTrack" aria-label={activeDay ? `Semana ${activeWeekNumber}` : "Plan pendiente"}>
              <span style={{ width: `${activeDay ? weekProgressPercent : 18}%` }} />
            </div>
          </div>
        </article>

        <div className="span12 workoutMenuGrid">
          <article className="card workoutStatusCard">
            <div>
              <span>
                <small>Esta semana</small>
                Entrenos completados
              </span>
              <strong>{activeDay ? `${performance.sessionsThisWeek}/${weeklyGoal}` : "Pendiente"}</strong>
            </div>
            <div className="workoutMetrics">
              <span>Sesiones<strong>{performance.sessionsThisWeek}</strong></span>
              <span>Kilos movidos<strong>{performance.totalVolumeKgThisWeek} kg</strong></span>
            </div>
          </article>

          <article className="card workoutStatusCard">
            <div>
              <span>
                <small>Mejor marca</small>
                Último registro
              </span>
              <strong>{performance.bestSet ? `${performance.bestSet.weightKg} kg` : "Pendiente"}</strong>
            </div>
            <p>{performance.bestSet ? `${performance.bestSet.reps} reps registradas en tu mejor set.` : "Cuando guardes tus entrenos, aquí verás tus mejores marcas."}</p>
          </article>

          <article className="card workoutStatusCard">
            <div>
              <span>
                <small>Objetivo de hoy</small>
                Completar y guardar
              </span>
              <strong>{activeDay ? `${sessionExercises} ejercicios` : "Coach revisa"}</strong>
            </div>
            <p>{activeDay ? "Haz cada ejercicio con buena técnica. Si hay dolor, falta de material o una limitación real, avisa al coach." : "Tu plan no se publica hasta que el entrenador lo aprueba."}</p>
          </article>
        </div>

        {activeDay ? (
          <article className="card span12 workoutSession" id="sesion-activa">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Registra tu entreno</span>
                <h2>{activeDay.title}</h2>
                <p>Rellena reps y kilos al terminar cada serie. El progreso se guardará para comparar tus marcas.</p>
              </div>
              <div className="sessionSummaryPills">
                <span>{activeDay.exercises.length} ejercicios</span>
                <span>{totalSessionVideos} vídeos</span>
                <span>Progreso guardado</span>
              </div>
              {canSwap ? (
                <Dialog
                  triggerClassName="btn ghost sm"
                  trigger={<><Repeat2 size={15} /> Cambiar ejercicio</>}
                  title="Cambiar un ejercicio"
                  description="Si no puedes hacer un ejercicio, elige un sustituto de tu librería. Se actualiza en tu plan."
                >
                  <div className="swapList">
                    {activeDay.exercises.map((exercise) => (
                      <form action={swapWorkoutExerciseAction} className="swapRow" key={exercise.id}>
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="assignedExerciseId" type="hidden" value={exercise.id} />
                        <span className="swapRowName">{exercise.exerciseName}</span>
                        <select name="newExerciseId" defaultValue="" required>
                          <option value="" disabled>Cambiar por…</option>
                          {exerciseOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                          ))}
                        </select>
                        <button className="btn sm" type="submit">Cambiar</button>
                      </form>
                    ))}
                  </div>
                </Dialog>
              ) : null}
            </div>
            <div className="sessionQuickGuide">
              <span><strong>1</strong> Haz el ejercicio</span>
              <span><strong>2</strong> Apunta reps y kg</span>
              <span><strong>3</strong> Marca cómo fue</span>
              <span><strong>4</strong> Guarda sesión</span>
            </div>
            {coachAssignment?.goal || coachAssignment?.notes ? (
              <p className="sessionCoachNotes">
                {coachAssignment?.goal ? <strong>Objetivo del bloque: {coachAssignment.goal}. </strong> : null}
                {coachAssignment?.notes || "Controla la técnica, respeta los descansos y avisa a tu coach si aparece una molestia."}
              </p>
            ) : (
              <p className="sessionCoachNotes">Controla la técnica, respeta los descansos y avisa a tu coach si aparece alguna molestia.</p>
            )}
            <form action={saveWorkoutSessionAction} className="sessionLogForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="templateId" type="hidden" value={templateIdForLog} />
              <input name="dayId" type="hidden" value={dayIdForLog} />
              <input name="assignedDayId" type="hidden" value={assignedDay?.id ?? ""} />
              <div className="sessionExerciseList">
                {activeDay.exercises.map((exercise, index) => {
                  const plannedSets = Math.max(1, Math.min(exercise.sets ?? 3, 6));

                  return (
                    <details className={index === 0 ? "sessionExerciseAccordion isCurrentExercise" : "sessionExerciseAccordion"} key={exercise.id} open={index === 0}>
                      <summary>
                        <span>
                          <small>Ejercicio {index + 1}</small>
                          {exercise.exerciseName}
                        </span>
                        <b>{exercise.sets ?? "-"}x{exercise.reps || "-"}</b>
                      </summary>
                      <div className="sessionExercise">
                        <div className="sessionExerciseMedia">
                          {exercise.thumbnailUrl ? (
                            <img alt="" src={exercise.thumbnailUrl} />
                          ) : (
                            <Video size={30} />
                          )}
                          <span className={exercise.videoUrl ? "videoBadge ready" : "videoBadge"}>
                            {exercise.videoUrl ? "Vídeo listo" : "Vídeo pendiente"}
                          </span>
                        </div>
                      <div className="sessionExerciseBody">
                        <span className="eyebrow">Ejercicio {index + 1}</span>
                        <h3>{exercise.exerciseName}</h3>
                        <div className="sessionPrescription">
                          <span><strong>{exercise.sets ?? "-"}</strong>Series</span>
                          <span><strong>{exercise.reps || "-"}</strong>Objetivo</span>
                          <span><strong>{exercise.restSeconds ?? "-"}</strong>Seg descanso</span>
                        </div>
                        <div className="setLogGrid">
                          {Array.from({ length: plannedSets }).map((_, setIndex) => (
                            <div className="setLogRow" key={`${exercise.id}-${setIndex}`}>
                              <input name="templateExerciseId" type="hidden" value={sourceExerciseId(exercise)} />
                              <input name="exerciseId" type="hidden" value={exercise.exerciseId} />
                              <input name="setNumber" type="hidden" value={setIndex + 1} />
                              <input name="plannedReps" type="hidden" value={exercise.reps} />
                              <strong>Serie {setIndex + 1}</strong>
                              <label>Reps hechas<input name="actualReps" placeholder={exercise.reps || "10"} type="number" min="0" /></label>
                              <label>Peso kg<input name="weightKg" placeholder="0" type="number" min="0" step="0.5" /></label>
                              <input name="rir" type="hidden" value="" />
                              <input name="rpe" type="hidden" value="" />
                              <label>Cómo fue<select name="setNotes" defaultValue="">
                                <option value="">Normal</option>
                                <option value="Fácil">Fácil</option>
                                <option value="Difícil">Difícil</option>
                                <option value="Molestia">Molestia</option>
                              </select></label>
                            </div>
                          ))}
                        </div>
                        <div className="actions">
                          {exercise.videoUrl ? (
                            <a className="btn primary" href={exercise.videoUrl} target="_blank" rel="noreferrer">
                              <Play size={16} /> Ver vídeo
                            </a>
                          ) : (
                            <button className="btn" type="button" disabled>
                              <Play size={16} /> Vídeo pendiente
                            </button>
                          )}
                        </div>
                      </div>
                      </div>
                    </details>
                  );
                })}
              </div>
              <div className="sessionSavePanel">
                <label>Tiempo<input name="durationMinutes" placeholder="60 min" type="number" min="0" /></label>
                <label>Sensación<input name="perceivedEffort" placeholder="1-10" type="number" min="1" max="10" /></label>
                <label className="spanFull">Nota del entreno<textarea name="notes" rows={2} placeholder="Energía, molestias durante la sesión, cargas que se sintieron altas o bajas..." /></label>
                <div className="sessionIssueBox">
                  <div>
                    <span className="eyebrow">Aviso al coach</span>
                    <strong>Solo si hay un motivo concreto.</strong>
                    <p>Esto no cambia tu plan automáticamente; tu coach lo revisa y decide.</p>
                  </div>
                  <label>Motivo
                    <select name="issueReason" defaultValue="" required>
                      <option value="">Elige motivo</option>
                      <option value="Dolor o molestia">Dolor o molestia</option>
                      <option value="No tengo material">No tengo material</option>
                      <option value="No entiendo la técnica">No entiendo la técnica</option>
                      <option value="No puedo completar el tiempo">No puedo completar el tiempo</option>
                      <option value="La carga no encaja">La carga no encaja</option>
                    </select>
                  </label>
                  <label className="spanFull">Detalle
                    <textarea name="issueNotes" rows={2} placeholder="Ej. molestia en hombro en press, no tengo polea, no llego al tiempo..." />
                  </label>
                  <button className="btn" formAction={requestWorkoutIssueAction} type="submit"><Repeat2 size={17} /> Enviar aviso</button>
                </div>
                <button className="btn primary" formNoValidate type="submit"><CheckCircle2 size={17} /> Guardar entreno</button>
              </div>
            </form>
          </article>
        ) : null}

        {hasApprovedTraining ? (
          <details className="card span12 workoutMenuPanel workoutLibraryPanel">
            <summary>
              <span>
                <small>Calendario</small>
                Ver próximas sesiones
              </span>
              <strong>{calendarDays.length} sesiones</strong>
            </summary>
            <div className="workoutLibraryGrid single">
              <article className="card motionCard workoutAppCard">
                <div className="sectionHeader">
                  <div>
                    <Dumbbell color="var(--gold)" />
                    <h3>{publicTemplateName(activeTemplate)}</h3>
                    <h2>{activeTemplate?.goal || trainingContext.activeAssignment?.name || "Plan activo"}</h2>
                  </div>
                  <span className="tag">Activo</span>
                </div>
                <p><Timer size={16} /> {weeklyGoal || "-"} días por semana</p>
                <div className="workoutDayScroller">
                  {calendarDays.length ? groupDaysByMonth(calendarDays).map((monthGroup) => (
                    <details className="monthRoutinePanel" key={`active-${monthGroup.month}`} open={monthGroup.month === monthForWeek(activeWeekNumber)}>
                      <summary>
                        <span>
                          <small>{monthGroup.weeks}</small>
                          {monthGroup.title}
                        </span>
                        <b>{monthGroup.days.length} sesiones</b>
                      </summary>
                      <p>{monthGroup.focus}</p>
                      <ul className="list">
                        {monthGroup.days.map((day) => (
                          <li className="row workoutAppDay" key={day.id}>
                            <div>
                              <strong>Semana {day.weekNumber} · Día {day.dayNumber}</strong>
                              <p>{day.title}</p>
                              {day.exercises.length ? (
                                <div className="workoutExerciseChips">
                                  {day.exercises.map((exercise) => (
                                    <span key={exercise.id}>{exercise.videoUrl ? "▶ " : ""}{exercise.exerciseName}</span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <span className="tag">{day.exercises.filter((exercise) => exercise.videoUrl).length}/{day.exercises.length} vídeos</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )) : (
                    <ul className="list">
                      <li className="row">Días pendientes <span className="tag">Preparando</span></li>
                    </ul>
                  )}
                </div>
                <div className="actions">
                  <a className="btn primary" href="#sesion-activa"><CheckCircle2 size={17} /> Registrar</a>
                  <a className="btn" href="#sesion-activa"><Repeat2 size={17} /> Avisar si hay problema</a>
                </div>
              </article>
            </div>
          </details>
        ) : (
          <article className="card span12 planPendingCard">
            <Dumbbell color="var(--gold)" size={30} />
            <h2>Tu rutina todavía no está publicada.</h2>
            <p>Completa el briefing y tu coach activará el plan cuando esté revisado. Hasta entonces no verás rutinas genéricas.</p>
            <Link className="btn primary" href="/app/onboarding">Ir al briefing</Link>
          </article>
        )}
      </section>
    </>
  );
}
