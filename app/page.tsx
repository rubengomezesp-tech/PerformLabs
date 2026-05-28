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
import { LazyOrbit } from "@/components/landing/lazy-orbit";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";
import { baseAppMetrics } from "@/lib/domain/app-blueprint";

const navItems = [
  { label: "Qué incluye", href: "#producto" },
  { label: "Proceso", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "Solicitar propuesta", href: "#consulta" },
];

const trustSignals = [
  "App con tu marca",
  "Implantación guiada",
  "Consola para operar",
];

const purchaseSteps = [
  {
    title: "1. Cuéntanos tu proyecto",
    text: "Revisamos tu marca, tu método, tu oferta y el tipo de experiencia que quieres entregar.",
    icon: Send,
  },
  {
    title: "2. Definimos la propuesta",
    text: "Aterrizamos alcance, branding, módulos, contenidos iniciales y calendario de implantación.",
    icon: BadgeCheck,
  },
  {
    title: "3. Implantamos la experiencia",
    text: "Preparamos la app, la consola y el lanzamiento para que tu equipo pueda operar con clientes reales.",
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
    question: "¿Cómo empezamos?",
    answer: "Rellenas la solicitud, revisamos el encaje del proyecto y te enviamos una propuesta con alcance, fases y próximos pasos.",
  },
  {
    question: "¿Puedo usar mi propio branding?",
    answer: "Sí. Cada app puede tener nombre, logo, color, dominio, soporte y configuración propios.",
  },
  {
    question: "¿Es una plantilla genérica?",
    answer: "No. Partimos de una base sólida y la adaptamos a la marca, oferta, contenido y operación de cada entrenador.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <SmoothScroll />
      <a className="stickyLeadCta" href="#consulta">
        Solicitar propuesta <ArrowRight size={16} />
      </a>
      <section className="landingHero">
        <div className="auroraField" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
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
            Solicitar propuesta <Mail size={18} />
          </a>
        </div>

        <div className="landingHeroContent premiumHeroContent">
          <MotionReveal>
            <img className="heroBrandLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
            <span className="heroBadge">Apps de marca para entrenadores</span>
            <h1>Lanza una app de coaching con <span className="accentText">tu marca y tu método</span>.</h1>
            <p>
              Diseñamos e implantamos una experiencia digital de marca con branding, consola,
              dominio y módulos conectados a tu forma de entrenar, nutrir y acompañar clientes.
            </p>
            <div className="proofStrip">
              <span>1. Cuéntanos el proyecto</span>
              <span>2. Recibe una propuesta</span>
              <span>3. Lanza con acompañamiento</span>
            </div>
            <div className="actions">
              <a className="btn primary" href="#consulta">
                Solicitar propuesta <ArrowRight size={18} />
              </a>
              <Link className="btn" href="/app">
                Ver experiencia demo <Smartphone size={18} />
              </Link>
            </div>
            <div className="heroDecisionPanel">
              <strong>¿Qué hago ahora?</strong>
              <span>Cuéntanos tu caso y prepararemos una propuesta con alcance y próximos pasos.</span>
              <a href="#consulta">Solicitar propuesta <ArrowRight size={16} /></a>
            </div>
          </MotionReveal>

          <MotionReveal className="heroProductVisual" delay={0.14}>
            <LazyOrbit />
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
              <span className="eyebrow">Proceso</span>
              <h2>De idea a app operativa, con implantación guiada.</h2>
              <p>
                Trabajamos contigo el encaje, la marca, el contenido y la experiencia
                antes de preparar el lanzamiento para clientes reales.
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
            <h2>Solicita una propuesta.</h2>
            <p>
              Cuéntanos qué quieres construir y revisaremos el encaje, el alcance
              y la mejor forma de lanzar tu app de marca.
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
                <textarea name="notes" placeholder="Cuéntanos tu oferta, el contenido disponible y qué experiencia quieres entregar." rows={5} />
              </label>
              <div className="spanFull formActions">
                <button className="btn primary" type="submit">
                  Enviar solicitud <ArrowRight size={18} />
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
