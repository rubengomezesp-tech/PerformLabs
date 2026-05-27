import { Mail, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceContentPages } from "@/lib/repositories/member-experience";

export default async function SupportPage() {
  const brand = await getSelectedMemberAppBrand();
  const pages = await listWorkspaceContentPages(brand.id);
  const supportPage = pages.find((page) => page.slug === "soporte");

  return (
    <>
      <Topbar
        eyebrow="Soporte"
        title={`Contacto de ${brand.name}.`}
        text="Soporte por email en esta primera versión; luego chat privado, adjuntos, comunidad y avisos importantes."
      />
      <section className="grid">
        <article className="card span6">
          <Mail color="var(--gold)" />
          <h2>Email</h2>
          <p>{supportPage?.notes ?? "Nuestro equipo responderá desde el canal principal de soporte."}</p>
          <p>{brand.supportEmail}</p>
          <button className="btn primary">Abrir conversación</button>
        </article>
        <article className="card span6">
          <MessageSquare color="var(--gold)" />
          <h2>Chat</h2>
          <p>Canales por plan, mensajes directos y estados de lectura.</p>
          <span className="tag">Fase 2</span>
        </article>
      </section>
    </>
  );
}
