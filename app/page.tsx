import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe,
  HelpCircle,
  Mail,
  Palette,
  Play,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { BrandOrbit } from "@/components/brand-orbit";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";
import { baseAppMetrics } from "@/lib/domain/app-blueprint";

const navItems = [
  { label: "Qué compras", href: "#producto" },
  { label: "Cómo comprar", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "Solicitar info", href: "#consulta" },
];

const trustSignals = [
  "App con tu marca",
  "Pago antes de activar",
  "Entrenador con permisos propios",
];

const purchaseSteps = [
  {
    title: "1. Solicitas información",
    text: "Nos dices qué vendes, cuántos clientes tienes y qué app quieres lanzar.",
    icon: Send,
  },
  {
    title: "2. Te damos propuesta",
    text: "Definimos precio, alcance, branding, módulos y forma de activación.",
    icon: BadgeCheck,
  },
  {
    title: "3. Pagas y activamos",
    text: "Creamos tu marca, configuramos la app y damos acceso al entrenador.",
    icon: Play,
  },
];

const launchChannels = [
  {
    title: "Web app instalable",
    text: "La vía rápida para empezar: dominio propio y experiencia instalable en móvil.",
    icon: Globe,
  },
  {
    title: "Branding propio",
    text: "Logo, color, nombre, dominio, soporte y apariencia ajustados a cada entrenador.",
    icon: Palette,
  },
  {
    title: "App + consola",
    text: "El cliente final ve la app. El entrenador opera programas, nutrición, contenido y miembros.",
    icon: Smartphone,
  },
];

