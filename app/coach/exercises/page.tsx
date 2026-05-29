import { Dumbbell, ListChecks, Plus } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedExercises } from "@/lib/repositories/training-management";
import { createCoachExerciseAction } from "./actions";

export const dynamic = "force-dynamic";

const MUSCLE_OPTIONS = ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquios", "Glúteos", "Gemelos", "Core", "Cardio", "Movilidad"];

export default async function CoachExercisesPage() {
  const brand = await getSelectedMemberAppBrand();
  const exercises = await listManagedExercises(brand.id);
  const ownCount = exercises.filter((exercise) => !exercise.isBaseLibrary).length;

  return (
    <>
      <Topbar
        eyebrow="Fitness · Ejercicios"
        title="Biblioteca de ejercicios."
        text="Los ejercicios que aparecen al montar programas. Usa los base o crea los tuyos con su grupo muscular y vídeo."
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
        <article className="card span12 motionCard">
          <div className="sectionHeader">
            <div>
              <ListChecks color="var(--accent)" />
              <h2>Tu librería.</h2>
              <p>{exercises.length} ejercicios disponibles · {ownCount} propios · el resto, base de PerformLabs.</p>
            </div>
            <span className="tag">{exercises.length}</span>
          </div>
          {exercises.length ? (
            <ul className="list compactList">
              {exercises.map((exercise) => (
                <li className="row" key={exercise.id}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <p>
                      {exercise.muscleGroups.length ? exercise.muscleGroups.join(", ") : "Sin grupo"}
                      {exercise.equipment.length ? ` · ${exercise.equipment.join(", ")}` : ""}
                      {exercise.difficulty ? ` · ${exercise.difficulty}` : ""}
                    </p>
                  </div>
                  <span className="tag">{exercise.isBaseLibrary ? "base" : "propio"}</span>
                </li>
              ))}
            </ul>
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
