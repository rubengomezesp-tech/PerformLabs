import { ArrowRight, ClipboardCheck, Dumbbell, Plus, Smartphone } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { coachStats, coachTodayQueue } from "@/lib/coach-console";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachIntelligenceAlerts } from "@/lib/repositories/checkin-management";

export default async function CoachHomePage() {
  const brand = await getSelectedMemberAppBrand();
  const alerts = await getCoachIntelligenceAlerts(brand.id);
  const dailyQueue = alerts.length
    ? alerts.map((alert) => ({
        title: alert.title,
        detail: alert.detail,
        status: alert.severity === "high" ? "Urgente" : alert.severity === "medium" ? "Revisar" : "Seguimiento",
        href: alert.actionHref,
      }))
    : coachTodayQueue.map((item) => ({ ...item, href: "/coach/checkins" }));

  return (
    <>
      <Topbar
        eyebrow="Coach console"
        title={`Gestiona ${brand.name} sin tocar la consola interna.`}
        text="Esta es la zona del entrenador: miembros, programas, comidas, check-ins, contenido y ajustes visibles en la app cliente."
        actions={
          <>
            <Link className="btn" href="/app">Ver app cliente <Smartphone size={18} /></Link>
            <Link className="btn primary" href="/coach/programs">Crear programa <Plus size={18} /></Link>
          </>
        }
      />

      <section className="grid">
        <article className="span12 coachHero">
          <div>
            <span className="eyebrow">Operacion diaria</span>
            <h2>Lo que cambie aqui debe aparecer en la app del cliente.</h2>
            <p>
              El entrenador trabaja con sus datos y su marca. PerformLabs mantiene
              la plataforma por debajo, pero el coach controla la experiencia diaria.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/coach/members">
                Revisar miembros <ArrowRight size={18} />
              </Link>
              <Link className="btn" href="/coach/checkins">
                Check-ins pendientes
              </Link>
            </div>
          </div>
          <div className="coachHeroPanel">
            <span className="tag">Workspace activo</span>
            <strong>{brand.appName}</strong>
            <p>{brand.name} tiene entrenamiento, nutricion, progreso y contenido editable desde esta consola.</p>
          </div>
        </article>

        {coachStats.map((stat) => (
          <article className="card span3 motionCard" key={stat.label}>
            <span className="metric">
              {stat.label}
              <strong>{stat.value}</strong>
            </span>
            <p>{stat.detail}</p>
          </article>
        ))}

        <article className="card span7 motionCard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Cola del coach</h2>
              <p>Trabajo real que mueve la experiencia del cliente final.</p>
            </div>
            <span className="tag">{dailyQueue.length} tareas</span>
          </div>
          <ul className="list">
            {dailyQueue.map((item) => (
              <li className="row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <Link className="tag" href={item.href}>{item.status}</Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span5 motionCard">
          <Dumbbell color="var(--gold)" />
          <h2>Primer flujo que vamos a conectar</h2>
          <p>
            Coach crea o edita un programa, asigna sesiones y ejercicios, y el
            miembro lo ve en `/app/workouts` con su progreso.
          </p>
          <div className="coachFlow">
            <span>Programa</span>
            <span>Sesiones</span>
            <span>Ejercicios</span>
            <span>App cliente</span>
          </div>
        </article>
      </section>
    </>
  );
}
