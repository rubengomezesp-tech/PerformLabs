import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Brain,
  Camera,
  CheckCircle2,
  Globe,
  HeartPulse,
  HelpCircle,
  Mail,
  Palette,
  Play,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { LandingNav } from "@/components/landing/landing-nav";
import { LazyOrbit } from "@/components/landing/lazy-orbit";
import { PhoneBuild } from "@/components/landing/phone-build";
import { TiltCard } from "@/components/landing/tilt-card";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";
import { baseAppMetrics } from "@/lib/domain/app-blueprint";

const navItems = [
  { label: "Plataforma", href: "#plataforma" },
  { label: "Proceso", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "Solicitar propuesta", href: "#consulta" },
];

const platformCapabilities = [
  {
    icon: Brain,
    tag: "Coach Brain",
    title: "IA con la voz del coach",
    text: "Un asistente que responde a tus clientes como lo harías tú: con tus reglas, tus protocolos y tus sustituciones.",
  },
  {
    icon: Wand2,
    tag: "Coach-in-the-loop",
    title: "Planes generados con IA",
    text: "Describe el caso y la IA redacta el programa en tu metodología. Tú lo revisas y lo apruebas en un clic.",
  },
  {
    icon: HeartPulse,
    tag: "Anti-abandono",
    title: "Radar de retención",
    text: "Detecta quién va a dejarlo antes de que pase y te redacta el mensaje, en tu voz, para reengancharlo.",
  },
  {
    icon: BellRing,
    tag: "Push proactivo",
    title: "Avisos que motivan",
    text: "Recordatorios que llegan aunque la app esté cerrada, justo cuando el cliente deja de entrenar.",
  },
  {
    icon: Palette,
    tag: "White-label",
    title: "100% tu marca",
    text: "Logo, color, nombre y dominio. Tus clientes ven tu marca de principio a fin — nunca la nuestra.",
  },
  {
    icon: Camera,
    tag: "IA de visión",
    title: "Nutrición sin fricción",
    text: "Registro de comidas y objetivos que se adaptan. Menos esfuerzo para el cliente, más adherencia para ti.",
  },
];

const trustSignals = [
  "App 100% con tu marca",
  "Sin mensualidad · a éxito",
  "Acompañamiento de marketing",
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
      <LandingNav brandName={platformBrand.name} markUrl={platformBrand.markUrl} items={navItems.slice(0, 3)} />
      <section className="landingHero">
        <div className="auroraField" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <div className="landingHeroContent premiumHeroContent">
          <MotionReveal>
            <img className="heroBrandLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
            <span className="heroBadge"><Sparkles size={13} /> Plataforma de coaching nativa de IA</span>
            <h1>Tu plataforma de coaching con <span className="accentText">IA y tu marca</span>.</h1>
            <p>
              Una app con tu marca donde la IA habla con tu voz, redacta los planes con tu
              método y retiene a tus clientes por ti. Tú apruebas; la tecnología hace el resto.
            </p>
            <div className="heroProof">
              <span><CheckCircle2 size={16} /> IA con tu voz</span>
              <span><CheckCircle2 size={16} /> 100% tu marca</span>
              <span><CheckCircle2 size={16} /> Retención automática</span>
              <span><CheckCircle2 size={16} /> App + consola</span>
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
            <PhoneBuild />
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

      <section className="landingSection" id="plataforma">
        <div className="platformGlow" aria-hidden="true" />
        <MotionReveal>
          <div className="sectionHeader centered">
            <div>
              <span className="eyebrow"><Sparkles size={13} /> Plataforma IA</span>
              <h2>Todo lo que tu marca necesita, <span className="accentText">potenciado por IA</span>.</h2>
              <p>
                No es una plantilla: es un sistema operativo de coaching nativo de IA.
                Tu voz, tu método y tu marca — la tecnología trabajando por ti 24/7.
              </p>
            </div>
          </div>
        </MotionReveal>
        <div className="platformGrid">
          {platformCapabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <MotionReveal key={cap.title} delay={index * 0.05}>
                <TiltCard className="platformCard">
                  <span className="platformIcon"><Icon size={22} /></span>
                  <span className="platformTag">{cap.tag}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.text}</p>
                </TiltCard>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section className="landingSection">
        <MotionReveal className="statementBand">
          <span className="heroBadge">Tu plataforma, no terreno alquilado</span>
          <h2>Deja de construir tu negocio en <span className="accentText">terreno alquilado</span>.</h2>
          <p>
            Tus clientes, tu contenido y tus datos no deberían vivir en una red social ni en una app
            con el logo de otro. Con {platformBrand.name} operas sobre una plataforma con tu marca,
            de la que eres dueño de principio a fin.
          </p>
          <a className="btn primary lg" href="#consulta">
            Solicitar propuesta <ArrowRight size={18} />
          </a>
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
