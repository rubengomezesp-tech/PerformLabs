import { Camera, Dumbbell, Filter, ListChecks, Pencil, PlayCircle, Plus, Trash2, Video } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getExerciseLibraryFacets, listManagedExercises } from "@/lib/repositories/training-management";
import {
  addCoachExerciseVideoAction,
  createCoachExerciseAction,
  deleteCoachExerciseAction,
  updateCoachExerciseAction,
} from "./actions";

export const dynamic = "force-dynamic";

const MUSCLE_OPTIONS = ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquios", "Glúteos", "Gemelos", "Core", "Cardio", "Movilidad"];

type CoachExercisesPageProps = {
  searchParams?: Promise<{
    q?: string;
    muscle?: string;
    equipment?: string;
    level?: string;
    source?: "all" | "base" | "brand" | "video";
  }>;
};

export default async function CoachExercisesPage({ searchParams }: CoachExercisesPageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const source = params?.source ?? "all";

  const [exercises, facets] = await Promise.all([
    listManagedExercises(brand.id, {
      query: params?.q,
      muscle: params?.muscle,
      equipment: params?.equipment,
      level: params?.level,
      source,
      limit: 120,
    }),
    getExerciseLibraryFacets(brand.id),
  ]);

  const hasFilters = Boolean(params?.q || params?.muscle || params?.equipment || params?.level || (source && source !== "all"));

  return (
    <>
      <Topbar
        eyebrow="Fitness · Ejercicios"
        title="Biblioteca de ejercicios."
        text="Los ejercicios que aparecen al montar programas. Usa los base, crea los tuyos y añade tu vídeo de técnica para que el cliente lo vea en su app."
        actions={
          <Dialog
            triggerClassName="btn primary"
            trigger={<>Nuevo ejercicio <Plus size={18} /></>}
            title="Nuevo ejercicio"
            description="Se añade a tu marca y aparece en el desplegable de los programas."
          >
            <form action={createCoachExerciseAction} className="editForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <label className="spanFull">
                Nombre
                <input name="name" placeholder="Press inclinado con mancuernas" required />
              </label>
              <label>
                Grupo muscular
                <select name="muscleGroups" defaultValue="Pecho">
                  {MUSCLE_OPTIONS.map((muscle) => (
                    <option key={muscle} value={muscle}>{muscle}</option>
                  ))}
                </select>
              </label>
              <label>
                Equipo
                <input name="equipment" placeholder="Mancuernas" />
              </label>
              <label>
                Nivel
                <select name="difficulty" defaultValue="intermediate">
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </label>
              <label>
                Ubicación
                <select name="locations" defaultValue="gym">
                  <option value="gym">Gimnasio</option>
                  <option value="home">Casa</option>
                </select>
              </label>
              <label className="spanFull">
                Vídeo (URL, opcional)
                <input name="defaultVideoUrl" placeholder="https://..." />
              </label>
              <label className="spanFull">
                Instrucciones (opcional)
                <textarea name="instructions" rows={2} placeholder="Ejecución, tempo, cues..." />
              </label>
              <button className="btn primary spanFull" type="submit">Crear ejercicio</button>
            </form>
          </Dialog>
        }
      />
      <section className="grid">
        <article className="card span12">
          <form action="/coach/exercises" className="exerciseFilters" method="get">
            <label>
              Buscar
              <input name="q" defaultValue={params?.q ?? ""} placeholder="press, sentadilla, curl..." />
            </label>
            <label>
              Músculo
              <select name="muscle" defaultValue={params?.muscle ?? ""}>
                <option value="">Todos</option>
                {facets.muscles.map((muscle) => (
                  <option key={muscle} value={muscle}>{muscle}</option>
                ))}
              </select>
            </label>
            <label>
              Equipo
              <select name="equipment" defaultValue={params?.equipment ?? ""}>
                <option value="">Todo</option>
                {facets.equipment.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Nivel
              <select name="level" defaultValue={params?.level ?? ""}>
                <option value="">Todos</option>
                {facets.levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>
            <label>
              Origen
              <select name="source" defaultValue={source}>
                <option value="all">Todos</option>
                <option value="base">Base PerformLabs</option>
                <option value="brand">Solo míos</option>
                <option value="video">Con vídeo propio</option>
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Filtrar <Filter size={16} /></button>
              {hasFilters ? <a className="btn ghost" href="/coach/exercises">Limpiar</a> : null}
            </div>
          </form>
        </article>

        <article className="card span12 exerciseStats">
          <span><Dumbbell size={18} /> <strong>{facets.total}</strong> disponibles</span>
          <span><ListChecks size={18} /> <strong>{facets.brandOnly}</strong> propios</span>
          <span><PlayCircle size={18} /> <strong>{facets.withVideo}</strong> con vídeo</span>
          <span><Camera size={18} /> <strong>{facets.withImages}</strong> con imagen</span>
        </article>

        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <ListChecks color="var(--accent)" />
              <h2>Tu librería.</h2>
              <p>{exercises.length} {hasFilters ? "con estos filtros" : "disponibles"} · base de PerformLabs + ejercicios propios de tu marca.</p>
            </div>
            <span className="tag">{exercises.length}</span>
          </div>
          {exercises.length ? (
            <ul className="list compactList">
              {exercises.map((exercise) => {
                const videoUrl = exercise.workspaceVideo?.videoUrl || exercise.defaultVideoUrl;
                return (
                  <li className="row" key={exercise.id}>
                    <div>
                      <strong>{exercise.name}</strong>
                      <p>
                        {exercise.muscleGroups.length ? exercise.muscleGroups.join(", ") : "Sin grupo"}
                        {exercise.equipment.length ? ` · ${exercise.equipment.join(", ")}` : ""}
                        {exercise.difficulty ? ` · ${exercise.difficulty}` : ""}
                      </p>
                    </div>
                    <div className="statusControls">
                      <span className="tag">{exercise.isBaseLibrary ? "base" : "propio"}</span>
                      <span className={videoUrl ? "videoBadge ready" : "videoBadge"}>
                        {videoUrl ? "con vídeo" : "sin vídeo"}
                      </span>
                      {videoUrl ? (
                        <a className="btn ghost sm" href={videoUrl} target="_blank" rel="noreferrer">
                          <PlayCircle size={15} /> Ver
                        </a>
                      ) : null}

                      <Dialog
                        triggerClassName="btn ghost sm"
                        trigger={<><Video size={15} /> Vídeo</>}
                        title={`Vídeo de ${exercise.name}`}
                        description="Tu demo de técnica para tu marca. Sustituye al vídeo base en la app del cliente."
                      >
                        <form action={addCoachExerciseVideoAction} className="editForm">
                          <input name="workspaceId" type="hidden" value={brand.id} />
                          <input name="exerciseId" type="hidden" value={exercise.id} />
                          <label className="spanFull">
                            Título
                            <input name="title" defaultValue={exercise.workspaceVideo?.title ?? `${exercise.name} · demo`} placeholder="Demo técnica" required />
                          </label>
                          <label className="spanFull">
                            URL del vídeo
                            <input name="videoUrl" defaultValue={exercise.workspaceVideo?.videoUrl ?? ""} placeholder="https://..." required />
                          </label>
                          <label className="spanFull">
                            Miniatura (opcional)
                            <input name="thumbnailUrl" defaultValue={exercise.workspaceVideo?.thumbnailUrl ?? ""} placeholder="https://..." />
                          </label>
                          <label className="toggleRow spanFull">
                            Usar como vídeo por defecto
                            <input name="isDefault" type="checkbox" value="true" defaultChecked={!exercise.workspaceVideo || exercise.workspaceVideo.isDefault} />
                          </label>
                          <button className="btn primary spanFull" type="submit">
                            {exercise.workspaceVideo ? "Guardar vídeo" : "Añadir vídeo"}
                          </button>
                        </form>
                      </Dialog>

                      {exercise.isBaseLibrary ? null : (
                        <>
                          <Dialog
                            triggerClassName="btn ghost sm"
                            trigger={<><Pencil size={15} /> Editar</>}
                            title={`Editar ${exercise.name}`}
                            description="Cambia los datos de este ejercicio propio. Se actualiza en tus programas."
                          >
                            <form action={updateCoachExerciseAction} className="editForm">
                              <input name="workspaceId" type="hidden" value={brand.id} />
                              <input name="exerciseId" type="hidden" value={exercise.id} />
                              <label className="spanFull">
                                Nombre
                                <input name="name" defaultValue={exercise.name} required />
                              </label>
                              <label className="spanFull">
                                Grupos musculares
                                <input name="muscleGroups" defaultValue={exercise.muscleGroups.join(", ")} placeholder="Pecho, hombro, tríceps" />
                              </label>
                              <label>
                                Equipo
                                <input name="equipment" defaultValue={exercise.equipment.join(", ")} placeholder="Mancuernas, banco" />
                              </label>
                              <label>
                                Ubicación
                                <input name="locations" defaultValue={exercise.locations.join(", ")} placeholder="Gimnasio, casa" />
                              </label>
                              <label className="spanFull">
                                Nivel
                                <select name="difficulty" defaultValue={exercise.difficulty || "intermediate"}>
                                  <option value="beginner">Principiante</option>
                                  <option value="intermediate">Intermedio</option>
                                  <option value="advanced">Avanzado</option>
                                </select>
                              </label>
                              <label className="spanFull">
                                Vídeo base (URL, opcional)
                                <input name="defaultVideoUrl" defaultValue={exercise.defaultVideoUrl} placeholder="https://..." />
                              </label>
                              <label className="spanFull">
                                Instrucciones
                                <textarea name="instructions" rows={2} defaultValue={exercise.instructions} placeholder="Ejecución, tempo, cues..." />
                              </label>
                              <button className="btn primary spanFull" type="submit">Guardar cambios</button>
                            </form>
                          </Dialog>

                          <Dialog
                            triggerClassName="btn danger sm"
                            trigger={<><Trash2 size={15} /> Eliminar</>}
                            title={`Eliminar ${exercise.name}`}
                            description="Esta acción no se puede deshacer."
                          >
                            <form action={deleteCoachExerciseAction} className="editForm">
                              <input name="workspaceId" type="hidden" value={brand.id} />
                              <input name="exerciseId" type="hidden" value={exercise.id} />
                              <p className="spanFull">
                                Se eliminará <strong>{exercise.name}</strong> de tu marca. Si está usado en una rutina, primero quítalo de los programas.
                              </p>
                              <button className="btn danger spanFull" type="submit">Sí, eliminar</button>
                            </form>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : hasFilters ? (
            <div className="inlineEmpty">
              <Filter color="var(--accent)" />
              <strong>No hay ejercicios con estos filtros.</strong>
              <p>Ajusta la búsqueda, el músculo, el equipo o el origen para ampliar los resultados.</p>
              <a className="btn ghost" href="/coach/exercises">Limpiar filtros</a>
            </div>
          ) : (
            <div className="inlineEmpty">
              <Dumbbell color="var(--accent)" />
              <strong>Tu librería está vacía.</strong>
              <p>Carga la librería base (scripts/sql/base-exercise-library.sql) o crea ejercicios con “Nuevo ejercicio”. Sin ejercicios, los programas se generan sin movimientos.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
