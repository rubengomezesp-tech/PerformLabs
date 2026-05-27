import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Globe,
  HelpCircle,
  Layers,
  Mail,
  Palette,
  Send,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { platformBrand } from "@/lib/brand";

const contactEmail = "rubengomezesp@gmail.com";

const deliverySteps = [
  {
    title: "Hablamos con el entrenador",
    text: "Un agente recoge objetivos, oferta, estilo de marca, contenido disponible y estructura de venta.",
    icon: ClipboardList,
  },
  {
    title: "Coordinamos dominio y marca",
    text: "Ayudamos con URL personalizada, logo, colores, nombre de app, soporte y primera experiencia visual.",
    icon: Globe,
  },
  {
    title: "Configuramos la app",
    text: "Montamos entrenamientos, nutrición, contenidos, pagos, mensajes y pantallas esenciales.",
    icon: Smartphone,
  },
  {
    title: "Lanzamiento acompañado",
    text: "Revisamos flujos, dejamos el sistema listo y acompañamos la salida para sus primeros clientes.",
    icon: BadgeCheck,
  },
];

const includedModules = [
  { title: "Entrenamientos", text: "Programas, semanas, días, ejercicios, vídeos y sustituciones.", icon: Dumbbell },
  { title: "Nutrición", text: "Recetas, macros, preferencias, alergias, plantillas y planes.", icon: Utensils },
  { title: "Marca", text: "Dominio, identidad visual, app instalable, emails y soporte.", icon: Palette },
];

const ownershipPoints = [
  { label: "Tu marca", text: "Logo, colores, dominio y experiencia sin parecer una plantilla genérica.", icon: Palette },
  { label: "Tus clientes", text: "Base de clientes, seguimiento, check-ins, soporte y comunicación centralizados.", icon: ShieldCheck },
  { label: "Tus ofertas", text: "Programas, productos, pagos, promociones y contenido alineados a tu negocio.", icon: TrendingUp },
];

const trustSignals = [
  "Agente asignado",
  "Checklist por fase",
  "Preview de app",
  "Revisión antes de lanzamiento",
];

const clientProjectSteps = [
  {
    title: "Solicitud recibida",
    text: "Confirmamos tu idea, objetivo y el tipo de experiencia que quieres vender.",
    state: "Paso 1",
  },
  {
    title: "Marca y dominio",
    text: "Ordenamos nombre, logo, colores, URL, canales de soporte y estilo visual.",
    state: "Paso 2",
  },
  {
    title: "Contenido inicial",
    text: "Preparamos entrenamientos, nutrición, guías, mensajes y pantallas principales.",
    state: "Paso 3",
  },
  {
    title: "Revisión y salida",
    text: "Revisas la experiencia completa antes de empezar a invitar clientes reales.",
    state: "Paso 4",
  },
];

const clientExperience = [
  {
    title: "Panel diario",
    text: "El cliente entra y entiende qué entrenar, qué comer, qué registrar y qué queda pendiente.",
  },
  {
    title: "Plan claro",
    text: "Entrenamientos, comidas, progreso, guías y soporte aparecen como acciones, no como un menú confuso.",
  },
  {
    title: "Check-ins",
    text: "Fotos, medidas, notas y progreso preparan al equipo para revisar y actualizar el plan.",
  },
  {
    title: "Soporte visible",
    text: "El contacto con el equipo queda dentro de la experiencia de marca, no repartido por mil canales.",
  },
];

const idealClients = [
  "Entrenadores con método propio y clientes activos.",
  "Marcas fitness que quieren vender planes premium online.",
  "Coaches que necesitan mejorar experiencia, seguimiento y percepción de valor.",
  "Equipos que quieren separar su negocio de plataformas genéricas.",
];

const comparisonPoints = [
  { label: "Plataforma genérica", text: "Tu marca queda limitada por diseños, reglas y experiencia de terceros." },
  { label: "Proyecto a medida tradicional", text: "Suele ser caro, lento y difícil de mantener sin equipo técnico." },
  { label: "Nuestra implantación", text: "Recibes una app preparada por especialistas, con proceso guiado y base lista para operar." },
];

