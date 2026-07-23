import { Camera, CheckCircle2, ClipboardCheck, LineChart, Ruler, Scale, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CheckinPhotosField } from "@/components/member/checkin-photos-field";
import { PushOptIn } from "@/components/push-optin";
import { SubmitButton } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { type ReactNode } from "react";
import { getMemberOwnProgress, type MeasurementSummary } from "@/lib/repositories/checkin-management";
import { getMemberContext } from "@/lib/auth/member-access";
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

// Premium trend chart: gradient area, dashed gridlines with min/max value labels,
// per-point dots and an emphasised latest reading. Pure SVG so it renders on the
// server, scales uniformly, and carries a descriptive a11y label.
function Sparkline({ points, label, unit }: { points: Array<{ date: string; value: number }>; label: string; unit?: string }) {
  if (points.length < 2) return null;
  const width = 324;
  const height = 120;
  const padL = 40;
  const padR = 14;
  const padT = 14;
  const padB = 14;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const xAt = (index: number) => padL + (index * plotW) / (points.length - 1);
  const yAt = (value: number) => padT + (1 - (value - min) / range) * plotH;
  const coords = points.map((point, index) => [xAt(index), yAt(point.value)] as const);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const baseline = (padT + plotH).toFixed(1);
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${baseline} L${coords[0][0].toFixed(1)} ${baseline} Z`;
  const gradId = `spark-${label.replace(/[^a-zA-Z0-9]/g, "")}`;
  const fmt = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
  const gridLines = [max, (max + min) / 2, min];
  const [lastX, lastY] = coords[coords.length - 1];
  const suffix = unit ? ` ${unit}` : "";

  return (
    <svg className="progressSpark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Evolución de ${label.toLowerCase()}: de ${fmt(values[0])} a ${fmt(points[points.length - 1].value)}${suffix}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((value, index) => {
        const gy = yAt(value);
        return (
          <g key={index}>
            <line className="progressChartGrid" x1={padL} y1={gy.toFixed(1)} x2={width - padR} y2={gy.toFixed(1)} />
            <text className="progressChartAxis" x={padL - 7} y={(gy + 3).toFixed(1)} textAnchor="end">{fmt(value)}</text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gradId})`} />
      <path className="progressChartLine" d={line} />
      {coords.slice(0, -1).map(([cx, cy], index) => (
        <circle key={index} className="progressChartDot" cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={2.3} />
      ))}
      <circle className="progressChartHalo" cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={6} />
      <circle className="progressChartLast" cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={3.6} />
    </svg>
  );
}

// Compact, label-free trend used inside the KPI metric cards (decorative).
function MiniSpark({ points }: { points: Array<{ date: string; value: number }> }) {
  if (points.length < 2) return null;
  const width = 120;
  const height = 34;
  const pad = 3;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((point, index) => [pad + index * stepX, pad + (1 - (point.value - min) / range) * (height - pad * 2)] as const);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  return (
    <svg className="progressMiniSpark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={2.4} fill="var(--accent)" />
    </svg>
  );
}

function formatMeasure(measure: MeasurementSummary) {
  return measure.current !== null ? `${measure.current} ${measure.unit}` : "Sin dato";
}

