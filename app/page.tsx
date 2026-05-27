import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Globe,
  HelpCircle,
  Layers,
  Mail,
  MessageCircle,
  Palette,
  Rocket,
  Send,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { BrandOrbit } from "@/components/brand-orbit";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";
import { baseAppBlueprint, baseAppBuildPhases, baseAppMetrics } from "@/lib/domain/app-blueprint";

const contactEmail = "rubengomezesp@gmail.com";

const navItems = [
  { label: "Producto", href: "#producto" },
  { label: "Proceso", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "FAQs", href: "#faqs" },
];

const trustSignals = [
  "App con tu marca",
  "Consola para operar",
  "Contenido cargado",
  "Lanzamiento guiado",
];

const growthPillars = [
  {
    title: "Convierte mejor",
    text: "Tu oferta deja de vivir en PDFs, enlaces sueltos y chats. El cliente ve una experiencia premium desde el primer acceso.",
    icon: TrendingUp,
  },
  {
    title: "Entrega sin fricción",
    text: "Programas, nutrición, progreso, guías y soporte quedan ordenados en una app fácil de seguir.",
    icon: Smartphone,
  },
  {
    title: "Retiene clientes",
    text: "Check-ins, hábitos, mensajes y métricas mantienen al usuario conectado al método del entrenador.",
    icon: MessageCircle,
  },
  {
    title: "Escala equipo",
    text: "La consola separa marca, contenido, miembros, tareas y lanzamiento para que el negocio no dependa de improvisar.",
    icon: BarChart3,
  },
];

const deliverySteps = baseAppBuildPhases.map((phase, index) => ({
  ...phase,
  icon: [Send, Palette, Layers, BadgeCheck][index],
}));

const includedModules = [
  { title: "Entrenamientos", text: "Programas, semanas, días, ejercicios, vídeos y sustituciones.", icon: Dumbbell },
  { title: "Nutrición", text: "Recetas, macros, preferencias, alergias, plantillas y planes.", icon: Utensils },
  { title: "Automatización", text: "Onboarding, avisos, check-ins, estados y procesos listos para crecer.", icon: Zap },
];

const idealClients = [
  "Entrenadores con método propio y clientes activos.",
  "Marcas fitness que quieren vender planes premium online.",
  "Coaches que necesitan mejorar experiencia, seguimiento y percepción de valor.",
  "Equipos que quieren separar su negocio de herramientas genéricas.",
];

const comparisonPoints = [
  { label: "Herramientas genéricas", text: "Resuelven piezas sueltas, pero la experiencia no se siente como un producto propio." },
  { label: "Desarrollo desde cero", text: "Da control, pero suele ser lento, caro y difícil de mantener sin equipo técnico estable." },
  { label: "PerformLabs", text: "Creamos una app de marca con base sólida, configuración guiada y consola operativa." },
];

