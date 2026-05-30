import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Brain,
  Camera,
  CheckCircle2,
  HeartPulse,
  Mail,
  MessageSquare,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { LandingNav } from "@/components/landing/landing-nav";
import { PhoneBuild } from "@/components/landing/phone-build";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";

const navItems = [
  { label: "Plataforma", href: "#plataforma" },
  { label: "Proceso", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "Solicitar propuesta", href: "#consulta" },
];

const trustSignals = ["IA con tu voz", "100% tu marca", "Retención automática", "App + consola"];

const stats = [
  { value: "11", label: "módulos con IA, listos para tu marca" },
  { value: "24/7", label: "tu asistente respondiendo por ti" },
  { value: "−churn", label: "reenganche antes del abandono" },
  { value: "0", label: "líneas de “powered by”" },
];

const capabilities = [
  { icon: Brain, tag: "Coach Brain", title: "IA con la voz del coach", text: "Responde a tus clientes como lo harías tú: tus reglas, tus protocolos, tus sustituciones." },
  { icon: Wand2, tag: "Coach-in-the-loop", title: "Planes generados con IA", text: "Describe el caso, la IA redacta el programa en tu método y tú apruebas en un clic." },
  { icon: HeartPulse, tag: "Anti-abandono", title: "Radar de retención", text: "Sabe quién va a dejarlo antes de que pase y te redacta el mensaje para reengancharlo." },
  { icon: BellRing, tag: "Push proactivo", title: "Avisos que motivan", text: "Recordatorios que llegan con la app cerrada, justo cuando deja de entrenar." },
  { icon: Camera, tag: "IA de visión", title: "Nutrición sin fricción", text: "Foto al plato, macros estimados y registrados. Menos esfuerzo, más adherencia." },
  { icon: Palette, tag: "White-label", title: "100% tu marca", text: "Logo, color, nombre y dominio. Tus clientes ven tu marca, nunca la nuestra." },
];

const purchaseSteps = [
  { n: "01", title: "Cuéntanos tu proyecto", text: "Revisamos tu marca, tu método, tu oferta y la experiencia que quieres entregar." },
  { n: "02", title: "Definimos la propuesta", text: "Aterrizamos alcance, branding, módulos, contenidos iniciales y calendario." },
  { n: "03", title: "Implantamos y lanzamos", text: "Dejamos la app y la consola listas para operar con clientes reales." },
];

const faqs = [
  { question: "¿Cómo empezamos?", answer: "Rellenas la solicitud, revisamos el encaje y te enviamos una propuesta con alcance, fases y próximos pasos." },
  { question: "¿Puedo usar mi propio branding?", answer: "Sí. Cada app tiene nombre, logo, color, dominio, soporte y configuración propios." },
  { question: "¿Es una plantilla genérica?", answer: "No. Partimos de una base sólida con IA y la adaptamos a tu marca, oferta, contenido y operación." },
];

