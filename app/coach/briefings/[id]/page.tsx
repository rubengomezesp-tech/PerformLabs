import { AlertTriangle, ArrowLeft, ClipboardCheck, Dumbbell, Rocket, Save, Soup } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachBriefingDetail } from "@/lib/repositories/coach-dashboard";
import { applyCoachBriefingRecommendationAction, saveCoachBriefingReviewAction } from "../../actions";

export const dynamic = "force-dynamic";

type CoachBriefingDetailPageProps = {
  params: Promise<{ id: string }>;
};

function listText(items: string[]) {
  return items.length ? items.join(", ") : "";
}

function prettyDate(value: string) {
  return value ? value.slice(0, 10) : "Sin fecha";
}

export default async function CoachBriefingDetailPage({ params }: CoachBriefingDetailPageProps) {
  const { id } = await params;
  const brand = await getSelectedMemberAppBrand();
  const briefing = await getCoachBriefingDetail({ workspaceId: brand.id, responseId: id });

  if (!briefing) {
    notFound();
  }

  return (
    <>
      <Topbar
        eyebrow="Briefing coach"
        title={`Revisión de ${briefing.memberName}.`}
        text="Ajusta el criterio fino antes de publicar entrenamiento y nutrición. El cliente no ve nada genérico hasta que el coach aplica."
        actions={
          <Link className="btn" href="/coach">
            <ArrowLeft size={16} /> Volver
          </Link>
        }
      />

      <section className="grid">
        <article className="card span3">
          <ClipboardCheck color="var(--gold)" />
          <p className="metric">Estado<strong>{briefing.status}</strong></p>
          <p>Enviado {prettyDate(briefing.submittedAt)}</p>
        </article>
        <article className="card span3">
          <Dumbbell color="var(--gold)" />
          <p className="metric">Entreno<strong>{briefing.trainingDaysPerWeek ?? "-"} días</strong></p>
          <p>{briefing.sessionMinutes ?? "-"} minutos · {briefing.trainingLocation}</p>
        </article>
        <article className="card span3">
          <Soup color="var(--gold)" />
          <p className="metric">Nutrición<strong>{briefing.mealsPerDay ?? "-"} comidas</strong></p>
          <p>{briefing.hideMacros ? "Macros ocultos" : "Macros visibles"}</p>
        </article>
        <article className="card span3">
          <AlertTriangle color="var(--gold)" />
          <p className="metric">Bloqueos<strong>{briefing.recommendation.blockers.length}</strong></p>
          <p>{briefing.recommendation.blockers.length ? "Revisar antes de publicar" : "Sin bloqueos automáticos"}</p>
        </article>

        <article className="card span5 coachBriefingDetailPanel">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Datos recibidos</h2>
              <p>Contexto original del onboarding del cliente.</p>
            </div>
          </div>
          <ul className="list">
            <li className="row">Objetivo <span>{briefing.goal}</span></li>
            <li className="row">Entorno <span>{briefing.trainingLocation}</span></li>
            <li className="row">Equipo <span>{listText(briefing.availableEquipment) || "Sin detalle"}</span></li>
            <li className="row">Preferencias comida <span>{listText(briefing.preferredFoods) || "Sin detalle"}</span></li>
            <li className="row">Evita <span>{listText(briefing.dislikedFoods) || "Sin detalle"}</span></li>
          </ul>
          {briefing.notes ? (
            <div className="coachBriefingNotes">
              <span className="eyebrow">Notas del cliente</span>
              <p>{briefing.notes}</p>
            </div>
          ) : null}
        </article>

        <article className="card span7 coachBriefingDetailPanel">
          <div className="sectionHeader">
            <div>
              <Rocket color="var(--gold)" />
              <h2>Aplicación de planes</h2>
              <p>Revisión interna editable antes de publicar en la app cliente.</p>
            </div>
          </div>
          <form className="coachBriefingReviewForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="responseId" type="hidden" value={briefing.id} />
            <label className="spanFull">
              Objetivo de fase
              <input name="goal" defaultValue={briefing.goal} placeholder="Definición, fuerza, recomposición..." />
            </label>
            <label>
              Días por semana
              <input name="daysPerWeek" defaultValue={briefing.trainingDaysPerWeek ?? ""} min="1" max="7" type="number" />
            </label>
            <label>
              Comidas al día
              <input name="mealsPerDay" defaultValue={briefing.mealsPerDay ?? ""} min="1" max="8" type="number" />
            </label>
            <label className="toggleRow">
              <input name="hideMacros" type="checkbox" defaultChecked={briefing.hideMacros} />
              Ocultar macros al cliente
            </label>
            <label className="spanFull">
              Plantilla entrenamiento
              <select name="workoutTemplateId" defaultValue={briefing.workoutTemplateId}>
                <option value="">Usar recomendación por días</option>
                {briefing.workoutTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.daysPerWeek} días{template.goal ? ` · ${template.goal}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="spanFull">
              Plantilla nutricional
              <select name="dietTemplateId" defaultValue={briefing.dietTemplateId}>
                <option value="">Usar recomendación por objetivo</option>
                {briefing.dietTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.goal ? ` · ${template.goal}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="spanFull">
              Limitaciones o lesiones
              <textarea name="injuries" defaultValue={listText(briefing.injuries)} rows={3} />
            </label>
            <label className="spanFull">
              Alergias
              <textarea name="allergies" defaultValue={listText(briefing.allergies)} rows={3} />
            </label>
            <label className="spanFull">
              Restricciones internas
              <textarea name="restrictions" defaultValue={listText(briefing.restrictions)} rows={3} />
            </label>
            <label className="spanFull">
              Notas internas del coach
              <textarea name="coachNotes" defaultValue={briefing.coachNotes} rows={4} placeholder="Contexto, criterio, ajustes y cosas que no debe ver el cliente." />
            </label>
            {briefing.recommendation.blockers.length ? (
              <ul className="coachRecommendationBlockers spanFull">
                {briefing.recommendation.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : null}
            <div className="saveBar spanFull">
              <button className="btn" formAction={saveCoachBriefingReviewAction} type="submit">
                Guardar revisión sin publicar <Save size={16} />
              </button>
              <button className="btn primary" formAction={applyCoachBriefingRecommendationAction} type="submit">
                Aplicar planes <Rocket size={16} />
              </button>
            </div>
          </form>
        </article>
      </section>
    </>
  );
}
