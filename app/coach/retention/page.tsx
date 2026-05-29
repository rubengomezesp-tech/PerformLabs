import { Activity, ArrowRight, HeartPulse, ShieldAlert, ShieldCheck, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getRetentionRadar, type RetentionTier } from "@/lib/repositories/member-retention";

export const dynamic = "force-dynamic";

const tierLabel: Record<RetentionTier, string> = {
  high: "Riesgo alto",
  medium: "Vigilar",
  low: "Estable",
};

function activityLabel(days: number | null) {
  if (days === null) return "Sin señal";
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} d`;
}

export default async function CoachRetentionPage() {
  const brand = await getSelectedMemberAppBrand();
  const radar = await getRetentionRadar(brand.id);
  const { summary, members } = radar;

  return (
    <>
      <Topbar
        eyebrow="Retención · Gemelo digital"
        title="Sabe quién se va antes de que se vaya."
        text="Cada cliente tiene un score de riesgo calculado con su actividad, adherencia y check-ins. Actúa sobre el rojo y conviertes bajas en renovaciones."
      />
      <section className="grid">
        <article className="card span3 motionCard">
          <p className="metric">Clientes activos<strong>{summary.activeMembers}</strong></p>
          <p>En seguimiento ahora mismo.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric" style={{ color: "#e5484d" }}>En riesgo<strong>{summary.atRisk}</strong></p>
          <p>Probabilidad alta de abandono. Actúa hoy.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric" style={{ color: "#f5a623" }}>A vigilar<strong>{summary.watch}</strong></p>
          <p>Señales tempranas. Un mensaje a tiempo.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Adherencia<strong>{summary.avgAdherence}%</strong></p>
          <p>Entrenan en las últimas 2 semanas.</p>
        </article>

        {members.length ? (
          <article className="card span12 retentionPanel">
            <div className="sectionHeader">
              <div>
                <HeartPulse color="var(--accent)" />
                <h2>Radar de clientes</h2>
                <p>Ordenado por riesgo. Lo más urgente, arriba.</p>
              </div>
            </div>
            <ul className="retentionList">
              {members.map((member) => (
                <li className="retentionRow" key={member.id}>
                  <div className={`riskPill ${member.tier}`}>
                    {member.tier === "high" ? <ShieldAlert size={15} /> : member.tier === "medium" ? <TrendingDown size={15} /> : <ShieldCheck size={15} />}
                    <span>{member.riskScore}</span>
                  </div>
                  <div className="retentionMember">
                    <strong>{member.fullName}</strong>
                    <small>{tierLabel[member.tier]}{member.goal ? ` · ${member.goal}` : ""}</small>
                    {member.reasons.length ? (
                      <div className="retentionReasons">
                        {member.reasons.map((reason, index) => (
                          <span className="retentionReason" key={index}>{reason}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="retentionSignals">
                    <span><Activity size={13} /> {activityLabel(member.daysSinceActivity)}</span>
                    <span>{member.workoutsLast14} entreno(s)/2sem</span>
                  </div>
                  <div className="retentionAction">
                    <span>{member.recommendedAction}</span>
                    <Link className="btn" href="/coach/members">Abrir <ArrowRight size={14} /></Link>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ) : (
          <article className="card span12 inlineEmpty">
            <HeartPulse color="var(--accent)" />
            <strong>Aún no hay datos de retención.</strong>
            <p>Cuando tus clientes empiecen a entrenar, registrar comidas y hacer check-ins, aquí verás quién necesita tu atención antes de que sea tarde.</p>
          </article>
        )}
      </section>
    </>
  );
}