// Direction-aware delta vs the previous check-in. Colour only when there is a
// clear reading (weight/fat/waist lower-is-better); chest/hip stay neutral.
function DeltaTag({ measure }: { measure: MeasurementSummary }) {
  if (measure.current === null) return <span className="progressDelta muted">Sin dato</span>;
  if (measure.delta === null) return <span className="progressDelta muted">Primer registro</span>;
  if (measure.delta === 0) return <span className="progressDelta muted">Sin cambio</span>;
  const down = measure.delta < 0;
  const tone = measure.goodWhenDown === true ? (down ? "down" : "up") : "neutral";
  return (
    <span className={`progressDelta ${tone}`}>
      {down ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {measure.delta > 0 ? "+" : ""}{measure.delta} {measure.unit} vs anterior
    </span>
  );
}

function MetricCard({ measure, icon, i }: { measure: MeasurementSummary; icon: ReactNode; i: number }) {
  return (
    <article className="card span4 progressMetricCard uiSheen uiFadeUp" style={{ ["--i" as string]: i }}>
      <span className="progressMetricHead"><span className="uiIconChip">{icon}</span> <span className="uiStatLabel">{measure.label}</span></span>
      <strong className="progressMetric uiStatValue">{formatMeasure(measure)}</strong>
      <DeltaTag measure={measure} />
      {measure.trend.length > 1 ? <MiniSpark points={measure.trend} /> : null}
    </article>
  );
}

type ProgressPageProps = {
  searchParams?: Promise<{ tab?: string; enviado?: string; error?: string }>;
};

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const tab = TABS.some(([key]) => key === params?.tab) ? (params!.tab as string) : "resumen";
  const justSubmitted = params?.enviado === "1";
  const submitError = typeof params?.error === "string" ? params.error : "";

  const brand = await getSelectedMemberAppBrand();
  // Member-scoped: a member only ever sees their OWN check-ins, measurements and photos.
  const context = await getMemberContext(brand.id);
  const summary = await getMemberOwnProgress(brand.id, context?.memberProfileId ?? "");
  const latest = summary.latest;
  const weightTrend = summary.weightTrend;
  const totalWeightDelta = weightTrend.length > 1 ? weightTrend[weightTrend.length - 1].weightKg - weightTrend[0].weightKg : null;
  const weightDeltaLabel = totalWeightDelta !== null ? `${totalWeightDelta > 0 ? "+" : ""}${totalWeightDelta.toFixed(1)} kg vs inicio` : "Sin histórico";

  const measureByKey = Object.fromEntries(summary.measurements.map((measure) => [measure.key, measure])) as Record<MeasurementSummary["key"], MeasurementSummary>;
  const keyMetrics = (["weightKg", "bodyFatPercent", "waistCm"] as const).map((key) => measureByKey[key]);
  const sparkMetrics = keyMetrics.filter((measure) => measure.trend.length > 1);
  const perimeters = (["chestCm", "hipCm"] as const).map((key) => measureByKey[key]);

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
            {keyMetrics.every((m) => m.current === null) ? (
              <article className="card span12 progressFirstCheckinCard uiFadeUp" style={{ ["--i" as string]: 0 }}>
                <span className="uiIconChip"><Scale size={18} /></span>
                <div>
                  <h2>Aún no hay medidas registradas.</h2>
                  <p>Envía tu primer check-in con peso, grasa y cintura para ver aquí tus métricas y su evolución.</p>
                </div>
                <a className="btn primary" href="/app/progress?tab=medidas">Enviar primer check-in <CheckCircle2 size={16} /></a>
              </article>
            ) : (
              <>
                <MetricCard measure={measureByKey.weightKg} icon={<Scale size={16} />} i={0} />
                <MetricCard measure={measureByKey.bodyFatPercent} icon={<LineChart size={16} />} i={1} />
                <MetricCard measure={measureByKey.waistCm} icon={<Ruler size={16} />} i={2} />
              </>
            )}

            <article className="card span12 progressEvolutionCard uiFadeUp" style={{ ["--i" as string]: 3 }}>
              <div className="sectionHeader">
                <div>
                  <h2>Evolución</h2>
                  <p>Peso, grasa y cintura a lo largo de tus check-ins.</p>
                </div>
                <span className="tag">{summary.total} check-in(s)</span>
              </div>
              {sparkMetrics.length ? (
                <div className="progressSparkGrid">
                  {sparkMetrics.map((measure) => (
                    <div className="progressSparkItem" key={measure.key}>
                      <div className="progressSparkHead">
                        <span className="progressSparkLabel">{measure.label}</span>
                        <DeltaTag measure={measure} />
                      </div>
                      <Sparkline points={measure.trend} label={measure.label} unit={measure.unit} />
                      <div className="progressSparkAxis">
                        <span>{measure.trend[0].date || "inicio"}</span>
                        <span>{measure.trend[measure.trend.length - 1].date || "hoy"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="progressInlineEmpty">
                  <span className="uiIconChip"><LineChart size={18} /></span>
                  <p>Cuando envíes varios check-ins, aquí verás tus gráficos de evolución de peso, grasa y cintura.</p>
                </div>
              )}
            </article>

            <article className="card span6 progressPerimCard uiFadeUp" style={{ ["--i" as string]: 4 }}>
              <div className="sectionHeader">
                <div>
                  <Ruler color="var(--accent)" />
                  <h2>Perímetros</h2>
                  <p>Pecho y cadera frente a tu check-in anterior.</p>
                </div>
              </div>
              <ul className="list">
                {perimeters.map((measure) => (
                  <li className="row" key={measure.key}>
                    {measure.label}
                    <span className="progressPerimValue">
                      <strong>{formatMeasure(measure)}</strong>
                      <DeltaTag measure={measure} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <Link href="/app/progress?tab=fotos" className="card span6 panelCheckinCard uiFadeUp" style={{ ["--i" as string]: 5 }}>
              <div>
                <span className="eyebrow"><span className="uiIconChip"><Camera size={16} /></span> Fotos de progreso</span>
                <h2>{latest?.photosAvailable ? "Fotos incluidas en tu último check-in." : "Sube tus fotos de progreso."}</h2>
              </div>
              <span className={latest?.photosAvailable ? "tag" : "tag danger"}>{latest?.photosAvailable ? "Incluidas" : "Pendientes"}</span>
            </Link>
          </>
        ) : null}

        {tab === "fotos" ? (
          <article className="card span12 uiGlass progressPhotosCard">
            <div className="sectionHeader">
              <div>
                <span className="uiIconChip"><Camera size={18} /></span>
                <h2>Mi evolución en fotos.</h2>
                <p>Frontal, lateral y espalda. Se adjuntan en tu check-in para que el coach compare tu evolución semana a semana.</p>
              </div>
              <span className={latest?.photosAvailable ? "tag" : "tag danger"}>{latest?.photosAvailable ? "Incluidas" : "Pendientes"}</span>
            </div>
            {summary.photoUrls.length ? (
              <>
                {summary.photosTakenAt ? (
                  <p className="muted">Fotos de tu check-in del {new Date(summary.photosTakenAt).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}.</p>
                ) : null}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                  {summary.photoUrls.map((url, idx) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="uiFadeUp"
                      style={{ display: "block", aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", ["--i" as string]: idx }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Foto de progreso ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="progressPhotoSlots">
                {(["Frontal", "Lateral", "Espalda"] as const).map((angle, idx) => (
                  <figure className="progressPhotoSlot uiFadeUp" key={angle} style={{ ["--i" as string]: idx }}>
                    <div className="progressPhotoFrame" aria-hidden="true"><Camera size={20} /></div>
                    <figcaption>{angle}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <p className="muted">Las fotos se suben al enviar tu check-in semanal en la pestaña Medidas. Quedan privadas entre tú y tu coach.</p>
            <Link className="btn primary" href="/app/progress?tab=medidas">{summary.photoUrls.length ? "Enviar nuevo check-in" : "Ir a enviar check-in"} <CheckCircle2 size={16} /></Link>
          </article>
        ) : null}

        {tab === "medidas" && justSubmitted ? (
          <article className="card span12 uiGlass checkinSubmittedCard" aria-live="polite">
            <div className="sectionHeader">
              <div>
                <span className="uiIconChip"><CheckCircle2 size={18} /></span>
                <h2>Check-in enviado.</h2>
                <p>Tu coach acaba de recibirlo. Esto es lo que pasa ahora:</p>
              </div>
            </div>
            <ol className="list checkinSubmittedSteps">
              <li className="row"><strong>1.</strong> Recibido — tus medidas, fotos y notas ya están guardadas.</li>
              <li className="row"><strong>2.</strong> Tu coach lo revisa y te deja feedback con la siguiente acción.</li>
              <li className="row"><strong>3.</strong> Te avisamos en cuanto lo revise.</li>
            </ol>
            <div className="checkinSubmittedPush">
              <p>¿Quieres saber al instante cuando tu coach lo revise?</p>
              <PushOptIn />
            </div>
            <Link className="btn" href="/app/progress?tab=historial">Ver mi historial <TrendingUp size={16} /></Link>
          </article>
        ) : null}

        {tab === "medidas" && !justSubmitted ? (
          <article className="card span12 checkinFormCard">
            <div className="sectionHeader">
              <div>
                <ClipboardCheck color="var(--accent)" />
                <h2>Enviar check-in.</h2>
                <p>Completa medidas, adherencia y sensaciones para que el coach revise con contexto real.</p>
              </div>
              <span className="tag">{brand.appName}</span>
            </div>
            {submitError ? <p className="fieldError" role="alert">{submitError}</p> : null}
            <form action={createMemberCheckinAction} className="checkinGridForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <label>Peso kg<input name="weightKg" inputMode="decimal" placeholder="82.4" /></label>
              <label>Grasa %<input name="bodyFatPercent" inputMode="decimal" placeholder="16" /></label>
              {measureFields.map(([label, key, suffix]) => (
                <label key={key}>{label} {suffix}<input name={key} inputMode="decimal" placeholder="Medida" /></label>
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
              <label>Entreno %<input name="trainingAdherence" inputMode="decimal" placeholder="85" /></label>
              <label>Nutrición %<input name="nutritionAdherence" inputMode="decimal" placeholder="90" /></label>
              <CheckinPhotosField />
              <label className="spanFull">Sensaciones y notas
                <textarea name="notes" rows={4} placeholder="Hambre, estrés, molestias, entrenamiento, comidas, ciclo, energía..." />
              </label>
              <SubmitButton variant="primary">Enviar check-in <CheckCircle2 size={16} /></SubmitButton>
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
