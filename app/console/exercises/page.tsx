import { Camera, Dumbbell, ExternalLink, Filter, PlayCircle, Search, Upload, Video } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getExerciseLibraryFacets, listManagedExercises } from "@/lib/repositories/training-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { addExerciseVideoAction, createExerciseAction } from "./actions";

export const dynamic = "force-dynamic";

type ExercisesPageProps = {
  searchParams?: Promise<{
    brand?: string;
    q?: string;
    muscle?: string;
    equipment?: string;
    level?: string;
    source?: "all" | "base" | "brand" | "video";
  }>;
};

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [exercises, facets] = await Promise.all([
    listManagedExercises(selectedWorkspace?.id, {
      query: params?.q,
      muscle: params?.muscle,
      equipment: params?.equipment,
      level: params?.level,
      source: params?.source ?? "all",
      limit: 96,
    }),
    getExerciseLibraryFacets(selectedWorkspace?.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Biblioteca de ejercicios"
        title="Ejercicios globales y vídeos propios por marca."
        text="Gestiona ejercicios base, versiones personalizadas, nuevos movimientos y vídeos propios sin perder consistencia en la biblioteca."
        actions={<button className="btn">Importar CSV <Upload size={18} /></button>}
      />
      <section className="grid">
        <article className="card span12 exerciseImportBanner">
          <div>
            <span className="eyebrow">Biblioteca base</span>
            <p>
              <strong>{facets.total} ejercicios</strong> importados desde Free Exercise DB (Unlicense / dominio público), con instrucciones, músculos, equipo e imágenes. Los entrenadores crean variantes propias encima sin tocar la base global.
            </p>
          </div>
          <a className="btn" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
            Ver fuente <ExternalLink size={16} />
          </a>
        </article>

        <article className="card span12">
          <form action="/console/exercises" className="exerciseFilters" method="get">
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
            <label>
              Buscar
              <input name="q" defaultValue={params?.q ?? ""} placeholder="press, squat, curl..." />
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
              <select name="source" defaultValue={params?.source ?? "all"}>
                <option value="all">Todo</option>
                <option value="base">Base global</option>
                <option value="brand">Solo marca</option>
                <option value="video">Con vídeo propio</option>
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Filtrar <Filter size={16} /></button>
            </div>
          </form>
        </article>

        <article className="card span3 statCard">
          <p className="metric"><Dumbbell size={15} /> Base disponible<strong>{facets.total}</strong></p>
        </article>
        <article className="card span3 statCard">
          <p className="metric"><Camera size={15} /> Con imágenes<strong>{facets.withImages}</strong></p>
        </article>
        <article className="card span3 statCard">
          <p className="metric"><PlayCircle size={15} /> Con vídeo propio<strong>{facets.withVideo}</strong></p>
        </article>
        <article className="card span3 statCard">
          <p className="metric"><Video size={15} /> Variantes de marca<strong>{facets.brandOnly}</strong></p>
        </article>

        <article className="card span12">
          <h2>Nuevo ejercicio</h2>
          <form action={createExerciseAction} className="exerciseForm">
            <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
            <label>
              Nombre
              <input name="name" placeholder="Press inclinado con mancuernas" required />
            </label>
            <label>
              Músculos
              <input name="muscleGroups" placeholder="Pecho, hombro, tríceps" />
            </label>
            <label>
              Equipo
              <input name="equipment" placeholder="Mancuernas, banco" />
            </label>
            <label>
              Localización
              <input name="locations" placeholder="Gimnasio, casa" />
            </label>
            <label>
              Dificultad
              <select name="difficulty" defaultValue="">
                <option value="">Sin definir</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Ámbito
              <select name="scope" defaultValue="brand">
                <option value="brand">Solo marca</option>
                <option value="base">Biblioteca global</option>
              </select>
            </label>
            <label className="spanFull">
              URL de vídeo
              <input name="defaultVideoUrl" placeholder="https://..." />
            </label>
            <label className="spanFull">
              Instrucciones
              <textarea name="instructions" rows={3} placeholder="Setup, ejecución, errores comunes y cues del entrenador." />
            </label>
            <button className="btn primary" type="submit">
              Crear ejercicio <Dumbbell size={18} />
            </button>
          </form>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <h2>Biblioteca</h2>
              <p>{exercises.length} ejercicios disponibles entre base global y marca.</p>
            </div>
            <span className="tag">{selectedWorkspace?.name ?? "Demo"}</span>
          </div>
          {exercises.length ? (
            <div className="exerciseLibraryGrid">
              {exercises.map((exercise) => (
                <article className="exerciseCard" key={exercise.id}>
                  <div className="exerciseMedia">
                    {exercise.imageUrls[0] ? (
                      <img alt="" src={exercise.imageUrls[0]} />
                    ) : (
                      <Dumbbell size={28} />
                    )}
                    <span className={exercise.workspaceVideo || exercise.defaultVideoUrl ? "videoBadge ready" : "videoBadge"}>
                      {exercise.workspaceVideo || exercise.defaultVideoUrl ? "Vídeo propio" : "Vídeo pendiente"}
                    </span>
                  </div>
                  <div className="exerciseCardBody">
                    <div>
                      <h3>{exercise.name}</h3>
                      <p>{exercise.muscleGroups.slice(0, 3).join(", ") || "Músculo pendiente"}</p>
                    </div>
                    <div className="exerciseTags">
                      <span>{exercise.equipment[0] ?? "Libre"}</span>
                      <span>{exercise.difficulty || "Nivel abierto"}</span>
                      <span>{exercise.sourceLicense || exercise.source}</span>
                    </div>
                    <p className="exerciseInstructions">{exercise.instructions || "Sin instrucciones todavía. El entrenador puede crear su versión propia con vídeo y cues."}</p>
                    <details className="exerciseVideoDetails">
                      <summary>
                        <Video size={16} />
                        {exercise.workspaceVideo ? "Gestionar vídeo propio" : "Añadir vídeo propio"}
                      </summary>
                      <form action={addExerciseVideoAction} className="exerciseVideoForm">
                        <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
                        <input name="exerciseId" type="hidden" value={exercise.id} />
                        <label>
                          Título vídeo
                          <input name="title" defaultValue={exercise.workspaceVideo?.title ?? `${exercise.name} - demo coach`} placeholder="Demo técnica del coach" required />
                        </label>
                        <label>
                          URL vídeo
                          <input name="videoUrl" defaultValue={exercise.workspaceVideo?.videoUrl ?? ""} placeholder="https://..." required />
                        </label>
                        <label>
                          Thumbnail
                          <input name="thumbnailUrl" defaultValue={exercise.workspaceVideo?.thumbnailUrl ?? ""} placeholder="https://... opcional" />
                        </label>
                        <label className="toggleRow compactToggle">
                          Usar por defecto
                          <input name="isDefault" type="checkbox" value="true" defaultChecked={!exercise.workspaceVideo || exercise.workspaceVideo.isDefault} />
                        </label>
                        <button className="btn" type="submit">
                          <Video size={16} /> {exercise.workspaceVideo ? "Guardar vídeo" : "Añadir vídeo"}
                        </button>
                      </form>
                    </details>
                    <div className="exerciseActions">
                      <a className="btn" href={`/console/exercises?brand=${selectedWorkspace?.id ?? ""}&q=${encodeURIComponent(exercise.name)}`}>
                        <Search size={16} /> Ver similares
                      </a>
                      <span className={exercise.workspaceVideo ? "tag" : "tag danger"}>
                        {exercise.workspaceVideo ? "Listo para app" : "Falta vídeo coach"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="inlineEmpty">
              <Dumbbell color="var(--gold)" />
              <h3>No hay ejercicios con estos filtros.</h3>
              <p>Ajusta búsqueda, músculo, equipo o fuente para ampliar resultados.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
