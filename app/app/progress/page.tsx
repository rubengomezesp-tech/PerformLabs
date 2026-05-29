import { Camera, CheckCircle2, ClipboardCheck, Ruler, Scale, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberCheckinSummary } from "@/lib/repositories/checkin-management";
import { createMemberCheckinAction } from "./actions";

export const dynamic = "force-dynamic";

const measureFields = [
  ["Cintura", "waistCm", "cm"],
  ["Pecho", "chestCm", "cm"],
  ["Cadera", "hipCm", "cm"],
];

export default async function ProgressPage() {
  const brand = await getSelectedMemberAppBrand();
  const summary = await getMemberCheckinSummary(brand.id);
  const latest = summary.latest;
  const weightTrend = summary.weightTrend;
  const totalWeightDelta = weightTrend.length > 1
    ? weightTrend[weightTrend.length - 1].weightKg - weightTrend[0].weightKg
    : null;
  const weightDeltaLabel = totalWeightDelta !== null
    ? `${totalWeightDelta > 0 ? "+" : ""}${totalWeightDelta.toFixed(1)} kg`
    : "—";

  return (
    <>
      <Topbar
        eyebrow="Mi recorrido"
        title="Fotos, peso y medidas."
        text="Registra tu transformación y deja al coach la información necesaria para ajustar tu siguiente fase."
      />
      <section className="grid">
        <article className="card span4 memberProgressCard">
          <TrendingUp color="var(--gold)" />
          <h2>Estado de revisión</h2>
          <ul className="list">
            <li className="row">Check-ins enviados <strong>{summary.total}</strong></li>
            <li className="row">Pendientes del coach <span className="tag">{summary.pendingCoachReview}</span></li>
            <li className="row">Último resultado <strong>{latest?.resultsStatus ?? "Pendiente"}</strong></li>
          </ul>
        </article>

        <article className="card span4">
          <Scale color="var(--gold)" />
          <h2>Peso actual</h2>
          <p className="metric">
            {latest?.values.weightKg ? `${latest.values.weightKg} kg` : "Sin dato"}
            <strong>{latest?.submittedAt ? latest.submittedAt.slice(0, 10) : "Primer check-in"}</strong>
          </p>
        </article>

        <article className="card span4">
          <Camera color="var(--gold)" />
          <h2>Fotos</h2>
          <p>{latest?.photosAvailable ? "Fotos marcadas como subidas en el último check-in." : "Añade fotos frontal, lateral y espalda cuando toque revisión."}</p>
          <span className={latest?.photosAvailable ? "tag" : "tag danger"}>{latest?.photosAvailable ? "Incluidas" : "Pendientes"}</span>
        </article>

        {weightTrend.length > 1 ? (
          <article className="card span12 memberProgressCard">
            <div className="sectionHeader">
              <div>
                <TrendingUp color="var(--gold)" />
                <h2>Tendencia de peso.</h2>
                <p>Tu evolución a lo largo de los check-ins enviados.</p>
              </div>
              <span className="tag">{weightDeltaLabel}</span>
            </div>
            <ul className="list">
              {weightTrend.slice(-8).map((point) => (
                <li className="row" key={point.date}>{point.date || "Sin fecha"}<strong>{point.weightKg} kg</strong></li>
              ))}
            </ul>
          </article>
        ) : null}

        <article className="card span12 checkinFormCard">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Enviar check-in.</h2>
              <p>Completa medidas, adherencia y sensaciones para que el coach revise con contexto real.</p>
            </div>
            <span className="tag">{brand.appName}</span>
          </div>
          <form action={createMemberCheckinAction} className="checkinGridForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>
              Peso kg
              <input name="weightKg" placeholder="82.4" />
            </label>
            <label>
              Grasa %
              <input name="bodyFatPercent" placeholder="16" />
            </label>
            {measureFields.map(([label, key, suffix]) => (
              <label key={key}>
                {label} {suffix}
                <input name={key} placeholder="Medida" />
              </label>
            ))}
            <label>
              Energía
              <select name="energy" defaultValue="normal">
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <label>
              Sueño
              <select name="sleepQuality" defaultValue="correcto">
                <option value="excelente">Excelente</option>
                <option value="correcto">Correcto</option>
                <option value="malo">Malo</option>
              </select>
            </label>
            <label>
              Digestión
              <select name="digestion" defaultValue="normal">
                <option value="normal">Normal</option>
                <option value="pesada">Pesada</option>
                <option value="irregular">Irregular</option>
              </select>
            </label>
            <label>
              Entreno %
              <input name="trainingAdherence" placeholder="85" />
            </label>
            <label>
              Nutrición %
              <input name="nutritionAdherence" placeholder="90" />
            </label>
            <label className="toggleRow">
              Fotos subidas
              <input name="photosAvailable" type="checkbox" />
            </label>
            <label className="spanFull">
              Sensaciones y notas
              <textarea name="notes" rows={4} placeholder="Hambre, estrés, molestias, entrenamiento, comidas, ciclo, energía..." />
            </label>
            <button className="btn primary" type="submit">
              Enviar check-in <CheckCircle2 size={16} />
            </button>
          </form>
        </article>

        {latest ? (
          <article className="card span12">
            <div className="sectionHeader">
              <div>
                <Ruler color="var(--gold)" />
                <h2>Último feedback del coach.</h2>
                <p>{latest.reviewedAt ? `Revisado el ${latest.reviewedAt.slice(0, 10)}` : "Todavía pendiente de revisión."}</p>
              </div>
              <span className="tag">{latest.status}</span>
            </div>
            <ul className="list">
              <li className="row">Peso <strong>{latest.values.weightKg ? `${latest.values.weightKg} kg` : "Sin dato"}</strong></li>
              <li className="row">Grasa <strong>{latest.values.bodyFatPercent ? `${latest.values.bodyFatPercent}%` : "Sin dato"}</strong></li>
              <li className="row">Cintura <strong>{latest.values.waistCm ? `${latest.values.waistCm} cm` : "Sin dato"}</strong></li>
              <li className="row">Feedback <span>{latest.values.coachFeedback || "Pendiente"}</span></li>
              <li className="row">Siguiente acción <span>{latest.values.nextActions || "Pendiente"}</span></li>
            </ul>
          </article>
        ) : null}
      </section>
    </>
  );
}