const faqs = [
  {
    question: "¿Tengo que saber de tecnología?",
    answer: "No. Nuestro agente coordina contigo lo necesario y traduce tus ideas a configuración, contenido y experiencia.",
  },
  {
    question: "¿Puedo usar mi propio dominio y logo?",
    answer: "Sí. Coordinamos la compra o conexión del dominio y preparamos identidad visual, iconos y nombre de app.",
  },
  {
    question: "¿La app sale lista para vender?",
    answer: "La entrega incluye estructura inicial, módulos esenciales y revisión para que puedas empezar con clientes reales.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <section className="landingHero">
        <div className="landingNav">
          <Link className="brand" href="/" style={{ margin: 0 }}>
            <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
            <span>
              <small>{platformBrand.name}</small>
              <strong>Apps de entrenador</strong>
            </span>
          </Link>
          <a className="btn" href={`mailto:${contactEmail}`}>
            Contactar <Mail size={18} />
          </a>
        </div>
        <div className="landingHeroContent">
          <div>
            <img className="heroBrandLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
            <span className="eyebrow">Servicio de implantación a tu marca</span>
            <h1>Te creamos tu app de entrenador configurada a tu gusto.</h1>
            <p>
              Hablas con uno de nuestros agentes y coordinamos todo: compra o
              conexión de tu URL personalizada, logo, identidad visual, programas,
              nutrición, pagos, contenido inicial y lanzamiento.
            </p>
            <div className="proofStrip">
              <span>Tu marca</span>
              <span>Tus clientes</span>
              <span>Tus precios</span>
              <span>Tu método</span>
            </div>
            <div className="actions">
              <a className="btn primary" href="#consulta">
                Consultar con un agente <ArrowRight size={18} />
              </a>
              <Link className="btn" href="/app">
                Ver ejemplo de app <Smartphone size={18} />
              </Link>
            </div>
          </div>
          <div className="phoneMockup" aria-label="Vista previa de app de entrenador">
            <div className="phoneTop">
              <span>Elite Coach</span>
              <span className="liveDot">Activo</span>
            </div>
            <div className="phoneHero">
              <small>Plan de hoy</small>
              <strong>Push + cardio</strong>
              <span>54 min · 6 ejercicios</span>
            </div>
            <div className="phoneStats">
              <span><strong>2.180</strong> kcal</span>
              <span><strong>168g</strong> proteína</span>
            </div>
            <div className="phoneList">
              <span>Press inclinado <b>Vídeo</b></span>
              <span>Comida 3 <b>Lista</b></span>
              <span>Check-in semanal <b>Hoy</b></span>
            </div>
          </div>
        </div>
      </section>

      <section className="landingSection">
        <div className="trustBar" aria-label="Garantías del proceso">
          {trustSignals.map((signal) => (
            <span key={signal}>
              <ShieldCheck size={16} />
              {signal}
            </span>
          ))}
        </div>
      </section>

      <section className="landingSection">
        <div className="grid">
          {ownershipPoints.map((point) => {
            const Icon = point.icon;
            return (
              <article className="card span4" key={point.label}>
                <Icon color="var(--gold)" />
                <h3>{point.label}</h3>
                <p>{point.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landingSection">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Experiencia cliente</span>
            <h2>El usuario final no compra software. Compra claridad.</h2>
            <p>
              La app tiene que guiar cada día de la transformación: entrenar,
              comer, medir progreso y pedir ayuda sin perderse.
            </p>
          </div>
        </div>
        <div className="experiencePreview">
          {clientExperience.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection">
        <div className="grid">
          <article className="card span5">
            <Send color="var(--gold)" />
            <h2>Para entrenadores que quieren vender más que PDFs.</h2>
            <p>
              Si tu cliente paga por una transformación, la experiencia tiene que
              sentirse ordenada, premium y propia desde el primer acceso.
            </p>
            <a className="btn primary" href="#consulta">
              Consultar encaje <ArrowRight size={18} />
            </a>
          </article>
          <article className="card span7">
            <h2>Encaja especialmente si...</h2>
            <ul className="list">
              {idealClients.map((item) => (
                <li className="row" key={item}>
                  {item}
                  <span className="tag">Ideal</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="landingSection">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Implantación</span>
            <h2>El cliente siempre sabe en qué punto está su app.</h2>
            <p>Convertimos la creación de la app en un proceso guiado, con pasos claros y responsables.</p>
          </div>
        </div>
        <div className="timeline">
          <div className="timelineStep isDone">
            <span>1</span>
            <strong>Requisitos</strong>
            <p>Oferta, público, dominio, marca y contenido disponible.</p>
          </div>
          <div className="timelineStep isDone">
            <span>2</span>
            <strong>Diseño base</strong>
            <p>Logo, colores, pantallas, iconos y tono visual.</p>
          </div>
          <div className="timelineStep">
            <span>3</span>
            <strong>Configuración</strong>
            <p>Programas, nutrición, pagos, guías y mensajes.</p>
          </div>
          <div className="timelineStep">
            <span>4</span>
            <strong>Lanzamiento</strong>
            <p>Revisión final, pruebas y salida con clientes reales.</p>
          </div>
        </div>
      </section>

      <section className="landingSection">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Hoja de ruta visible</span>
            <h2>Un proceso entendible para el entrenador, no una caja negra.</h2>
            <p>Mostramos avances claros, próximos pasos y decisiones pendientes con lenguaje de negocio.</p>
          </div>
        </div>
        <div className="grid">
          {clientProjectSteps.map((step) => (
            <article className="card span3" key={step.title}>
              <span className="tag">{step.state}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Cómo funciona</span>
            <h2>Nosotros coordinamos la entrega.</h2>
            <p>El entrenador no recibe una plantilla vacía: recibe una app preparada por nuestro equipo.</p>
          </div>
        </div>
        <div className="grid">
          {deliverySteps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="card span3" key={step.title}>
                <Icon color="var(--gold)" />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landingSection">
        <div className="grid">
          <article className="card span5">
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
          </article>
          <article className="card span7">
            <h2>Incluido en la implantación</h2>
            <ul className="list">
              <li className="row">URL personalizada <span>Compra o conexión guiada</span></li>
              <li className="row">Logo y estilo visual <span>Preparación de marca</span></li>
              <li className="row">Contenido inicial <span>Programas, nutrición y guías</span></li>
              <li className="row">Experiencia móvil <span>App instalable para clientes</span></li>
              <li className="row">QA de lanzamiento <span>Prueba de flujo completo</span></li>
              <li className="row">Acompañamiento <span>Agente asignado</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landingSection" id="consulta">
        <div className="grid">
          <article className="card span5">
            <Mail color="var(--gold)" />
            <h2>Cuéntanos qué app quieres crear.</h2>
            <p>
              Déjanos los datos clave y un agente revisará tu caso para decirte
              cómo lo montaríamos: dominio, marca, contenido, pagos y lanzamiento.
            </p>
          </article>
          <article className="card span7">
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
          </article>
        </div>
      </section>

      <section className="landingSection">
        <article className="card span12 noTemplateBand">
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
        </article>
      </section>

      <section className="landingSection">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Posicionamiento</span>
            <h2>Ni plataforma genérica, ni desarrollo eterno.</h2>
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
      </section>

      <section className="landingSection">
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
      </section>

      <section className="landingSection">
        <div className="grid">
          <article className="card span5">
            <HelpCircle color="var(--gold)" />
            <h2>Preguntas rápidas</h2>
            <p>Resolvemos los puntos clave antes de hablar con el agente.</p>
          </article>
          <article className="card span7">
            <div className="faqList">
              {faqs.map((faq) => (
                <div className="faqItem" key={faq.question}>
                  <strong>{faq.question}</strong>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
