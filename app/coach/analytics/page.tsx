import { BarChart3, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { SignalCard } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachDashboard } from "@/lib/repositories/coach-dashboard";

export const dynamic = "force-dynamic";

export default async function CoachAnalyticsPage() {
  const brand = await getSelectedMemberAppBrand();
  const dashboard = await getCoachDashboard(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Analitica"
        title="Lectura rapida del negocio del coach."
        text="Actividad, adherencia, retencion, check-ins y uso de programas desde la perspectiva del entrenador."
      />
      <section className="grid">
        {dashboard.stats.map((stat) => (
          <SignalCard
            key={stat.label}
            tone={stat.tone}
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            icon={BarChart3}
          />
        ))}
        <article className="card span12 coachBuilderCard">
          <TrendingUp color="var(--accent)" aria-hidden="true" />
          <div>
            <h2>Lo que mediremos despues</h2>
            <p>Adherencia por programa, miembros en riesgo, comidas completadas, entrenamientos registrados y tiempo medio de respuesta.</p>
          </div>
        </article>
      </section>
    </>
  );
}
