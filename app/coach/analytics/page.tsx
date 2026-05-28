import { BarChart3, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { coachStats } from "@/lib/coach-console";

export default function CoachAnalyticsPage() {
  return (
    <>
      <Topbar
        eyebrow="Analitica"
        title="Lectura rapida del negocio del coach."
        text="Actividad, adherencia, retencion, check-ins y uso de programas desde la perspectiva del entrenador."
      />
      <section className="grid">
        {coachStats.map((stat) => (
          <article className="card span3 motionCard" key={stat.label}>
            <BarChart3 color="var(--gold)" />
            <span className="metric">
              {stat.label}
              <strong>{stat.value}</strong>
            </span>
            <p>{stat.detail}</p>
          </article>
        ))}
        <article className="card span12 coachBuilderCard">
          <TrendingUp color="var(--gold)" />
          <div>
            <h2>Lo que mediremos despues</h2>
            <p>Adherencia por programa, miembros en riesgo, comidas completadas, entrenamientos registrados y tiempo medio de respuesta.</p>
          </div>
        </article>
      </section>
    </>
  );
}
