import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  LineChart,
  Mail,
  MessageSquare,
  Palette,
  Sparkles,
  Utensils,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { LandingNav } from "@/components/landing/landing-nav";
import { PhoneBuild } from "@/components/landing/phone-build";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";

const navItems = [
  { label: "La app", href: "#plataforma" },
  { label: "Proceso", href: "#proceso" },
  { label: "Demo", href: "#demo" },
  { label: "Solicitar propuesta", href: "#consulta" },
];

const trustSignals = ["Entrenos en vídeo", "Calorías por foto", "Nutrición a tu método", "100% tu marca"];

const stats = [
  { value: "Por foto", label: "calorías y macros, sin escribir" },
  { value: "En vídeo", label: "cada ejercicio, con su técnica" },
  { value: "100%", label: "tu marca, tu nombre, tu dominio" },
  { value: "App + consola", label: "para tu cliente y para ti" },
];

const capabilities = [
  { icon: Camera, tag: "Sin escribir", title: "Calorías por foto", text: "El cliente hace una foto al plato y la app estima calorías y macros al instante. Cero fricción, más adherencia." },
  { icon: Dumbbell, tag: "Vídeo + técnica", title: "Entrenos en vídeo", text: "Cada ejercicio con su vídeo, series, reps y descanso. El cliente sabe exactamente qué hacer en cada sesión." },
  { icon: LineChart, tag: "Serie a serie", title: "Progreso real", text: "Apunta reps y kilos en cada serie y ve la evolución de cada ejercicio y de tu peso." },
  { icon: Utensils, tag: "Tu método", title: "Nutrición a medida", text: "Plan de comidas, macros y recetas con tus reglas, no una dieta genérica de plantilla." },
  { icon: HeartPulse, tag: "Tú al frente", title: "Acompañas sin perseguir", text: "Ves quién flojea y actúas a tiempo. Tú eres quien acompaña; las herramientas te quitan el trabajo repetitivo." },
  { icon: Palette, tag: "White-label", title: "100% tu marca", text: "Logo, color, nombre y dominio. Tus clientes ven tu marca de principio a fin, nunca la nuestra." },
];

const purchaseSteps = [
  { n: "01", title: "Cuéntanos tu proyecto", text: "Revisamos tu marca, tu método, tu oferta y la experiencia que quieres entregar." },
  { n: "02", title: "Definimos la propuesta", text: "Aterrizamos alcance, branding, contenidos iniciales y calendario de implantación." },
  { n: "03", title: "Implantamos y lanzamos", text: "Dejamos la app y la consola listas para operar con tus clientes reales." },
];

const faqs = [
  { question: "¿Cómo empezamos?", answer: "Rellenas la solicitud, revisamos el encaje y te enviamos una propuesta con alcance, fases y próximos pasos." },
  { question: "¿Puedo usar mi propio branding?", answer: "Sí. Cada app tiene nombre, logo, color, dominio, soporte y configuración propios." },
  { question: "¿Es una plantilla genérica?", answer: "No. Partimos de una base sólida y la adaptamos a tu marca, tu método, tu contenido y tu operación." },
];

export default function Home() {
  return (
    <main className="landing landingV2">
      <SmoothScroll />
      <a className="stickyLeadCta" href="#consulta">
        Solicitar propuesta <ArrowRight size={16} />
      </a>
      <LandingNav brandName={platformBrand.name} markUrl={platformBrand.markUrl} items={navItems.slice(0, 3)} />

      {/* ---- Hero ---- */}
      <section className="v2Hero">
        <div className="auroraField" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <MotionReveal className="v2HeroInner">
          <span className="v2Eyebrow"><Sparkles size={13} /> La app de coaching con tu marca</span>
          <h1 className="v2Headline">
            La app de tu marca para <span className="accentText">entrenar</span>, <span className="accentText">comer</span> y <span className="accentText">progresar</span>.
          </h1>
          <p className="v2Sub">
            Entrenos en vídeo con el progreso por serie, contador de calorías por foto y nutrición
            a tu método. Con tu marca, y contigo al frente de tus clientes.
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

      {/* ---- Stats ---- */}
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

      {/* ---- Bento: what the app does ---- */}
      <section className="v2Section" id="plataforma">
        <div className="platformGlow" aria-hidden="true" />
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag">La app</span>
          <h2>La app que tus clientes usan cada día.</h2>
          <p>Entreno, comida y progreso en un solo sitio, con tu marca. Tú acompañas; la tecnología hace el trabajo repetitivo.</p>
        </MotionReveal>

        <div className="bentoGrid">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            const featured = index === 0;
            return (
              <MotionReveal key={cap.title} className={featured ? "bentoCell bentoFeature" : "bentoCell"} delay={index * 0.04}>
                <span className="bentoIcon"><Icon size={featured ? 24 : 20} /></span>
                <div className="bentoBody">
                  <span className="bentoTag">{cap.tag}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.text}</p>
                </div>
                {featured ? (
                  <div className="bentoShot" aria-hidden="true">
                    <div className="bentoShotPhoto"><Camera size={20} /></div>
                    <div className="bentoShotResult">
                      <strong>Bowl de pollo y arroz</strong>
                      <div className="bentoShotMacros">
                        <span><b>48</b>P</span><span><b>62</b>C</span><span><b>14</b>G</span><span className="kcal"><b>560</b>kcal</span>
                      </div>
                    </div>
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
            <p>El usuario final ve tu marca, su plan, sus comidas, sus métricas y una ruta clara para avanzar.</p>
            <ul className="featureList">
              <li><CheckCircle2 size={18} /> Entrenos en vídeo con progreso por serie</li>
              <li><CheckCircle2 size={18} /> Nutrición con macros y calorías por foto</li>
              <li><CheckCircle2 size={18} /> Check-ins, hábitos y comunidad</li>
              <li><CheckCircle2 size={18} /> Soporte y perfil del cliente</li>
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
            <p>Revisamos el encaje, el alcance y la mejor forma de lanzar tu app de marca.</p>
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
            <a href="#plataforma">La app</a>
            <a href="#proceso">Proceso</a>
            <a href="#demo">Demo</a>
            <a href="#consulta">Solicitar propuesta</a>
          </nav>
        </div>
        <div className="v2FooterBottom">
          <span>© {new Date().getFullYear()} {platformBrand.name}. La app de coaching con tu marca.</span>
          <a className="btn primary" href="#consulta">Empezar <span className="btnArrow"><ArrowRight size={15} /></span></a>
        </div>
      </footer>
    </main>
  );
}
