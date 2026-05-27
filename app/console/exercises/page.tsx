import { Dumbbell, Upload, Video } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { listManagedExercises } from "@/lib/repositories/training-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { createExerciseAction } from "./actions";

export const dynamic = "force-dynamic";

type ExercisesPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const exercises = await listManagedExercises(selectedWorkspace?.id);

  return (
    <>
      <Topbar
        eyebrow="Biblioteca de ejercicios"
        title="Ejercicios globales y vídeos propios por marca."
        text="Gestiona ejercicios base, versiones personalizadas, nuevos movimientos y vídeos propios sin perder consistencia en la biblioteca."
        actions={<button className="btn">Importar CSV <Upload size={18} /></button>}
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/exercises" className="formGrid" method="get">
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
              <button className="btn" type="submit">Ver biblioteca</button>
            </div>
          </form>
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
          <table className="table">
            <thead>
              <tr>
                <th>Ejercicio</th>
                <th>Músculos</th>
                <th>Equipo</th>
                <th>Origen</th>
                <th>Vídeo</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td>{exercise.name}</td>
                  <td>{exercise.muscleGroups.join(", ") || "Pendiente"}</td>
                  <td>{exercise.equipment.join(", ") || "Libre"}</td>
                  <td><span className="tag">{exercise.source}</span></td>
                  <td><Video size={16} /> {exercise.defaultVideoUrl ? "Configurado" : "Pendiente"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </>
  );
}
