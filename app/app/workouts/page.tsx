import { Dumbbell, Timer } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { workouts } from "@/lib/data";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedWorkoutTemplates } from "@/lib/repositories/training-management";

export default async function WorkoutsPage() {
  const brand = await getSelectedMemberAppBrand();
  const templates = await listManagedWorkoutTemplates(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Rutina de ejercicios"
        title={`Plan semanal de ${brand.appName}.`}
        text="Cada ejercicio tendrá vídeo, instrucciones, tempo, series, reps, descanso, registro y solicitud de alternativa por lesión."
      />
      <section className="grid">
        {templates.length ? (
          templates.map((template) => (
            <article className="card span4" key={template.id}>
              <Dumbbell color="var(--gold)" />
              <h3>{template.name}</h3>
              <h2>{template.goal || "Plan activo"}</h2>
              <p><Timer size={16} /> {template.daysPerWeek} días por semana</p>
              <ul className="list">
                {template.days.length ? template.days.map((day) => (
                  <li className="row workoutAppDay" key={day.id}>
                    <div>
                      <strong>Semana {day.weekNumber} · Día {day.dayNumber}</strong>
                      <p>{day.title}</p>
                      {day.exercises.length ? (
                        <span>{day.exercises.map((exercise) => exercise.exerciseName).join(", ")}</span>
                      ) : null}
                    </div>
                    <span className="tag">{day.exercises.length} ejercicios</span>
                  </li>
                )) : (
                  <li className="row">Días pendientes <span className="tag">Preparando</span></li>
                )}
              </ul>
            </article>
          ))
        ) : (
          workouts.map((workout) => (
            <article className="card span4" key={workout.day}>
              <Dumbbell color="var(--gold)" />
              <h3>{workout.day}</h3>
              <h2>{workout.title}</h2>
              <p><Timer size={16} /> {workout.duration}</p>
              <ul className="list">
                {workout.exercises.map((exercise) => (
                  <li className="row" key={exercise}>
                    {exercise}
                    <span className="tag">Cambiar</span>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>
    </>
  );
}
