import { Send, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { isCoachBrainAiConfigured } from "@/lib/ai/coach-brain";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachBrain, getDefaultMember, listCoachAiMessages } from "@/lib/repositories/coach-brain";
import { askCoachAiAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberCoachAiPage() {
  const brand = await getSelectedMemberAppBrand();
  const brain = await getCoachBrain(brand.id);
  const aiReady = isCoachBrainAiConfigured();

  if (!brain.enabled) {
    return (
      <>
        <Topbar
          eyebrow="Coach IA"
          title="El asistente de tu coach."
          text="Tu coach aún no ha activado su asistente. Vuelve pronto: podrás resolver dudas de entreno y nutrición al instante, con sus reglas."
        />
        <section className="grid">
          <article className="card span12 inlineEmpty uiGlass uiSheen coachAiGate">
            <span className="uiIconChip coachAiGateChip"><Sparkles size={28} /></span>
            <strong>Próximamente.</strong>
            <p>Cuando tu coach lo active, aquí tendrás respuestas inmediatas en su voz: entreno, nutrición y sustituciones al instante.</p>
            <ul className="coachAiGateList">
              <li><Sparkles size={14} /> Dudas de entreno y técnica</li>
              <li><Sparkles size={14} /> Sustituciones de comidas</li>
              <li><Sparkles size={14} /> Con las reglas de tu coach</li>
            </ul>
          </article>
        </section>
      </>
    );
  }

  const member = await getDefaultMember(brand.id);
  const history = await listCoachAiMessages(brand.id, member?.id ?? null);

  return (
    <>
      <Topbar
        eyebrow="Coach IA"
        title={brain.assistantName}
        text="Resuelve tus dudas al instante: entreno, nutrición, sustituciones… con las reglas de tu coach. Para temas serios o dolor, te derivará a tu coach."
      />
      <section className="grid">
        <div className="span12 coachChat">
          <div className="coachChatThread">
            <div className="coachChatRow assistant">
              <span className="coachChatAvatar"><Sparkles size={16} /></span>
              <div className="coachChatBubble">{brain.greeting}</div>
            </div>
            {history.map((message) => (
              <div className={message.role === "user" ? "coachChatRow user" : "coachChatRow assistant"} key={message.id}>
                {message.role === "assistant" ? <span className="coachChatAvatar"><Sparkles size={16} /></span> : null}
                <div className="coachChatBubble">{message.content}</div>
              </div>
            ))}
          </div>

          <form action={askCoachAiAction} className="coachChatComposer">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="question" placeholder="Pregunta lo que necesites…" required autoComplete="off" maxLength={1000} />
            <SubmitButton variant="primary" aria-label="Enviar mensaje"><Send size={16} /></SubmitButton>
          </form>
          {!aiReady ? (
            <p className="coachChatHint">El asistente se está poniendo a punto. Tu pregunta queda registrada y tu coach la verá.</p>
          ) : (
            <p className="coachChatHint">Ej.: “¿Puedo cambiar el arroz por patata?” · “Me duele el hombro en press banca, ¿qué hago?” · “¿Cómo ajusto si no he dormido bien?”</p>
          )}
        </div>
      </section>
    </>
  );
}
