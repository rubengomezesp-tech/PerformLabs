import { Bell, Mail, Ruler, ShieldCheck, UserRound } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export default async function ProfilePage() {
  const brand = await getSelectedMemberAppBrand();

  return (
    <>
      <Topbar
        eyebrow="Perfil"
        title="Datos, preferencias y privacidad."
        text={`Tu cuenta dentro de ${brand.name}: información básica, preferencias del plan y ajustes de comunicación.`}
      />
      <section className="grid">
        <article className="card span4">
          <UserRound color="var(--gold)" />
          <h2>Cuenta</h2>
          <ul className="list">
            <li className="row">Nombre <strong>Cliente demo</strong></li>
            <li className="row">Email <span>cliente@email.com</span></li>
            <li className="row">Plan <span className="tag">Activo</span></li>
          </ul>
        </article>
        <article className="card span4">
          <Ruler color="var(--gold)" />
          <h2>Preferencias</h2>
          <ul className="list">
            <li className="row">Medidas <strong>Métrico</strong></li>
            <li className="row">Objetivo <strong>Definición</strong></li>
            <li className="row">Comidas/día <strong>4</strong></li>
          </ul>
        </article>
        <article className="card span4">
          <Bell color="var(--gold)" />
          <h2>Comunicación</h2>
          <ul className="list">
            <li className="row"><Mail size={16} /> Email <span className="tag">Activo</span></li>
            <li className="row">Push <span className="tag">Pendiente</span></li>
            <li className="row">Check-ins <strong>Semanal</strong></li>
          </ul>
        </article>
        <article className="card span12">
          <ShieldCheck color="var(--gold)" />
          <h2>Privacidad y seguridad</h2>
          <p>El siguiente bloque incluirá exportación de datos, baja de cuenta, consentimiento legal y preferencias avanzadas por marca.</p>
        </article>
      </section>
    </>
  );
}
