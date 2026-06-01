import { Radio, Sparkles, Users } from "lucide-react";
import { Topbar } from "@/components/topbar";

export default function CommunityPage() {
  return (
    <>
      <Topbar
        eyebrow="Comunidad"
        title="Chat, canales y eventos en vivo."
        text="Módulo de plataforma en el roadmap. Hoy la comunidad ya funciona por marca: cada coach publica en /coach/community y sus clientes lo ven en /app/community."
      />
      <section className="grid">
        <article className="card span12">
          <Sparkles color="var(--accent)" aria-hidden="true" />
          <h2>En el roadmap de plataforma</h2>
          <p>
            Aquí vivirá la comunidad transversal de PerformLabs: canales por membresía,
            soporte centralizado, directos con grabación y replay, y push a los miembros
            del plan. Lo dejamos explícito en vez de mostrar datos de ejemplo.
          </p>
        </article>
        <article className="card span6">
          <Users color="var(--accent)" aria-hidden="true" />
          <h2>Comunidad por coach (hoy)</h2>
          <p>
            Cada entrenador gestiona sus anuncios y su feed desde su propio panel; los
            clientes interactúan desde la app de su marca. No hay un canal global todavía.
          </p>
        </article>
        <article className="card span6">
          <Radio color="var(--accent)" aria-hidden="true" />
          <h2>Directos y replays (planeado)</h2>
          <p>
            Agenda de sesiones en vivo, grabación automática, publicación de replay y
            notificación push a los miembros del plan correspondiente.
          </p>
        </article>
      </section>
    </>
  );
}
