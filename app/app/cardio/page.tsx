import { Activity, Bike, Clock3, Flame, Footprints, Gauge, HeartPulse, Plus, Repeat, Timer, Waves, Zap } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberCardioContext } from "@/lib/repositories/member-onboarding";
import { listCardioSessions, type CardioSession } from "@/lib/repositories/cardio";
import { logCardioSessionAction } from "./actions";

const MODALITIES: Array<{ value: string; label: string }> = [
  { value: "caminar", label: "Caminar" },
  { value: "correr", label: "Correr" },
  { value: "bici", label: "Bici" },
  { value: "eliptica", label: "Elíptica" },
  { value: "hiit", label: "HIIT" },
  { value: "remo", label: "Remo" },
];

const MODALITY_LABELS: Record<string, string> = Object.fromEntries(
  MODALITIES.map((modality) => [modality.value, modality.label]),
);

const INTENSITY_LABELS: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta" };

function modalityIcon(modality: string) {
  switch (modality) {
    case "caminar":
      return <Footprints size={16} />;
    case "bici":
      return <Bike size={16} />;
    case "remo":
      return <Waves size={16} />;
    case "hiit":
      return <Flame size={16} />;
    default:
      return <Activity size={16} />;
  }
}

function formatDate(iso: string) {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function SessionRow({ session }: { session: CardioSession }) {
  const meta: string[] = [];
  if (session.minutes) meta.push(`${session.minutes} min`);
  if (session.distanceKm) meta.push(`${session.distanceKm} km`);
  if (session.calories) meta.push(`${session.calories} kcal`);
  if (session.avgHr) meta.push(`${session.avgHr} ppm`);
  return (
    <li className="cardioSessionRow">
      <span className="cardioSessionIcon uiIconChip" aria-hidden>{modalityIcon(session.modality)}</span>
      <div className="cardioSessionBody">
        <div className="cardioSessionTop">
          <strong>{MODALITY_LABELS[session.modality] ?? session.modality}</strong>
          {session.intensity ? (
            <span className="cardioTag">{INTENSITY_LABELS[session.intensity] ?? session.intensity}</span>
          ) : null}
          <span className="cardioSessionDate">{formatDate(session.loggedOn)}</span>
        </div>
        {meta.length ? <p className="cardioSessionMeta">{meta.join(" · ")}</p> : null}
        {session.notes ? <p className="cardioSessionNotes">{session.notes}</p> : null}
      </div>
    </li>
  );
}

type CardioProtocol = {
  key: "hiit" | "liss";
  name: string;
  tagline: string;
  icon: typeof Zap;
  durationLabel: string;
  intensityLabel: string;
  bestFor: string;
  structure: Array<{ phase: string; detail: string }>;
  cues: string[];
};

const PROTOCOLS: CardioProtocol[] = [
  {
    key: "hiit",
    name: "HIIT",
    tagline: "Intervalos de alta intensidad",
    icon: Zap,
    durationLabel: "15-25 min",
    intensityLabel: "Alta · 8-9/10",
    bestFor: "Quemar en poco tiempo y mejorar capacidad anaeróbica.",
    structure: [
      { phase: "Calentamiento", detail: "3-5 min suave, subiendo pulsaciones de forma progresiva." },
      { phase: "Intervalos", detail: "8-12 rondas de 30 s fuerte / 60-90 s suave." },
      { phase: "Vuelta a la calma", detail: "3-5 min muy suave hasta normalizar el pulso." },
    ],
    cues: [
      "El tramo fuerte debe costar: no puedes mantener una conversación.",
      "Si no llegas al número de rondas, baja la intensidad antes que la técnica.",
      "Máximo 2-3 sesiones por semana para recuperar bien.",
    ],
  },
  {
    key: "liss",
    name: "LISS",
    tagline: "Baja intensidad y estado sostenido",
    icon: HeartPulse,
    durationLabel: "30-50 min",
    intensityLabel: "Baja · 4-5/10",
    bestFor: "Sumar gasto sin fatiga, ideal en días de descanso o definición.",
    structure: [
      { phase: "Arranque", detail: "5 min para encontrar un ritmo cómodo y constante." },
      { phase: "Bloque sostenido", detail: "25-40 min a ritmo en el que puedas hablar." },
      { phase: "Cierre", detail: "5 min bajando el ritmo poco a poco." },
    ],
    cues: [
      "Debes poder mantener una conversación todo el rato.",
      "Caminar en cuesta, bici o elíptica son perfectos.",
      "Puedes hacerlo casi a diario sin comprometer el entreno de fuerza.",
    ],
  },
];

export default async function CardioPage() {
  const brand = await getSelectedMemberAppBrand();
  const cardio = await getMemberCardioContext(brand.id);
  const { recent, week } = await listCardioSessions(brand.id);

  const recommended = cardio.preferredModality
    ? PROTOCOLS.find((protocol) => protocol.key === cardio.preferredModality) ?? null
    : null;
  const stepsTarget = cardio.dailyStepsTarget ?? 8000;
  const stepsLabel = stepsTarget.toLocaleString("es-ES");

  return (
    <>
      <Topbar
        eyebrow="Cardio"
        title="Tu cardio, con plan."
        text="Elige el tipo de cardio según tu día y tu objetivo. Aquí tienes cómo estructurarlo y a qué intensidad ir."
      />
      <section className="grid">
        <article className="span12 trnCardioHero uiGlass uiSheen uiFadeUp" style={{ ['--i' as string]: 0 }}>
          <div>
            <span className="trnCardioHeroEyebrow"><span className="uiIconChip trnCardioHeroChip"><HeartPulse size={18} /></span> <span className="eyebrow">Tu pauta</span></span>
            <h2>
              {recommended
                ? <>{recommended.name} es tu <span className="accentText">cardio recomendado</span></>
                : <>Combina <span className="accentText">HIIT y LISS</span> según tu semana</>}
            </h2>
            <p>
              {cardio.goal
                ? `Para tu objetivo (${cardio.goal}), apunta a unas ${cardio.weeklySessions} sesiones de cardio por semana.`
                : `Apunta a unas ${cardio.weeklySessions} sesiones de cardio por semana, combinando intensidades.`}
              {cardio.preference ? ` Indicaste que prefieres: ${cardio.preference}.` : ""}
            </p>
            <div className="trnCardioHeroMeta uiMeta">
              <span><Repeat size={16} /> {cardio.weeklySessions} sesiones/semana</span>
              <span><Footprints size={16} /> {stepsLabel} pasos/día</span>
              <span><Gauge size={16} /> {recommended ? recommended.intensityLabel : "Mixta"}</span>
            </div>
          </div>
          <div className="trnCardioStepsCard">
            <span className="uiIconChip is-active trnCardioStepsChip"><Footprints size={20} /></span>
            <div className="uiStat trnCardioStepsStat">
              <span className="uiStatValue">{stepsLabel}</span>
              <span className="uiStatLabel">pasos al día · NEAT</span>
            </div>
            <p>El NEAT (movimiento diario) suma tanto como una sesión de cardio. Camina cada día.</p>
          </div>
        </article>

        {PROTOCOLS.map((protocol, pi) => {
          const Icon = protocol.icon;
          const isRecommended = recommended?.key === protocol.key;
          return (
            <article className={`card span6 trnCardioCard uiSheen uiFadeUp${isRecommended ? " recommended selected" : ""}`} key={protocol.key} style={{ ['--i' as string]: pi + 1 }}>
              <div className="trnCardioCardHead">
                <span className="trnCardioIcon uiIconChip"><Icon size={20} /></span>
                <div>
                  <strong>{protocol.name}</strong>
                  <small>{protocol.tagline}</small>
                </div>
                {isRecommended ? <span className="tag success">Tu preferido</span> : null}
              </div>
              <div className="trnCardioStats">
                <span><Timer size={14} /> {protocol.durationLabel}</span>
                <span><Flame size={14} /> {protocol.intensityLabel}</span>
              </div>
              <p className="trnCardioBestFor">{protocol.bestFor}</p>
              <ol className="trnCardioStructure">
                {protocol.structure.map((step) => (
                  <li key={step.phase}>
                    <strong>{step.phase}</strong>
                    <span>{step.detail}</span>
                  </li>
                ))}
              </ol>
              <ul className="trnCardioCues">
                {protocol.cues.map((cue) => (
                  <li key={cue}><Activity size={13} /> {cue}</li>
                ))}
              </ul>
            </article>
          );
        })}

        <article className="card span6 cardioLogCard uiSheen uiFadeUp" style={{ ['--i' as string]: 3 }}>
          <header className="cardioCardHead">
            <span className="cardioCardIcon uiIconChip" aria-hidden><Plus size={18} /></span>
            <div>
              <h2>Registrar sesión</h2>
              <p>Apunta tu cardio de hoy. Solo el tipo es obligatorio.</p>
            </div>
          </header>
          <form action={logCardioSessionAction} className="cardioForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label className="cardioField">
              <span>Tipo de cardio</span>
              <select name="modality" defaultValue="caminar" required>
                {MODALITIES.map((modality) => (
                  <option key={modality.value} value={modality.value}>{modality.label}</option>
                ))}
              </select>
            </label>
            <label className="cardioField">
              <span>Intensidad</span>
              <select name="intensity" defaultValue="media">
                <option value="baja">Baja (LISS)</option>
                <option value="media">Media</option>
                <option value="alta">Alta (HIIT)</option>
              </select>
            </label>
            <div className="cardioFieldRow">
              <label className="cardioField">
                <span><Clock3 size={14} /> Minutos</span>
                <input name="minutes" type="number" min={1} max={600} inputMode="numeric" placeholder="Ej. 30" />
              </label>
              <label className="cardioField">
                <span><Gauge size={14} /> Distancia (km)</span>
                <input name="distanceKm" type="number" min={0} step="0.1" inputMode="decimal" placeholder="Ej. 5" />
              </label>
            </div>
            <div className="cardioFieldRow">
              <label className="cardioField">
                <span><Flame size={14} /> Calorías</span>
                <input name="calories" type="number" min={0} max={5000} inputMode="numeric" placeholder="Opcional" />
              </label>
              <label className="cardioField">
                <span><HeartPulse size={14} /> Pulso medio</span>
                <input name="avgHr" type="number" min={0} max={240} inputMode="numeric" placeholder="ppm" />
              </label>
            </div>
            <label className="cardioField">
              <span>Notas</span>
              <textarea name="notes" rows={2} maxLength={500} placeholder="Sensaciones, ritmo, incidencias..." />
            </label>
            <button className="btn primary cardioSubmit" type="submit"><Plus size={16} /> Guardar sesión</button>
          </form>
        </article>

        <article className="card span6 cardioRecentCard uiSheen uiFadeUp" style={{ ['--i' as string]: 4 }}>
          <header className="cardioCardHead">
            <span className="cardioCardIcon uiIconChip" aria-hidden><Timer size={18} /></span>
            <div>
              <h2>Tus últimas sesiones</h2>
              <p>Resumen de los últimos 7 días.</p>
            </div>
          </header>
          <div className="cardioWeekSummary" role="group" aria-label="Resumen semanal">
            <div className="cardioStat uiStat">
              <span className="cardioStatValue uiStatValue">{week.sessions}</span>
              <span className="cardioStatLabel uiStatLabel">Sesiones (7 días)</span>
            </div>
            <div className="cardioStat uiStat">
              <span className="cardioStatValue uiStatValue">{week.totalMinutes}</span>
              <span className="cardioStatLabel uiStatLabel">Minutos totales</span>
            </div>
          </div>
          {recent.length ? (
            <ul className="cardioSessionList">
              {recent.map((session) => (<SessionRow key={session.id} session={session} />))}
            </ul>
          ) : (
            <p className="cardioEmpty">Todavía no has registrado cardio. Cuando lo hagas, aparecerá aquí.</p>
          )}
        </article>

        <article className="card span12 trnCardioNote uiAccentCard uiSheen uiFadeUp" style={{ ['--i' as string]: 5 }}>
          <span className="uiIconChip trnCardioNoteChip"><HeartPulse size={20} /></span>
          <div>
            <strong>¿Cómo encajarlo con la fuerza?</strong>
            <p>
              Haz el cardio HIIT en días separados del entreno de piernas o después de la fuerza, nunca antes.
              El LISS puedes hacerlo cualquier día, incluso en descanso. Si algo te causa molestias, avisa a tu coach.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
