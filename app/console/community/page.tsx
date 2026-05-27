import { MessageSquare, Radio } from "lucide-react";
import { Topbar } from "@/components/topbar";

export default function CommunityPage() {
  return (
    <>
      <Topbar
        eyebrow="Comunidad"
        title="Chat, canales y eventos en vivo."
        text="Módulo previsto para soporte, comunidad por membresía, vídeo, comentarios, notificaciones y directos grabables."
      />
      <section className="grid">
        <article className="card span6">
          <MessageSquare color="var(--gold)" />
          <h2>Canales</h2>
          <ul className="list">
            <li className="row">Soporte general <span className="tag">Privado</span></li>
            <li className="row">Transformación 12 semanas <span className="tag">Grupo</span></li>
            <li className="row">Nutrición diaria <span className="tag">Grupo</span></li>
          </ul>
        </article>
        <article className="card span6">
          <Radio color="var(--gold)" />
          <h2>Directos</h2>
          <p>
            Agenda sesiones, activa grabación, publica replay y envía push a los
            miembros del plan.
          </p>
        </article>
      </section>
    </>
  );
}
