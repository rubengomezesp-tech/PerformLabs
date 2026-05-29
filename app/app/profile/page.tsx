import { Bell, CalendarClock, CheckCircle2, Mail, MessageSquare, Moon, Ruler, ShieldCheck, Share2, Smartphone, UserRound } from "lucide-react";
import { ReferralCard } from "@/components/referral-card";
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
            <li className="row"><Smartphone size={16} /> Push <span className="tag">Preparado</span></li>
            <li className="row">Check-ins <strong>Semanal</strong></li>
          </ul>
        </article>
        <article className="card span12 notificationPreferenceCard">
          <div className="sectionHeader">
            <div>
              <Smartphone color="var(--gold)" />
              <h2>Recordatorios inteligentes.</h2>
              <p>Elige cómo quieres recibir los avisos importantes de tu coach, entrenos, comidas y progreso.</p>
            </div>
            <span className="tag">Control del cliente</span>
          </div>
          <div className="notificationPreferenceGrid">
            <span><CheckCircle2 color="var(--green)" size={17} /> Cambios del coach</span>
            <span><CalendarClock color="var(--gold)" size={17} /> Entreno: 10:00</span>
            <span><MessageSquare color="var(--gold)" size={17} /> Mensajes in-app</span>
            <span><Moon color="var(--gold)" size={17} /> Modo descanso</span>
          </div>
        </article>
        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Share2 color="var(--gold)" />
              <h2>Invita a un amigo.</h2>
              <p>Comparte tu enlace de {brand.name}. Quien lo use solicitará acceso y tu coach verá que llega por tu invitación.</p>
            </div>
          </div>
          <ReferralCard refCode={brand.id} appName={brand.appName ?? brand.name} />
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
