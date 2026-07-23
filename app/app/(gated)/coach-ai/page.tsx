import { Dumbbell, Sparkles, Target, Utensils } from "lucide-react";
import { CoachChatClient, type ChatMessage } from "@/components/coach-chat-client";
import { Topbar } from "@/components/topbar";
import { isCoachBrainAiConfigured } from "@/lib/ai/coach-chat";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCoachBrain, getDefaultMember, listCoachAiMessages } from "@/lib/repositories/coach-brain";

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
              <li><Dumbbell size={14} /> Dudas de entreno y técnica</li>
              <li><Utensils size={14} /> Sustituciones de comidas</li>
              <li><Target size={14} /> Con las reglas de tu coach</li>
            </ul>
          </article>
        </section>
      </>
    );
  }

  const member = await getDefaultMember(brand.id);

  if (!member) {
    return (
      <>
        <Topbar
          eyebrow="Coach IA"
          title={brain.assistantName}
          text="No se pudo cargar tu perfil de cliente. Recarga la página o habla con tu coach."
        />
        <section className="grid">
          <article className="card span12 inlineEmpty">
            <p>No se encontró un perfil activo para tu cuenta en este espacio. Contacta con tu coach para que lo active.</p>
          </article>
        </section>
      </>
    );
  }

  const history = await listCoachAiMessages(brand.id, member.id);
  const initialMessages: ChatMessage[] = history.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" as const : "assistant" as const,
    content: m.content,
  }));
  const hint = aiReady
    ? "Ej.: ¿Puedo cambiar el arroz por patata? Me duele el hombro en press banca, ¿qué hago? ¿Cómo ajusto si no he dormido bien?"
    : "El asistente se está poniendo a punto. Tu pregunta queda registrada y tu coach la verá.";

  return (
    <>
      <Topbar
        eyebrow="Coach IA"
        title={brain.assistantName}
        text="Resuelve tus dudas al instante: entreno, nutrición, sustituciones… con las reglas de tu coach. Para temas serios o dolor, te derivará a tu coach."
      />
      <section className="grid">
        <CoachChatClient
          greeting={brain.greeting}
          initialMessages={initialMessages}
          hint={hint}
        />
      </section>
    </>
  );
}