const faqs = [
  {
    question: "¿Cómo compro la app?",
    answer: "Primero envías la solicitud. Revisamos tu caso, te damos propuesta y activamos la app después del pago.",
  },
  {
    question: "¿Puedo usar mi propio branding?",
    answer: "Sí. Cada app puede tener nombre, logo, color, dominio, soporte y configuración propios.",
  },
  {
    question: "¿El entrenador recibe acceso antes de pagar?",
    answer: "No. La marca nace preparada pero bloqueada. Activamos permisos cuando la licencia está pagada y aprobada.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <SmoothScroll />
      <a className="stickyLeadCta" href="#consulta">
        Solicitar precio <ArrowRight size={16} />
      </a>
      <section className="landingHero">
        <div className="landingNav">
          <Link className="brand" href="/" style={{ margin: 0 }}>
            <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
            <span>
              <small>{platformBrand.name}</small>
              <strong>Apps de entrenador</strong>
            </span>
          </Link>
          <nav className="landingNavLinks" aria-label="Secciones">
            {navItems.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
          </nav>
          <a className="btn primary" href="#consulta">
            Solicitar info <Mail size={18} />
          </a>
        </div>

        <div className="landingHeroContent premiumHeroContent">
          <MotionReveal>
            <img className="heroBrandLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
            <span className="eyebrow">Apps white-label para entrenadores</span>
            <h1>Compra una app de coaching lista para vender con tu marca.</h1>
            <p>
              Nosotros montamos la app, el branding, la consola, el dominio y los módulos.
              Tú la vendes a tus clientes con tu método de entrenamiento y nutrición.
            </p>
            <div className="proofStrip">
              <span>1. Solicita información</span>
              <span>2. Recibe propuesta</span>
              <span>3. Paga y activamos</span>
            </div>
            <div className="actions">
              <a className="btn primary" href="#consulta">
                Quiero comprar una app <ArrowRight size={18} />
              </a>
              <Link className="btn" href="/app">
                Ver demo cliente <Smartphone size={18} />
              </Link>
            </div>
            <div className="heroDecisionPanel">
              <strong>¿Qué hago ahora?</strong>
              <span>Rellena el formulario y te diremos precio, alcance y siguiente paso.</span>
              <a href="#consulta">Ir al formulario <ArrowRight size={16} /></a>
            </div>
          </MotionReveal>

          <MotionReveal className="heroProductVisual" delay={0.14}>
            <BrandOrbit />
            <img
              className="heroMockupImage"
              src="/brand/performlabs-app-hero.png"
              alt="Mockups de app de entrenamiento, nutrición, progreso y soporte"
            />
            <div className="heroSignalPanel">
              <span className="tag">Sistema conectado</span>
              <strong>Consola + app cliente</strong>
              <p>Una base lista para adaptarse a cada marca sin empezar desde cero.</p>
            </div>
          </MotionReveal>
        </div>
      </section>

      <section className="landingSection">
        <MotionReveal className="trustBar" aria-label="Garantías del proceso">
          {trustSignals.map((signal) => (
            <span key={signal}>
              <ShieldCheck size={16} />
              {signal}
            </span>
          ))}
        </MotionReveal>
      </section>

      <section className="landingSection" id="proceso">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Cómo comprar</span>
              <h2>El camino es simple: consulta, propuesta y activación.</h2>
              <p>
                No damos acceso a entrenadores antes de pago. Primero cerramos el encaje
                comercial y después activamos la app y sus permisos.
              </p>
            </div>
          </div>
          <div className="grid">
            {purchaseSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article className="card span4 motionCard" key={step.title}>
                  <Icon color="var(--gold)" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </MotionReveal>
      </section>

      <section className="landingSection" id="producto">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Producto</span>
              <h2>Una app de marca, no una plantilla vacía.</h2>
              <p>
                El entrenador vende mejor cuando su método vive dentro de una
                experiencia propia, ordenada y preparada para operar con clientes reales.
              </p>
            </div>
          </div>
          <div className="productShowcase">
            <div className="productCopy">
              <span className="eyebrow">Base app conectable</span>
              <h3>La consola prepara la marca. La app entrega la experiencia.</h3>
              <p>
                Cada proyecto se convierte en una app operativa con identidad,
                navegación, contenido inicial y módulos esenciales conectados a su marca.
              </p>
              <div className="metricGrid">
                {baseAppMetrics.map((metric) => (
                  <span key={metric.label}>
                    {metric.label}
                    <strong>{metric.value}</strong>
                    <small>{metric.text}</small>
                  </span>
                ))}
              </div>
            </div>
            <div className="mockupFrame">
              <img src="/brand/performlabs-console-sync.png" alt="Consola conectada con apps de cliente" />
            </div>
          </div>
        </MotionReveal>
      </section>

      <section className="landingSection">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Qué incluye</span>
              <h2>Lo esencial para vender una app propia sin empezar desde cero.</h2>
            </div>
          </div>
        </MotionReveal>
        <div className="grid">
          {launchChannels.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotionReveal className="card span4 motionCard" delay={index * 0.05} key={item.title}>
                <Icon color="var(--gold)" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section className="landingSection" id="demo">
        <MotionReveal>
          <div className="appScreensBand">
            <div>
              <span className="eyebrow">Vista cliente</span>
              <h2>La app se siente como producto propio desde el primer día.</h2>
              <p>
                El usuario final no ve nuestro proceso interno. Ve su entrenador,
                su plan, sus comidas, sus métricas y una ruta clara para avanzar.
              </p>
              <ul className="featureList">
                <li><CheckCircle2 size={18} /> Entrenamientos con vídeo y progreso</li>
                <li><CheckCircle2 size={18} /> Nutrición con macros y restricciones</li>
                <li><CheckCircle2 size={18} /> Check-ins, hábitos y mensajes</li>
                <li><CheckCircle2 size={18} /> Guías, soporte y perfil del cliente</li>
              </ul>
            </div>
            <img src="/brand/performlabs-app-screens.png" alt="Pantallas de ejemplo de la app PerformLabs" />
          </div>
        </MotionReveal>
      </section>

      <section className="landingSection" id="consulta">
        <div className="grid">
          <MotionReveal className="card span5">
            <Mail color="var(--gold)" />
            <h2>Solicita información y precio.</h2>
            <p>
              Este es el paso para comprar o pedir información. Te responderemos
              con alcance, precio y la forma de activar tu app.
            </p>
          </MotionReveal>
          <MotionReveal className="card span7" delay={0.1}>
            <form action={submitLeadAction} className="leadForm">
              <label>
                Nombre
                <input name="fullName" placeholder="Tu nombre" required />
              </label>
              <label>
                Email
                <input name="email" placeholder="tu@email.com" required type="email" />
              </label>
              <label>
                Teléfono
                <input name="phone" placeholder="+34..." />
              </label>
              <label>
                Marca o nombre del proyecto
                <input name="brandName" placeholder="Ej. Elite Coach Academy" />
              </label>
              <label>
                Web o Instagram
                <input name="websiteUrl" placeholder="https://..." />
              </label>
              <label>
                Clientes actuales aproximados
                <select name="monthlyClients" defaultValue="">
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="0-20">0-20</option>
                  <option value="21-100">21-100</option>
                  <option value="101-500">101-500</option>
                  <option value="500+">500+</option>
                </select>
              </label>
              <label className="spanFull">
                Objetivo principal
                <select name="mainGoal" defaultValue="">
                  <option value="" disabled>Qué necesitas conseguir</option>
                  <option value="launch">Lanzar mi primera app</option>
                  <option value="upgrade">Mejorar mi sistema actual</option>
                  <option value="scale">Escalar clientes y equipo</option>
                  <option value="brand">Elevar percepción de marca</option>
                </select>
              </label>
              <label className="spanFull">
                Notas
                <textarea name="notes" placeholder="Cuéntanos qué vendes, qué contenido tienes y qué te gustaría que haga la app." rows={5} />
              </label>
              <div className="spanFull formActions">
                <button className="btn primary" type="submit">
                  Solicitar información y precio <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </MotionReveal>
        </div>
      </section>

      <section className="landingSection" id="faqs">
        <div className="grid">
          <MotionReveal className="card span5">
            <HelpCircle color="var(--gold)" />
            <h2>Preguntas rápidas</h2>
            <p>Resolvemos los puntos clave antes de hablar con el agente.</p>
          </MotionReveal>
          <MotionReveal className="card span7" delay={0.1}>
            <div className="faqList">
              {faqs.map((faq) => (
                <div className="faqItem" key={faq.question}>
                  <strong>{faq.question}</strong>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </MotionReveal>
        </div>
      </section>
    </main>
  );
}