export default function Home() {
  return (
    <main className="landing landingV2">
      <SmoothScroll />
      <a className="stickyLeadCta" href="#consulta">
        Solicitar propuesta <ArrowRight size={16} />
      </a>
      <LandingNav brandName={platformBrand.name} markUrl={platformBrand.markUrl} items={navItems.slice(0, 3)} />

      {/* ---- Hero: centered editorial + device reveal ---- */}
      <section className="v2Hero">
        <div className="auroraField" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <MotionReveal className="v2HeroInner">
          <span className="v2Eyebrow"><Sparkles size={13} /> Plataforma de coaching nativa de IA</span>
          <h1 className="v2Headline">
            La plataforma de coaching<br />con <span className="accentText">IA</span> y <span className="accentText">tu marca</span>.
          </h1>
          <p className="v2Sub">
            Una app con tu marca donde la IA habla con tu voz, redacta los planes con tu método
            y retiene a tus clientes por ti. Tú apruebas; la tecnología hace el resto.
          </p>
          <div className="v2Cta">
            <a className="btn primary lg" href="#consulta">
              Solicitar propuesta <span className="btnArrow"><ArrowRight size={18} /></span>
            </a>
            <Link className="btn lg ghost" href="/app">
              Ver experiencia demo <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="v2Trust">
            {trustSignals.map((s) => (
              <span key={s}><CheckCircle2 size={15} /> {s}</span>
            ))}
          </div>
        </MotionReveal>

        <MotionReveal className="v2Device" delay={0.12}>
          <PhoneBuild />
        </MotionReveal>
      </section>

      {/* ---- Stats band ---- */}
      <section className="v2Section v2StatsSection">
        <MotionReveal className="v2Stats">
          {stats.map((s) => (
            <div className="v2Stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </MotionReveal>
      </section>

      {/* ---- Bento: platform capabilities ---- */}
      <section className="v2Section" id="plataforma">
        <div className="platformGlow" aria-hidden="true" />
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag"><Sparkles size={12} /> Plataforma IA</span>
          <h2>Un sistema operativo de coaching, no una plantilla.</h2>
          <p>Tu voz, tu método y tu marca — con la tecnología trabajando por ti las 24 horas.</p>
        </MotionReveal>

        <div className="bentoGrid">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            const featured = index === 0;
            return (
              <MotionReveal
                key={cap.title}
                className={featured ? "bentoCell bentoFeature" : "bentoCell"}
                delay={index * 0.04}
              >
                <span className="bentoIcon"><Icon size={featured ? 24 : 20} /></span>
                <div className="bentoBody">
                  <span className="bentoTag">{cap.tag}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.text}</p>
                </div>
                {featured ? (
                  <div className="bentoChat" aria-hidden="true">
                    <div className="bentoBubble in">¿Puedo cambiar el arroz por patata?</div>
                    <div className="bentoBubble out"><Sparkles size={12} /> Sí — mismo gramaje de carbohidratos. Lo dejas igual de bien.</div>
                  </div>
                ) : null}
              </MotionReveal>
            );
          })}
        </div>
      </section>

      {/* ---- Proceso ---- */}
      <section className="v2Section" id="proceso">
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag">Proceso</span>
          <h2>De idea a app operativa, con implantación guiada.</h2>
          <p>Trabajamos contigo el encaje, la marca y la experiencia antes de lanzar a clientes reales.</p>
        </MotionReveal>
        <div className="v2Steps">
          {purchaseSteps.map((step, index) => (
            <MotionReveal className="v2Step" key={step.n} delay={index * 0.06}>
              <span className="v2StepNum">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      {/* ---- Demo ---- */}
      <section className="v2Section" id="demo">
        <MotionReveal className="appScreensBand v2DemoBand">
          <div>
            <span className="v2Tag">Vista cliente</span>
            <h2>Se siente como producto propio desde el primer día.</h2>
            <p>El usuario final ve su entrenador, su plan, sus comidas, sus métricas y una ruta clara para avanzar.</p>
            <ul className="featureList">
              <li><CheckCircle2 size={18} /> Entrenamientos con vídeo y progreso</li>
              <li><CheckCircle2 size={18} /> Nutrición con macros y foto</li>
              <li><CheckCircle2 size={18} /> Check-ins, hábitos y comunidad</li>
              <li><CheckCircle2 size={18} /> Coach IA, soporte y perfil</li>
            </ul>
          </div>
          <img src="/brand/performlabs-app-screens.png" alt="Pantallas de ejemplo de la app PerformLabs" />
        </MotionReveal>
      </section>

      {/* ---- Lead form ---- */}
      <section className="v2Section" id="consulta">
        <div className="v2FormGrid">
          <MotionReveal className="v2FormIntro">
            <span className="v2Tag"><Mail size={12} /> Solicitar propuesta</span>
            <h2>Cuéntanos qué quieres construir.</h2>
            <p>Revisamos el encaje, el alcance y la mejor forma de lanzar tu app de marca con IA.</p>
            <div className="v2Trust v2TrustStack">
              {trustSignals.map((s) => (
                <span key={s}><CheckCircle2 size={15} /> {s}</span>
              ))}
            </div>
          </MotionReveal>
          <MotionReveal className="v2FormCard" delay={0.1}>
            <form action={submitLeadAction} className="leadForm">
              <label>Nombre<input name="fullName" placeholder="Tu nombre" required /></label>
              <label>Email<input name="email" placeholder="tu@email.com" required type="email" /></label>
              <label>Teléfono<input name="phone" placeholder="+34..." /></label>
              <label>Marca o nombre del proyecto<input name="brandName" placeholder="Ej. Elite Coach Academy" /></label>
              <label>Web o Instagram<input name="websiteUrl" placeholder="https://..." /></label>
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
                <textarea name="notes" placeholder="Cuéntanos tu oferta, el contenido disponible y qué experiencia quieres entregar." rows={4} />
              </label>
              <div className="spanFull formActions">
                <button className="btn primary lg" type="submit">
                  Enviar solicitud <span className="btnArrow"><ArrowRight size={18} /></span>
                </button>
              </div>
            </form>
          </MotionReveal>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="v2Section" id="faqs">
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag"><MessageSquare size={12} /> Preguntas</span>
          <h2>Lo que sueles querer saber antes de hablar.</h2>
        </MotionReveal>
        <div className="v2Faq">
          {faqs.map((faq, index) => (
            <MotionReveal className="v2FaqItem" key={faq.question} delay={index * 0.05}>
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="v2Footer">
        <div className="v2FooterTop">
          <div className="v2FooterBrand">
            <img src={platformBrand.markUrl} alt={platformBrand.name} />
            <span>{platformBrand.name}</span>
          </div>
          <nav className="v2FooterNav" aria-label="Pie">
            <a href="#plataforma">Plataforma</a>
            <a href="#proceso">Proceso</a>
            <a href="#demo">Demo</a>
            <a href="#consulta">Solicitar propuesta</a>
          </nav>
        </div>
        <div className="v2FooterBottom">
          <span>© {new Date().getFullYear()} {platformBrand.name}. Plataforma de coaching nativa de IA.</span>
          <a className="btn primary" href="#consulta">Empezar <span className="btnArrow"><ArrowRight size={15} /></span></a>
        </div>
      </footer>
    </main>
  );
}
