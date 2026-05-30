import { Activity, ArrowRight, HeartPulse, Send, ShieldAlert, ShieldCheck, Sparkles, Trash2, TrendingDown } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { isRetentionCopilotConfigured } from "@/lib/ai/retention-copilot";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getRetentionRadar, type RetentionTier } from "@/lib/repositories/member-retention";
import { getOutreachStats, listOutreachDrafts } from "@/lib/repositories/retention-outreach";
import { dismissOutreachAction, draftRetentionNudgeAction, markOutreachSentAction } from "./actions";

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
  const [radar, drafts, outreachStats] = await Promise.all([
    getRetentionRadar(brand.id),
    listOutreachDrafts(brand.id),
    getOutreachStats(brand.id),
  ]);
  const { summary, members } = radar;
  const copilotReady = isRetentionCopilotConfigured();

  return (
    <>
      <Topbar
        eyebrow="Retención · Coach Copilot"
        title="Sabe quién se va — y reengánchalo en tu voz."
        text="Cada cliente tiene un score de riesgo. El copiloto te redacta el mensaje de reenganche con tu voz y tus reglas; tú lo revisas y lo envías. Convierte bajas en renovaciones."
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
          <p className="metric">Reenganches<strong>{outreachStats.sent}</strong></p>
          <p>Mensajes de retención enviados.</p>
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
              {members.map((member) => {
                const draft = drafts.get(member.id);
                const reasonStr = member.reasons.join(" · ");
                return (
                  <li className="retentionItem" key={member.id}>
                    <div className="retentionRow">
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
                        {member.tier !== "low" && !draft ? (
                          <form action={draftRetentionNudgeAction}>
                            <input name="workspaceId" type="hidden" value={brand.id} />
                            <input name="memberProfileId" type="hidden" value={member.id} />
                            <input name="memberName" type="hidden" value={member.fullName} />
                            <input name="reason" type="hidden" value={reasonStr} />
                            <input name="riskScore" type="hidden" value={member.riskScore} />
                            <SubmitButton className="btn primary" pendingLabel="Redactando…"><Sparkles size={14} /> Mensaje IA</SubmitButton>
                          </form>
                        ) : (
                          <Link className="btn" href="/coach/members">Abrir <ArrowRight size={14} /></Link>
                        )}
                      </div>
                    </div>

                    {draft ? (
                      <div className="retentionDraft">
                        <div className="retentionDraftBubble">
                          <span className="retentionDraftTag"><Sparkles size={12} /> Borrador en tu voz</span>
                          <p>{draft.message}</p>
                        </div>
                        <div className="retentionDraftActions">
                          <CopyButton text={draft.message} className="btn" label="Copiar" />
                          <form action={markOutreachSentAction}>
                            <input name="workspaceId" type="hidden" value={brand.id} />
                            <input name="outreachId" type="hidden" value={draft.id} />
                            <SubmitButton className="btn primary" pendingLabel="Guardando…"><Send size={14} /> Marcar enviado</SubmitButton>
                          </form>
                          <form action={dismissOutreachAction}>
                            <input name="workspaceId" type="hidden" value={brand.id} />
                            <input name="outreachId" type="hidden" value={draft.id} />
                            <SubmitButton className="btn ghost" pendingLabel="…"><Trash2 size={14} /> Descartar</SubmitButton>
                          </form>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {!copilotReady ? (
              <p className="coachChatHint">El copiloto redactará mensajes en cuanto la plataforma conecte el motor de IA. El radar ya funciona.</p>
            ) : null}
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
