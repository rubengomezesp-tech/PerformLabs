import { CalendarDays, Trophy, Users } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listCoachChallenges, metricLabel } from "@/lib/repositories/challenges";
import { createChallengeAction, endChallengeAction } from "./actions";

export const dynamic = "force-dynamic";

function fmt(d: string) {
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : d;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function CoachChallengesPage() {
  const brand = await getSelectedMemberAppBrand();
  const challenges = await listCoachChallenges(brand.id);
  const today = new Date().toISOString().slice(0, 10);
  const in28 = new Date(Date.now() + 28 * 86_400_000).toISOString().slice(0, 10);

  return (
    <>
      <Topbar
        eyebrow="Retos"
        title="Lanza retos y enciende a tu comunidad."
        text="La gamificación es de las palancas con más evidencia para la retención. Crea un reto, el ranking se calcula solo con la actividad real."
      />
      <section className="grid">
        <article className="card span5 coachBrainForm">
          <div className="sectionHeader">
            <div>
              <Trophy color="var(--accent)" />
              <h2>Nuevo reto</h2>
              <p>La clasificación se calcula con datos reales de tus clientes.</p>
            </div>
          </div>
          <form action={createChallengeAction} className="coachBrainForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>Título<input name="title" placeholder="Reto de 12 entrenos" required maxLength={120} /></label>
            <label>Descripción<textarea name="description" rows={2} placeholder="Completa los entrenos del mes y compite con el grupo." maxLength={600} /></label>
            <div className="formGrid">
              <label>
                Métrica
                <select name="metric" defaultValue="workouts">
                  <option value="workouts">Entrenos completados</option>
                  <option value="habits">Hábitos cumplidos</option>
                  <option value="checkins">Check-ins enviados</option>
                </select>
              </label>
              <label>Objetivo<input name="goal" type="number" min={1} max={1000} defaultValue={12} /></label>
              <label>Empieza<input name="startsOn" type="date" defaultValue={today} /></label>
              <label>Termina<input name="endsOn" type="date" defaultValue={in28} /></label>
            </div>
            <SubmitButton className="btn primary" pendingLabel="Creando…"><Trophy size={16} /> Lanzar reto</SubmitButton>
          </form>
        </article>

        <div className="span7 challengeList">
          {challenges.length ? (
            challenges.map((c) => (
              <article className={c.status === "ended" ? "card challengeCard ended" : "card challengeCard"} key={c.id}>
                <div className="challengeHead">
                  <span className="challengeTrophy"><Trophy size={18} /></span>
                  <div>
                    <strong>{c.title}</strong>
                    <small><CalendarDays size={12} /> {fmt(c.startsOn)} – {fmt(c.endsOn)} · <Users size={12} /> {c.participants}</small>
                  </div>
                  <span className={c.status === "ended" ? "tag neutral" : "tag"}>{c.status === "ended" ? "Finalizado" : `${c.goal} ${metricLabel(c.metric)}`}</span>
                </div>
                {c.leaderboard.length ? (
                  <ol className="challengeBoard">
                    {c.leaderboard.map((e) => (
                      <li className="challengeBoardRow" key={e.memberProfileId}>
                        <span className="challengePos">{MEDAL[e.rank - 1] ?? e.rank}</span>
                        <span className="challengeName">{e.name}</span>
                        <b>{e.count}</b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="challengeDesc">Aún sin participantes. Compártelo con tus clientes.</p>
                )}
                {c.status !== "ended" ? (
                  <form action={endChallengeAction} className="challengeJoin">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="challengeId" type="hidden" value={c.id} />
                    <SubmitButton className="btn ghost" pendingLabel="…">Finalizar reto</SubmitButton>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <article className="card inlineEmpty">
              <Trophy color="var(--accent)" />
              <strong>Lanza tu primer reto.</strong>
              <p>Un reto de entrenos o hábitos del mes dispara la participación y la retención.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
