import { Activity, Flame, Footprints, Gauge, HeartPulse, Repeat, Timer, Zap } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberCardioContext } from "@/lib/repositories/member-onboarding";

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
        <article className="span12 trnCardioHero">
          <div>
            <span className="eyebrow">Tu pauta</span>
            <h2>
              {recommended
                ? `${recommended.name} es tu cardio recomendado`
                : "Combina HIIT y LISS según tu semana"}
            </h2>
            <p>
              {cardio.goal
                ? `Para tu objetivo (${cardio.goal}), apunta a unas ${cardio.weeklySessions} sesiones de cardio por semana.`
                : `Apunta a unas ${cardio.weeklySessions} sesiones de cardio por semana, combinando intensidades.`}
              {cardio.preference ? ` Indicaste que prefieres: ${cardio.preference}.` : ""}
            </p>
            <div className="trnCardioHeroMeta">
              <span><Repeat size={16} /> {cardio.weeklySessions} sesiones/semana</span>
              <span><Footprints size={16} /> {stepsLabel} pasos/día</span>
              <span><Gauge size={16} /> {recommended ? recommended.intensityLabel : "Mixta"}</span>
            </div>
          </div>
          <div className="trnCardioStepsCard">
            <Footprints size={22} />
            <strong>{stepsLabel}</strong>
            <small>pasos al día</small>
            <p>El NEAT (movimiento diario) suma tanto como una sesión de cardio. Camina cada día.</p>
          </div>
        </article>

        {PROTOCOLS.map((protocol) => {
          const Icon = protocol.icon;
          const isRecommended = recommended?.key === protocol.key;
          return (
            <article className={isRecommended ? "card span6 trnCardioCard recommended" : "card span6 trnCardioCard"} key={protocol.key}>
              <div className="trnCardioCardHead">
                <span className="trnCardioIcon"><Icon size={20} /></span>
                <div>
                  <strong>{protocol.name}</strong>
                  <small>{protocol.tagline}</small>
                </div>
                {isRecommended ? <span className="tag">Tu preferido</span> : null}
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

        <article className="card span12 trnCardioNote">
          <HeartPulse color="var(--accent)" />
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
