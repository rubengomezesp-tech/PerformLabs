import { Activity, BedDouble, CalendarOff, Footprints, Gauge, HeartPulse, Moon, RefreshCcw, Sparkles, StretchHorizontal, Timer, TrendingDown, Waves } from "lucide-react";
import { DAY_MS } from "@/lib/utils/dates";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberCardioContext } from "@/lib/repositories/member-onboarding";
import { getMemberCheckinSummary } from "@/lib/repositories/checkin-management";

export const dynamic = "force-dynamic";

const ENERGY_SCORE: Record<string, number> = { alta: 100, normal: 68, baja: 38 };
const SLEEP_SCORE: Record<string, number> = { excelente: 100, correcto: 70, malo: 35 };
const ENERGY_LABEL: Record<string, string> = { alta: "Alta", normal: "Normal", baja: "Baja" };
const SLEEP_LABEL: Record<string, string> = { excelente: "Excelente", correcto: "Correcto", malo: "Malo" };

type Band = { label: string; tone: "success" | "accent" | "warning" | "danger"; note: string };

function readinessBand(score: number): Band {
  if (score >= 80) return { label: "Óptima", tone: "success", note: "Recuperado. Buen día para entrenar fuerte o subir intensidad." };
  if (score >= 60) return { label: "Buena", tone: "accent", note: "Listo para entrenar. Mantén tu plan y cuida la técnica." };
  if (score >= 40) return { label: "Moderada", tone: "warning", note: "Entrena, pero modera el volumen y prioriza el descanso de hoy." };
  return { label: "Baja", tone: "danger", note: "Tu cuerpo pide recuperación. Considera un día suave o de descanso." };
}

const SLEEP_TIPS = [
  "Hora fija para acostarte y levantarte, también el fin de semana.",
  "Sin pantallas 45 min antes; habitación fresca y a oscuras.",
  "Evita cafeína 8 h antes y cenas muy copiosas justo antes de dormir.",
];

const REST_SIGNS = [
  "Frecuencia cardiaca en reposo más alta de lo normal.",
  "Fuerza o ánimo a la baja varios días seguidos.",
  "Sueño peor, más irritabilidad o molestias persistentes.",
];

const MOBILITY: Array<{ name: string; detail: string; time: string; icon: typeof StretchHorizontal }> = [
  { name: "Movilidad de cadera", detail: "Zancada con rotación de tronco, alterna lados.", time: "60 s/lado", icon: StretchHorizontal },
  { name: "Gato-camello", detail: "Flexo-extensión de columna, controlando la respiración.", time: "60 s", icon: RefreshCcw },
  { name: "Apertura torácica", detail: "Tumbado de lado, abre el brazo y sigue con la mirada.", time: "45 s/lado", icon: Waves },
  { name: "Estiramiento de isquios", detail: "Suave, sin rebotes, hasta notar tensión cómoda.", time: "45 s/lado", icon: StretchHorizontal },
  { name: "Respiración diafragmática", detail: "Inhala 4 s, exhala 6 s para bajar pulsaciones.", time: "2 min", icon: HeartPulse },
];

