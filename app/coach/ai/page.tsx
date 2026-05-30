import { Brain, Gauge, MessageCircleQuestion, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { isCoachBrainAiConfigured } from "@/lib/ai/coach-brain";
import { AI_MONTHLY_LIMITS, getMonthlyAiUsage } from "@/lib/ai/usage";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachBrain, listRecentClientQuestions } from "@/lib/repositories/coach-brain";
import { saveCoachBrainAction } from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default async function CoachAiPage() {
  const brand = await getSelectedMemberAppBrand();
  const [brain, questions, usage] = await Promise.all([
    getCoachBrain(brand.id),
    listRecentClientQuestions(brand.id),
    getMonthlyAiUsage(brand.id),
  ]);
  const aiReady = isCoachBrainAiConfigured();
  const chatPct = Math.min(100, Math.round((usage.coachBrain / AI_MONTHLY_LIMITS.coach_brain) * 100));
  const planPct = Math.min(100, Math.round((usage.planGen / AI_MONTHLY_LIMITS.plan_gen) * 100));

  return (
    <>
      <Topbar
        eyebrow="Coach IA"
        title="Tu IA. Tu voz. Tus reglas."
        text="Entrena un asistente que responde a tus clientes como lo harías tú: con tu filosofía, tus protocolos y tus sustituciones. Cuanto más lo alimentes, más se parece a ti — y eso no lo puede copiar nadie."
      />
      <section className="grid">
        <article className={brain.enabled && aiReady ? "card span12 aiStatus live" : "card span12 aiStatus"}>
          <div>
            <Sparkles color="var(--accent)" />
            <div>
              <strong>
                {brain.enabled && aiReady
                  ? "Tu asistente está activo en la app de tus clientes."
                  : brain.enabled && !aiReady
                    ? "Activado por tu parte — se encenderá en cuanto la plataforma conecte el motor de IA."
                    : "Tu asistente está en borrador."}
              </strong>
              <p>
                {brain.enabled
                  ? "Tus clientes ven el chat “Coach IA” en su app y reciben respuestas en tu voz."
                  : "Rellena tu cerebro y actívalo para que aparezca en la app de tus clientes."}
              </p>
            </div>
          </div>
          <span className={brain.enabled ? "tag tagOn" : "tag"}>{brain.enabled ? "Activado" : "Borrador"}</span>
        </article>

        <form action={saveCoachBrainAction} className="card span8 coachBrainForm">
          <input name="workspaceId" type="hidden" value={brand.id} />

          <div className="sectionHeader">
            <div>
              <Brain color="var(--accent)" />
              <h2>El cerebro de tu asistente.</h2>
              <p>Esto es lo que hace que hable como tú. Sé específico: cuanto más detalle, más fiel.</p>
            </div>
          </div>

          <div className="formGrid">
            <label>
              Nombre del asistente
              <input name="assistantName" defaultValue={brain.assistantName} placeholder={`Asistente de ${brand.name}`} maxLength={80} />
            </label>
            <label className="coachBrainToggle">
              <input name="enabled" type="checkbox" defaultChecked={brain.enabled} />
              <span>Activar en la app de mis clientes</span>
            </label>
          </div>

          <label>
            Saludo inicial
            <textarea name="greeting" rows={2} defaultValue={brain.greeting} placeholder="El primer mensaje que ve el cliente al abrir el chat." maxLength={600} />
          </label>

          <label>
            Quién eres y tu filosofía
            <textarea name="persona" rows={4} defaultValue={brain.persona} placeholder="Soy entrenador de fuerza desde hace 10 años. Creo en el progreso lento y sostenible, sin dietas extremas. Priorizo técnica, adherencia y descanso por encima de matarse en el gym…" maxLength={4000} />
          </label>

          <label>
            Tono y forma de hablar
            <textarea name="tone" rows={3} defaultValue={brain.tone} placeholder="Cercano y motivador, tuteo siempre. Frases cortas. Directo pero empático. Sin tecnicismos innecesarios. Uso algún emoji con moderación 💪" maxLength={1500} />
          </label>

          <label>
            Especialidades y enfoque
            <textarea name="specialties" rows={2} defaultValue={brain.specialties} placeholder="Recomposición corporal, fuerza en mujeres, vuelta al gym tras lesión, nutrición flexible (IIFYM)…" maxLength={1500} />
          </label>

          <label>
            Reglas y protocolos (obligatorias para la IA)
            <textarea name="rules" rows={5} defaultValue={brain.rules} placeholder={"Reglas que el asistente DEBE seguir. Ej:\n- Nunca recomiendo ayunos de más de 16h.\n- El cardio se hace después de pesas, nunca antes.\n- Si el cliente no ha dormido 6h, recomiendo bajar intensidad.\n- Mínimo 1,8 g de proteína por kg de peso."} maxLength={6000} />
          </label>

          <label>
            Sustituciones permitidas
            <textarea name="substitutions" rows={3} defaultValue={brain.substitutions} placeholder={"Para responder dudas tipo “¿puedo cambiar X por Y?”. Ej:\n- Arroz ↔ patata ↔ quinoa, a igual gramaje de carbohidratos.\n- Pollo ↔ pavo ↔ pescado blanco.\n- Press banca ↔ press mancuernas si hay molestia de hombro."} maxLength={3000} />
          </label>

          <label>
            Lo que el asistente NUNCA debe hacer
            <textarea name="forbidden" rows={3} defaultValue={brain.forbidden} placeholder={"Ej:\n- Nunca recomendar suplementos concretos por marca.\n- Nunca dar dosis de medicación.\n- No prometer “bajar X kg en Y semanas”.\n- Ante dolor agudo, derivar siempre a consulta."} maxLength={3000} />
          </label>

          <SubmitButton className="btn primary" pendingLabel="Guardando…"><Wand2 size={18} /> Guardar mi cerebro de IA</SubmitButton>
        </form>

        <div className="span4 coachBrainSide">
          <article className="card coachBrainGenerator">
            <Wand2 color="var(--accent)" />
            <h3>Generador de planes IA</h3>
            <p>Convierte tu metodología en programas: la IA redacta el borrador con tus reglas y tú lo apruebas en un clic.</p>
            <Link className="btn primary" href="/coach/ai/plans"><Wand2 size={16} /> Abrir generador</Link>
          </article>
          <article className="card aiUsageCard">
            <Gauge color="var(--accent)" />
            <h3>Consumo de IA este mes</h3>
            <div className="aiUsageRow">
              <div className="aiUsageRowHead"><span>Consultas del cliente</span><small>{usage.coachBrain.toLocaleString("es-ES")} / {AI_MONTHLY_LIMITS.coach_brain.toLocaleString("es-ES")}</small></div>
              <div className="aiUsageBar"><span style={{ width: `${chatPct}%` }} /></div>
            </div>
            <div className="aiUsageRow">
              <div className="aiUsageRowHead"><span>Planes generados</span><small>{usage.planGen} / {AI_MONTHLY_LIMITS.plan_gen}</small></div>
              <div className="aiUsageBar"><span style={{ width: `${planPct}%` }} /></div>
            </div>
            <p>Tu plan incluye este volumen mensual. Tus clientes nunca se quedan sin atención: al alcanzar el límite, sus mensajes te llegan a ti.</p>
          </article>
          <article className="card">
            <ShieldCheck color="var(--accent)" />
            <h3>Tú mandas, siempre</h3>
            <p>El asistente nunca da consejo médico ni cambia tu plan por su cuenta: aplica tus reglas y, ante dudas serias o dolor, deriva al cliente a ti. Coach-in-the-loop.</p>
          </article>
          <article className="card">
            <MessageCircleQuestion color="var(--accent)" />
            <h3>Qué te preguntan</h3>
            {questions.length ? (
              <ul className="list coachBrainQuestions">
                {questions.map((question, index) => (
                  <li key={index}>
                    <span>{question.content.length > 90 ? `${question.content.slice(0, 90)}…` : question.content}</span>
                    <small>{question.memberName} · {timeAgo(question.createdAt)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Cuando tus clientes empiecen a preguntar, verás aquí las dudas más recientes. Oro puro para crear contenido y afinar tus reglas.</p>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
