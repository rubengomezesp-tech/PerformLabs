import { Camera, CheckCircle2, ClipboardCheck, LineChart, Ruler, Scale, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberCheckinSummary } from "@/lib/repositories/checkin-management";
import { createMemberCheckinAction } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  ["resumen", "Resumen"],
  ["fotos", "Fotos"],
  ["medidas", "Medidas"],
  ["historial", "Historial"],
] as const;

const measureFields = [
  ["Cintura", "waistCm", "cm"],
  ["Pecho", "chestCm", "cm"],
  ["Cadera", "hipCm", "cm"],
];

function Sparkline({ points }: { points: Array<{ date: string; weightKg: number }> }) {
  if (points.length < 2) return null;
  const width = 320;
  const height = 96;
  const pad = 10;
  const values = points.map((point) => point.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = pad + index * stepX;
    const y = pad + (1 - (point.weightKg - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${height} L${coords[0][0].toFixed(1)} ${height} Z`;

  return (
    <svg className="progressSpark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Evolución del peso">
      <path d={area} fill="var(--accent)" opacity={0.12} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

type ProgressPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const tab = TABS.some(([key]) => key === params?.tab) ? (params!.tab as string) : "resumen";

  const brand = await getSelectedMemberAppBrand();
  const summary = await getMemberCheckinSummary(brand.id);
  const latest = summary.latest;
  const weightTrend = summary.weightTrend;
  const totalWeightDelta = weightTrend.length > 1 ? weightTrend[weightTrend.length - 1].weightKg - weightTrend[0].weightKg : null;
  const weightDeltaLabel = totalWeightDelta !== null ? `${totalWeightDelta > 0 ? "+" : ""}${totalWeightDelta.toFixed(1)} kg vs inicio` : "Sin histórico";
  const losingWeight = totalWeightDelta !== null && totalWeightDelta < 0;

  return (
    <>
      <Topbar
        eyebrow="Progreso"
        title="Mide tu progreso."
        text="Tu peso, tus medidas y tus fotos en un solo sitio, con el contexto que el coach necesita para ajustar tu plan."
      />
      <nav className="progressTabs" aria-label="Secciones de progreso">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/app/progress?tab=${key}`} className={tab === key ? "progressTab active" : "progressTab"}>
            {label}
          </Link>
        ))}
      </nav>
      <section className="grid">
        {tab === "resumen" ? (
          <>
            <article className="card span6 progressMetricCard">
              <span className="eyebrow"><Scale size={15} /> Peso actual</span>
              <strong className="progressMetric">{latest?.values.weightKg ? `${latest.values.weightKg} kg` : "Sin dato"}</strong>
              {totalWeightDelta !== null ? (
                <span className={losingWeight ? "progressDelta down" : "progressDelta"}>
                  {losingWeight ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {weightDeltaLabel}
                </span>
              ) : (
                <span className="progressDelta muted">Registra tu primer check-in</span>
              )}
            </article>

            <article className="card span6 progressMetricCard">
              <span className="eyebrow"><LineChart size={15} /> Grasa corporal</span>
              <strong className="progressMetric">{latest?.values.bodyFatPercent ? `${latest.values.bodyFatPercent}%` : "Sin dato"}</strong>
              <span className="progressDelta muted">{latest?.submittedAt ? `Último check-in · ${latest.submittedAt.slice(0, 10)}` : "Aún sin check-ins"}</span>
            </article>

            <article className="card span12 progressEvolutionCard">
              <div className="sectionHeader">
                <div>
                  <h2>Evolución</h2>
                  <p>Tu peso a lo largo de los check-ins enviados.</p>
                </div>
                <span className="tag">{weightDeltaLabel}</span>
              </div>
              {weightTrend.length > 1 ? (
                <>
                  <Sparkline points={weightTrend} />
                  <div className="progressSparkAxis">
                    <span>{weightTrend[0].date || "inicio"}</span>
                    <span>{weightTrend[weightTrend.length - 1].date || "hoy"}</span>
                  </div>
                </>
              ) : (
                <p className="muted">Cuando envíes varios check-ins, aquí verás tu gráfico de evolución.</p>
              )}
            </article>

            <Link href="/app/progress?tab=fotos" className="card span12 panelCheckinCard">
              <div>
                <span className="eyebrow"><Camera size={15} /> Fotos de progreso</span>
                <h2>{latest?.photosAvailable ? "Fotos incluidas en tu último check-in." : "Sube tus fotos de progreso."}</h2>
              </div>
              <span className={latest?.photosAvailable ? "tag" : "tag danger"}>{latest?.photosAvailable ? "Incluidas" : "Pendientes"}</span>
            </Link>
          </>
        ) : null}

        {tab === "fotos" ? (
          <article className="card span12">
            <div className="sectionHeader">
              <div>
                <Camera color="var(--accent)" />
                <h2>Fotos de progreso.</h2>
                <p>Frontal, lateral y espalda. Se adjuntan en tu check-in para que el coach compare tu evolución.</p>
              </div>
              <span className={latest?.photosAvailable ? "tag" : "tag danger"}>{latest?.photosAvailable ? "Incluidas" : "Pendientes"}</span>
            </div>
            <p className="muted">Las fotos se suben al enviar tu check-in semanal en la pestaña Medidas.</p>
            <Link className="btn primary" href="/app/progress?tab=medidas">Ir a enviar check-in <CheckCircle2 size={16} /></Link>
          </article>
        ) : null}

        {tab === "medidas" ? (
          <article className="card span12 checkinFormCard">
            <div className="sectionHeader">
              <div>
                <ClipboardCheck color="var(--accent)" />
                <h2>Enviar check-in.</h2>
                <p>Completa medidas, adherencia y sensaciones para que el coach revise con contexto real.</p>
              </div>
              <span className="tag">{brand.appName}</span>
            </div>
            <form action={createMemberCheckinAction} className="checkinGridForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <label>Peso kg<input name="weightKg" placeholder="82.4" /></label>
              <label>Grasa %<input name="bodyFatPercent" placeholder="16" /></label>
              {measureFields.map(([label, key, suffix]) => (
                <label key={key}>{label} {suffix}<input name={key} placeholder="Medida" /></label>
              ))}
              <label>Energía
                <select name="energy" defaultValue="normal">
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label>Sueño
                <select name="sleepQuality" defaultValue="correcto">
                  <option value="excelente">Excelente</option>
                  <option value="correcto">Correcto</option>
                  <option value="malo">Malo</option>
                </select>
              </label>
              <label>Digestión
                <select name="digestion" defaultValue="normal">
                  <option value="normal">Normal</option>
                  <option value="pesada">Pesada</option>
                  <option value="irregular">Irregular</option>
                </select>
              </label>
              <label>Entreno %<input name="trainingAdherence" placeholder="85" /></label>
              <label>Nutrición %<input name="nutritionAdherence" placeholder="90" /></label>
              <label className="toggleRow">Fotos subidas<input name="photosAvailable" type="checkbox" /></label>
              <label className="spanFull">Sensaciones y notas
                <textarea name="notes" rows={4} placeholder="Hambre, estrés, molestias, entrenamiento, comidas, ciclo, energía..." />
              </label>
              <button className="btn primary" type="submit">Enviar check-in <CheckCircle2 size={16} /></button>
            </form>
          </article>
        ) : null}

        {tab === "historial" ? (
          <>
            <article className="card span4 memberProgressCard">
              <TrendingUp color="var(--accent)" />
              <h2>Estado de revisión</h2>
              <ul className="list">
                <li className="row">Check-ins enviados <strong>{summary.total}</strong></li>
                <li className="row">Pendientes del coach <span className="tag">{summary.pendingCoachReview}</span></li>
                <li className="row">Último resultado <strong>{latest?.resultsStatus ?? "Pendiente"}</strong></li>
              </ul>
            </article>

            <article className="card span8">
              <div className="sectionHeader">
                <div>
                  <Ruler color="var(--accent)" />
                  <h2>Histórico de peso</h2>
                </div>
                <span className="tag">{weightDeltaLabel}</span>
              </div>
              {weightTrend.length ? (
                <ul className="list">
                  {weightTrend.slice(-10).reverse().map((point) => (
                    <li className="row" key={point.date}>{point.date || "Sin fecha"}<strong>{point.weightKg} kg</strong></li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Aún no hay check-ins con peso registrado.</p>
              )}
            </article>

            {latest ? (
              <article className="card span12">
                <div className="sectionHeader">
                  <div>
                    <Ruler color="var(--accent)" />
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
          </>
        ) : null}
      </section>
    </>
  );
}
