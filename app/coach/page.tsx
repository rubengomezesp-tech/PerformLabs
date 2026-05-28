import { Activity, ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, MessageSquareText, Plus, Rocket, Smartphone, Utensils } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachDashboard } from "@/lib/repositories/coach-dashboard";
import { applyCoachBriefingRecommendationAction, markCoachBriefingReviewedAction } from "./actions";

export const dynamic = "force-dynamic";

const severityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const statIcons = [Dumbbell, ClipboardCheck, Activity, Utensils];

function prettyDate(value: string) {
  return value ? value.slice(0, 10) : "Sin fecha";
}

export default async function CoachHomePage() {
  const brand = await getSelectedMemberAppBrand();
  const dashboard = await getCoachDashboard(brand.id);
  const hasAttention = dashboard.attentionQueue.length > 0;

  return (
    <>
      <Topbar
        eyebrow="Coach console"
        title={`Centro de mando de ${brand.name}.`}
        text="Prioridades, briefings, incidencias de dieta y actividad real de los clientes en una sola pantalla."
        actions={
          <>
            <Link className="btn" href="/app">Ver app cliente <Smartphone size={18} /></Link>
            <Link className="btn primary" href="/coach/members">Gestionar miembros <Plus size={18} /></Link>
          </>
        }
      />

      <section className="grid">
        <article className="span12 coachCommandHero">
          <div>
            <span className="eyebrow">Hoy</span>
            <h2>Resuelve primero lo que mueve resultados.</h2>
            <p>
              El coach no necesita buscar por toda la consola: aqui aparecen los clientes que
              esperan revision, las incidencias de comida y las senales de adherencia.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/coach/checkins">
                Revisar progreso <ArrowRight size={18} />
              </Link>
              <Link className="btn" href="/coach/programs">
                Ajustar programas
              </Link>
            </div>
          </div>
          <div className="coachCommandPanel">
            <span className={hasAttention ? "tag danger" : "tag"}>{hasAttention ? "Requiere accion" : "Todo en orden"}</span>
            <strong>{dashboard.attentionQueue.length}</strong>
            <p>tareas de coach priorizadas para proteger entreno, nutricion y retencion.</p>
          </div>
        </article>

        {dashboard.stats.map((stat, index) => {
          const Icon = statIcons[index] ?? Activity;
          return (
            <article className={`card span3 motionCard coachSignal ${stat.tone}`} key={stat.label}>
              <div className="coachSignalIcon"><Icon size={18} /></div>
              <span className="metric">
                {stat.label}
                <strong>{stat.value}</strong>
              </span>
              <p>{stat.detail}</p>
            </article>
          );
        })}

        <article className="card span7 motionCard coachAttentionCard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Prioridad de hoy</h2>
              <p>Lo que el entrenador debe resolver antes de tocar detalles secundarios.</p>
            </div>
            <span className="tag">{dashboard.attentionQueue.length} acciones</span>
          </div>
          {hasAttention ? (
            <div className="coachAttentionList">
              {dashboard.attentionQueue.map((item) => (
                <Link className={`coachAttentionItem ${item.severity}`} href={item.href} key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </span>
                  <small>{item.area}</small>
                  <em>{severityLabels[item.severity]}</em>
                </Link>
              ))}
            </div>
          ) : (
            <div className="coachEmptyPanel">
              <CheckCircle2 color="var(--green)" />
              <strong>Sin bloqueos abiertos.</strong>
              <p>Cuando un cliente mande briefing, check-in o una incidencia concreta, aparecera aqui.</p>
            </div>
          )}
        </article>

        <article className="card span5 motionCard coachActivityCard">
          <div className="sectionHeader">
            <div>
              <Activity color="var(--gold)" />
              <h2>Actividad reciente</h2>
              <p>Senales de clientes sin abrir pantalla por pantalla.</p>
            </div>
          </div>
          <div className="coachActivityTimeline">
            {dashboard.recentActivity.length ? dashboard.recentActivity.map((event) => (
              <div className="coachActivityEvent" key={event.id}>
                <span />
                <div>
                  <strong>{event.label}</strong>
                  <p>{event.memberName} · {event.detail}</p>
                  <small>{event.source} · {prettyDate(event.occurredAt)}</small>
                </div>
              </div>
            )) : (
              <div className="coachEmptyPanel compact">
                <MessageSquareText color="var(--soft)" />
                <strong>Aun no hay actividad.</strong>
                <p>La app empezara a llenar esta zona cuando el cliente registre entrenos, comidas o formularios.</p>
              </div>
            )}
          </div>
        </article>

        <article className="span12 coachBriefingsSection">
          <div className="sectionHeader">
            <div>
              <MessageSquareText color="var(--gold)" />
              <h2>Briefings de nuevos clientes</h2>
              <p>Datos de registro convertidos en decisiones practicas para entreno y nutricion.</p>
            </div>
            <Link className="btn" href="/coach/members">Abrir miembros <ArrowRight size={16} /></Link>
          </div>

          {dashboard.briefings.length ? (
            <div className="coachBriefingGrid">
              {dashboard.briefings.map((briefing) => (
                <article className={`coachBriefingCard ${briefing.status}`} key={briefing.id}>
                  <div className="sectionHeader compact">
                    <div>
                      <span className="eyebrow">{briefing.memberName}</span>
                      <h3>{briefing.goal}</h3>
                    </div>
                    <span className={briefing.status === "reviewed" || briefing.status === "applied" ? "tag" : "tag danger"}>
                      {briefing.status === "applied" ? "Publicado" : briefing.status === "reviewed" ? "Revisado" : "Nuevo"}
                    </span>
                  </div>
                  <div className="coachBriefingMetrics">
                    <span>{briefing.trainingDaysPerWeek ?? "-"}<small>dias</small></span>
                    <span>{briefing.sessionMinutes ?? "-"}<small>min</small></span>
                    <span>{briefing.mealsPerDay ?? "-"}<small>comidas</small></span>
                    <span>{briefing.trainingLocation}<small>entorno</small></span>
                  </div>
                  <ul className="coachBriefingHighlights">
                    {briefing.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <div className="coachRecommendationPanel">
                    <span className="eyebrow">Propuesta interna</span>
                    <div className="coachRecommendationGrid">
                      <span>
                        <small>Entreno</small>
                        <strong>{briefing.recommendation.trainingTemplate}</strong>
                      </span>
                      <span>
                        <small>Nutricion</small>
                        <strong>{briefing.recommendation.nutritionTemplate}</strong>
                      </span>
                    </div>
                    {briefing.recommendation.blockers.length ? (
                      <ul className="coachRecommendationBlockers">
                        {briefing.recommendation.blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Lista para que el coach la revise y la publique al cliente.</p>
                    )}
                  </div>
                  <div className="coachBriefingFooter">
                    <small>Enviado {prettyDate(briefing.submittedAt)}</small>
                    {briefing.status === "applied" ? (
                      <span className="tag">Plan publicado</span>
                    ) : (
                      <div className="coachBriefingActions">
                        <form action={applyCoachBriefingRecommendationAction}>
                          <input name="workspaceId" type="hidden" value={brand.id} />
                          <input name="responseId" type="hidden" value={briefing.id} />
                          <button
                            className="btn primary"
                            disabled={briefing.recommendation.blockers.some((blocker) => blocker.startsWith("Falta"))}
                            type="submit"
                          >
                            Aplicar planes <Rocket size={16} />
                          </button>
                        </form>
                        {briefing.status !== "reviewed" ? (
                          <form action={markCoachBriefingReviewedAction}>
                            <input name="workspaceId" type="hidden" value={brand.id} />
                            <input name="responseId" type="hidden" value={briefing.id} />
                            <button className="btn" type="submit">
                              Solo revisar <CheckCircle2 size={16} />
                            </button>
                          </form>
                        ) : null}
                        <Link className="btn" href={`/coach/briefings/${briefing.id}`}>
                          Revisar detalle <ArrowRight size={16} />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="coachEmptyPanel">
              <MessageSquareText color="var(--soft)" />
              <strong>No hay briefings todavia.</strong>
              <p>Cuando un cliente complete su formulario inicial, el entrenador lo vera aqui resumido.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
