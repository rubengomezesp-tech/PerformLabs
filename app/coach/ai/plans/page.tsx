import { AlertTriangle, CheckCircle2, Dumbbell, Sparkles, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { isPlanGeneratorConfigured } from "@/lib/ai/plan-generator";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachBrain } from "@/lib/repositories/coach-brain";
import { listPlanDrafts } from "@/lib/repositories/coach-plan-drafts";
import { approvePlanDraftAction, discardPlanDraftAction, generatePlanDraftAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function CoachAiPlansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const brand = await getSelectedMemberAppBrand();
  const [brain, drafts] = await Promise.all([getCoachBrain(brand.id), listPlanDrafts(brand.id)]);
  const aiReady = isPlanGeneratorConfigured();

  return (
    <>
      <Topbar
        eyebrow="Generador IA"
        title="Planes en tu metodología, en segundos."
        text="La IA redacta un borrador siguiendo tus reglas y tu filosofía. Tú revisas y apruebas: nada llega al cliente sin tu visto bueno."
      />
      <section className="grid">
        {params?.error ? (
          <article className="card span12 aiStatus" style={{ borderColor: "color-mix(in srgb, #e5484d 45%, var(--border))" }}>
            <div>
              <AlertTriangle color="#e5484d" />
              <div>
                <strong>No se pudo generar el plan.</strong>
                <p>{params.error}</p>
              </div>
            </div>
          </article>
        ) : null}

        {!brain.persona && !brain.rules ? (
          <article className="card span12 aiStatus">
            <div>
              <Sparkles color="var(--accent)" />
              <div>
                <strong>Afina primero tu cerebro de IA.</strong>
                <p>Cuanto más definas tu metodología y tus reglas, más se parecerán los planes a los que harías tú.</p>
              </div>
            </div>
            <Link className="btn" href="/coach/ai">Configurar Coach IA</Link>
          </article>
        ) : null}

        <form action={generatePlanDraftAction} className="card span5 coachBrainForm">
          <input name="workspaceId" type="hidden" value={brand.id} />
          <div className="sectionHeader">
            <div>
              <Wand2 color="var(--accent)" />
              <h2>Brief del cliente</h2>
              <p>Dame el contexto y genero el borrador con tus reglas.</p>
            </div>
          </div>

          <label>
            Objetivo
            <input name="goal" placeholder="Hipertrofia, fuerza, recomposición…" required />
          </label>
          <div className="formGrid">
            <label>
              Nivel
              <select name="level" defaultValue="intermedio">
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </label>
            <label>
              Dónde entrena
              <select name="location" defaultValue="gym">
                <option value="gym">Gimnasio</option>
                <option value="casa">Casa</option>
                <option value="híbrido">Híbrido</option>
              </select>
            </label>
            <label>
              Días/semana
              <input name="daysPerWeek" type="number" min={1} max={7} defaultValue={4} />
            </label>
            <label>
              Min/sesión
              <input name="sessionMinutes" type="number" min={20} max={150} defaultValue={60} />
            </label>
          </div>
          <label>
            Lesiones / limitaciones
            <input name="injuries" placeholder="Hombro derecho, lumbar…" />
          </label>
          <label>
            Notas para la IA
            <textarea name="focusNotes" rows={3} placeholder="Quiere enfocar glúteo, viaja 1 semana al mes, prefiere mancuernas…" />
          </label>

          <SubmitButton className="btn primary" pendingLabel="Generando plan…"><Sparkles size={18} /> Generar borrador</SubmitButton>
          {!aiReady ? <p className="coachChatHint">El motor de IA se activará cuando la plataforma conecte la clave. Tus briefs quedarán listos.</p> : null}
        </form>

        <div className="span7 planDraftList">
          {drafts.length ? (
            drafts.map((draft) => (
              <article className={draft.status === "approved" ? "card planDraft approved" : "card planDraft"} key={draft.id}>
                <div className="planDraftHead">
                  <div>
                    <strong>{draft.plan.name}</strong>
                    {draft.status === "approved" ? (
                      <span className="tag tagOn"><CheckCircle2 size={12} /> Aprobado</span>
                    ) : (
                      <span className="tag">Borrador</span>
                    )}
                  </div>
                  <small>{draft.plan.days.length} día(s) · {draft.brief.goal || draft.kind}</small>
                </div>

                {draft.plan.summary ? <p className="planDraftSummary">{draft.plan.summary}</p> : null}

                <div className="planDraftDays">
                  {draft.plan.days.map((day) => (
                    <div className="planDraftDay" key={day.day}>
                      <strong><Dumbbell size={14} /> {day.title}</strong>
                      <ul>
                        {day.exercises.map((exercise, index) => (
                          <li key={index}>
                            <span>{exercise.name}</span>
                            <small>{exercise.sets}×{exercise.reps} · desc {exercise.rest}{exercise.notes ? ` · ${exercise.notes}` : ""}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {draft.plan.progression ? (
                  <p className="planDraftProgression"><strong>Progresión:</strong> {draft.plan.progression}</p>
                ) : null}

                {draft.status === "approved" ? (
                  <div className="planDraftActions">
                    <Link className="btn" href="/coach/programs">Ver en Programas →</Link>
                  </div>
                ) : (
                  <div className="planDraftActions">
                    <form action={approvePlanDraftAction}>
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="draftId" type="hidden" value={draft.id} />
                      <SubmitButton className="btn primary" pendingLabel="Aprobando…"><CheckCircle2 size={16} /> Aprobar y crear programa</SubmitButton>
                    </form>
                    <form action={discardPlanDraftAction}>
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="draftId" type="hidden" value={draft.id} />
                      <SubmitButton className="btn ghost" pendingLabel="Descartando…"><Trash2 size={16} /> Descartar</SubmitButton>
                    </form>
                  </div>
                )}
              </article>
            ))
          ) : (
            <article className="card inlineEmpty">
              <Sparkles color="var(--accent)" />
              <strong>Genera tu primer plan.</strong>
              <p>Rellena el brief y la IA redactará un borrador con tu metodología para que lo revises.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