const faqs = [
  {
    question: "¿Tengo que saber de tecnología?",
    answer: "No. Un agente coordina contigo lo necesario y traduce tus ideas a marca, configuración, contenido y experiencia.",
  },
  {
    question: "¿Puedo usar mi propio dominio y logo?",
    answer: "Sí. Coordinamos la compra o conexión del dominio y preparamos identidad visual, iconos y nombre de app.",
  },
  {
    question: "¿La app sale lista para vender?",
    answer: "La entrega incluye estructura inicial, módulos esenciales y revisión para empezar con clientes reales.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <SmoothScroll />
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
          <a className="btn" href={`mailto:${contactEmail}`}>
            Contactar <Mail size={18} />
          </a>
        </div>

        <div className="landingHeroContent premiumHeroContent">
          <MotionReveal>
            <img className="heroBrandLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
            <span className="eyebrow">Apps, automatización y operación para coaches</span>
            <h1>Creamos tu app de coaching con tu marca y tu método.</h1>
            <p>
              Construimos la experiencia completa: app móvil, consola, dominio,
              identidad visual, programas, nutrición, soporte, contenido inicial y
              lanzamiento acompañado.
            </p>
            <div className="proofStrip">
              <span>Tu marca</span>
              <span>Tus clientes</span>
              <span>Tus programas</span>
              <span>Tu operación</span>
            </div>
            <div className="actions">
              <a className="btn primary" href="#consulta">
                Hablar con un agente <ArrowRight size={18} />
              </a>
              <Link className="btn" href="/app">
                Ver ejemplo de app <Smartphone size={18} />
              </Link>
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
        <div className="grid">
          {growthPillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <MotionReveal className="card span3 motionCard" delay={index * 0.05} key={pillar.title}>
                <Icon color="var(--gold)" />
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section className="landingSection">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Sistema completo</span>
              <h2>Todo lo que necesita una app de coaching seria.</h2>
              <p>
                Entrenamiento, nutrición, progreso, contenido y soporte se configuran
                desde la consola y aparecen como experiencia simple para el cliente.
              </p>
            </div>
          </div>
          <div className="engineGrid">
            {baseAppBlueprint.map((module) => (
              <article className="engineTile" key={module.key}>
                <span>{module.consoleArea}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <small>{module.clientExperience}</small>
              </article>
            ))}
          </div>
        </MotionReveal>
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

      <section className="landingSection" id="proceso">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Implantación</span>
              <h2>Un proceso guiado para pasar de idea a app operativa.</h2>
              <p>Convertimos la creación de la app en pasos claros, revisables y accionables.</p>
            </div>
          </div>
          <div className="timeline">
            {deliverySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className={index < 2 ? "timelineStep isDone" : "timelineStep"} key={step.title}>
                  <span>{index + 1}</span>
                  <Icon color="var(--gold)" size={18} />
                  <strong>{step.clientLabel}</strong>
                  <p>{step.description}</p>
                </div>
              );
            })}
          </div>
        </MotionReveal>
      </section>

      <section className="landingSection">
        <div className="grid">
          <MotionReveal className="card span5">
            <Send color="var(--gold)" />
            <h2>Para entrenadores que quieren vender más que PDFs.</h2>
            <p>
              Si tu cliente paga por una transformación, la experiencia tiene que
              sentirse ordenada, premium y propia desde el primer acceso.
            </p>
            <a className="btn primary" href="#consulta">
              Consultar encaje <ArrowRight size={18} />
            </a>
          </MotionReveal>
          <MotionReveal className="card span7" delay={0.1}>
            <h2>Encaja especialmente si...</h2>
            <ul className="list">
              {idealClients.map((item) => (
                <li className="row" key={item}>
                  {item}
                  <span className="tag">Ideal</span>
                </li>
              ))}
            </ul>
          </MotionReveal>
        </div>
      </section>

      <section className="landingSection">
        <div className="grid">
          <MotionReveal className="card span5">
            <CalendarCheck color="var(--gold)" />
            <p className="metric">
              Proyecto a medida
              <strong>Consultar con un agente</strong>
            </p>
            <p>
              Cada entrenador tiene una oferta, contenido y marca distintos. Por
              eso valoramos el proyecto hablando contigo.
            </p>
            <a className="btn primary" href="#consulta">
              Enviar consulta <Mail size={18} />
            </a>
          </MotionReveal>
          <MotionReveal className="card span7" delay={0.1}>
            <h2>Incluido en la implantación</h2>
            <ul className="list">
              <li className="row">URL personalizada <span>Compra o conexión guiada</span></li>
              <li className="row">Logo y estilo visual <span>Preparación de marca</span></li>
              <li className="row">Contenido inicial <span>Programas, nutrición y guías</span></li>
              <li className="row">Experiencia móvil <span>App instalable para clientes</span></li>
              <li className="row">QA de lanzamiento <span>Prueba de flujo completo</span></li>
              <li className="row">Acompañamiento <span>Agente asignado</span></li>
            </ul>
          </MotionReveal>
        </div>
      </section>

      <section className="landingSection" id="consulta">
        <div className="grid">
          <MotionReveal className="card span5">
            <Mail color="var(--gold)" />
            <h2>Cuéntanos qué app quieres crear.</h2>
            <p>
              Déjanos los datos clave y un agente revisará tu caso para decirte
              cómo lo montaríamos: dominio, marca, contenido, cobro y lanzamiento.
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
                  Enviar consulta <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </MotionReveal>
        </div>
      </section>

      <section className="landingSection">
        <MotionReveal className="card span12 noTemplateBand">
          <div>
            <Layers color="var(--gold)" />
            <h2>No entregamos una plantilla vacía.</h2>
            <p>
              Preparamos la app contigo, cargamos la estructura inicial y dejamos
              la experiencia lista para que tus clientes entiendan qué hacer desde
              el primer día.
            </p>
          </div>
          <a className="btn primary" href="#consulta">
            Empezar conversación <ArrowRight size={18} />
          </a>
        </MotionReveal>
      </section>

      <section className="landingSection">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Posicionamiento</span>
              <h2>Ni herramienta genérica, ni desarrollo eterno.</h2>
              <p>Buscamos el punto medio: una app propia, preparada por nuestro equipo y lista para operar.</p>
            </div>
          </div>
          <div className="comparisonGrid">
            {comparisonPoints.map((point) => (
              <article className="comparisonCard" key={point.label}>
                <h3>{point.label}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      <section className="landingSection">
        <MotionReveal>
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Módulos</span>
              <h2>Una app preparada para vender coaching.</h2>
            </div>
          </div>
          <div className="grid">
            {includedModules.map((module) => {
              const Icon = module.icon;
              return (
                <article className="card span4" key={module.title}>
                  <Icon color="var(--gold)" />
                  <h3>{module.title}</h3>
                  <p>{module.text}</p>
                </article>
              );
            })}
          </div>
        </MotionReveal>
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
