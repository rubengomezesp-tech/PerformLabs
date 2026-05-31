import { CalendarDays, Flame, Trophy, Users } from "lucide-react";
import { MemberEmpty } from "@/components/member-empty";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listMemberChallenges, metricLabel } from "@/lib/repositories/challenges";
import { joinChallengeAction } from "./actions";

export const dynamic = "force-dynamic";

function fmt(d: string) {
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : d;
}

function daysLeft(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (!Number.isFinite(ms)) return "";
  const days = Math.ceil(ms / 86_400_000);
  if (days < 0) return "Finalizado";
  if (days === 0) return "Último día";
  return `Quedan ${days} día${days === 1 ? "" : "s"}`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function MemberChallengesPage() {
  const brand = await getSelectedMemberAppBrand();
  const challenges = await listMemberChallenges(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Retos"
        title="Compite, suma y no pares."
        text="Retos de tu marca con clasificación en directo. Lo que se mide y se celebra, se repite."
      />
      <section className="grid">
        {challenges.length ? (
          challenges.map((c, idx) => {
            const pct = Math.min(100, Math.round((c.myCount / Math.max(1, c.goal)) * 100));
            return (
              <article className="card span6 challengeCard uiSheen uiFadeUp" style={{ ["--i" as string]: idx }} key={c.id}>
                <div className="challengeHead">
                  <span className="challengeTrophy"><Trophy size={18} /></span>
                  <div>
                    <strong>{c.title}</strong>
                    <small><CalendarDays size={12} /> {fmt(c.startsOn)} – {fmt(c.endsOn)} · {daysLeft(c.endsOn)}</small>
                  </div>
                  <span className="tag">{c.goal} {metricLabel(c.metric)}</span>
                </div>
                {c.description ? <p className="challengeDesc">{c.description}</p> : null}

                {c.joined ? (
                  <div className="challengeProgress">
                    <div className="challengeProgressHead">
                      <span><Flame size={14} /> Vas {c.myCount}/{c.goal} {metricLabel(c.metric)}</span>
                      {c.myRank ? <span className="challengeRank">Puesto #{c.myRank} de {c.participants}</span> : null}
                    </div>
                    <div className="challengeBar"><span style={{ width: `${pct}%` }} /></div>
                  </div>
                ) : (
                  <form action={joinChallengeAction} className="challengeJoin">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="challengeId" type="hidden" value={c.id} />
                    <SubmitButton className="btn primary" pendingLabel="Uniéndote…"><Trophy size={16} /> Unirme al reto</SubmitButton>
                    <span className="challengeMeta"><Users size={13} /> {c.participants} participando</span>
                  </form>
                )}

                {c.leaderboard.length ? (
                  <ol className="challengeBoard">
                    {c.leaderboard.map((e) => (
                      <li className={c.myRank === e.rank ? "challengeBoardRow me" : "challengeBoardRow"} key={e.memberProfileId}>
                        <span className="challengePos">{MEDAL[e.rank - 1] ?? e.rank}</span>
                        <span className="challengeName">{e.name}</span>
                        <b>{e.count}</b>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </article>
            );
          })
        ) : (
          <MemberEmpty
            icon={Trophy}
            title="Aún no hay retos activos."
            text="Cuando tu coach lance un reto, aquí podrás unirte y ver la clasificación en directo."
          />
        )}
      </section>
    </>
  );
}