export default async function RecoveryPage() {
  const brand = await getSelectedMemberAppBrand();
  const summary = await getMemberCheckinSummary(brand.id);
  const cardio = await getMemberCardioContext(brand.id);

  const latest = summary.latest;
  const energyKey = latest?.values.energy ?? "";
  const sleepKey = latest?.values.sleepQuality ?? "";
  const energyVal = energyKey in ENERGY_SCORE ? ENERGY_SCORE[energyKey] : undefined;
  const sleepVal = sleepKey in SLEEP_SCORE ? SLEEP_SCORE[sleepKey] : undefined;
  const parts = [energyVal, sleepVal].filter((value): value is number => typeof value === "number");
  const readiness = parts.length ? Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length) : null;
  const band = readiness !== null ? readinessBand(readiness) : null;

  const daysSince = latest?.submittedAt
    ? Math.floor((Date.now() - new Date(latest.submittedAt).getTime()) / DAY_MS)
    : null;
  const stale = daysSince !== null && daysSince > 10;

  return (
    <>
      <Topbar
        eyebrow="Recuperación"
        title="Recupera para progresar."
        text="El músculo crece y te adaptas en el descanso, no en el entreno. Aquí tienes tu readiness, tu sueño y cómo recuperar mejor."
      />
      <section className="grid">
        <article className="span12 recoveryHero uiGlass uiSheen uiFadeUp" style={{ ["--i" as string]: 0 }}>
          {readiness !== null && band ? (
            <>
              <ProgressRing
                value={readiness}
                display={String(readiness)}
                label="Readiness"
                sublabel={band.label}
                tone={band.tone}
                size={132}
                stroke={12}
              />
              <div className="recoveryHeroBody">
                <span className="recoveryHeroEyebrow"><span className="uiIconChip"><Sparkles size={16} /></span> <span className="eyebrow">Tu recuperación hoy</span></span>
                <h2>Recuperación <span className="accentText">{band.label.toLowerCase()}</span></h2>
                <p>{band.note}</p>
                <div className="uiMeta recoveryFactors">
                  <span><Moon size={15} /> Sueño: {SLEEP_LABEL[sleepKey] ?? "—"}</span>
                  <span><Gauge size={15} /> Energía: {ENERGY_LABEL[energyKey] ?? "—"}</span>
                  <span><RefreshCcw size={15} /> {daysSince === 0 ? "Hoy" : daysSince === 1 ? "Hace 1 día" : `Hace ${daysSince} días`}</span>
                </div>
                {stale ? <p className="recoveryStale">Tu último check-in tiene más de 10 días. <Link href="/app/progress?tab=medidas">Actualízalo</Link> para un readiness fiel.</p> : null}
              </div>
            </>
          ) : (
            <div className="recoveryHeroBody recoveryHeroEmpty">
              <span className="recoveryHeroEyebrow"><span className="uiIconChip"><Sparkles size={16} /></span> <span className="eyebrow">Tu recuperación</span></span>
              <h2>Calcula tu <span className="accentText">readiness</span></h2>
              <p>Envía un check-in con tu sueño y tu energía y calcularemos cada día cómo de recuperado estás para entrenar.</p>
              <Link className="btn primary" href="/app/progress?tab=medidas"><HeartPulse size={16} /> Enviar check-in</Link>
            </div>
          )}
        </article>

        <article className="card span6 uiSheen uiFadeUp" style={{ ["--i" as string]: 1 }}>
          <header className="cardioCardHead">
            <span className="cardioCardIcon uiIconChip" aria-hidden><BedDouble size={18} /></span>
            <div>
              <h2>Sueño</h2>
              <p>El factor de recuperación número uno. Apunta a 7-9 h de calidad.</p>
            </div>
          </header>
          <div className="recoveryTargetRow">
            <span className="uiStat"><span className="uiStatValue">7-9 h</span><span className="uiStatLabel">objetivo por noche</span></span>
            <span className="tag">{SLEEP_LABEL[sleepKey] ? `Último: ${SLEEP_LABEL[sleepKey]}` : "Sin dato aún"}</span>
          </div>
          <ul className="recoveryTipList">
            {SLEEP_TIPS.map((tip) => (<li key={tip}><Moon size={14} /> {tip}</li>))}
          </ul>
          <Link className="btn" href="/app/progress?tab=medidas">Registrar sueño en el check-in</Link>
        </article>

        <article className="card span6 uiSheen uiFadeUp" style={{ ["--i" as string]: 2 }}>
          <header className="cardioCardHead">
            <span className="cardioCardIcon uiIconChip" aria-hidden><CalendarOff size={18} /></span>
            <div>
              <h2>Descanso y deload</h2>
              <p>{cardio.goal ? `Para tu objetivo (${cardio.goal}), descansa con intención.` : "Descansar con intención también es entrenar."}</p>
            </div>
          </header>
          <ul className="recoveryTipList">
            <li><CalendarOff size={14} /> Reserva <strong>1-2 días</strong> de descanso completo a la semana.</li>
            <li><TrendingDown size={14} /> Cada <strong>4-8 semanas</strong>, una semana de descarga (deload): baja series e intensidad.</li>
            <li><Activity size={14} /> En descanso, muévete suave: pasos, movilidad o LISS.</li>
          </ul>
          <div className="recoverySigns">
            <strong>Señales de que necesitas parar</strong>
            <ul className="recoveryTipList">
              {REST_SIGNS.map((sign) => (<li key={sign}><HeartPulse size={14} /> {sign}</li>))}
            </ul>
          </div>
        </article>

        <article className="card span12 uiSheen uiFadeUp" style={{ ["--i" as string]: 3 }}>
          <header className="cardioCardHead">
            <span className="cardioCardIcon uiIconChip" aria-hidden><StretchHorizontal size={18} /></span>
            <div>
              <h2>Rutina de movilidad</h2>
              <p>5-8 minutos para recuperar y moverte mejor. Ideal en días de descanso o tras entrenar.</p>
            </div>
          </header>
          <ol className="recoveryMoves">
            {MOBILITY.map((move) => {
              const Icon = move.icon;
              return (
                <li className="recoveryMove" key={move.name}>
                  <span className="recoveryMoveIcon uiIconChip" aria-hidden><Icon size={16} /></span>
                  <div>
                    <strong>{move.name}</strong>
                    <span>{move.detail}</span>
                  </div>
                  <span className="recoveryMoveTime"><Timer size={13} /> {move.time}</span>
                </li>
              );
            })}
          </ol>
        </article>

        <article className="card span12 uiAccentCard uiSheen uiFadeUp recoveryActive" style={{ ["--i" as string]: 4 }}>
          <span className="uiIconChip"><Footprints size={20} /></span>
          <div>
            <strong>Recuperación activa</strong>
            <p>Un paseo, bici suave o estiramientos aceleran la recuperación más que el reposo total. Suma pasos sin fatiga y vuelve fresco al siguiente entreno.</p>
          </div>
          <Link className="btn" href="/app/cardio"><Waves size={15} /> Ver cardio LISS</Link>
        </article>
      </section>
    </>
  );
}
