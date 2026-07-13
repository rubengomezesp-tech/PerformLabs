import type { CSSProperties } from "react";
import { ArrowRight, Camera, Dumbbell, LineChart, MessageSquare, Salad, ShieldCheck, Smartphone } from "lucide-react";
import { ScreensGallery } from "@/components/landing/screens-gallery";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import type { CoachPlan } from "@/lib/repositories/coach-plans";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";
import { workspaceBrandMarkUrl } from "@/lib/workspace-brand-assets";

function formatPrice(amountCents: number, currency: string, interval: string): string {
  const amount = (amountCents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
    maximumFractionDigits: 2,
  });
  return `${amount}/${interval === "year" ? "año" : "mes"}`;
}

// Template copy shared by every coach's page. The brand-specific parts (name, headline,
// subtext, hero image, accent, about text, plans) come from the workspace; this fixed
// structure is what makes it an elite, conversion-shaped landing instead of a list.
const BARRIERS = [
  { title: "Falta de confianza", body: "¿Te intimida el gimnasio? Sin una guía clara, hasta los más motivados dudan de su técnica y abandonan antes de ver resultados." },
  { title: "Falta de tiempo", body: "Las agendas llenas sabotean la constancia. Saltarse sesiones «hasta que todo se calme» deja tus metas siempre fuera de alcance." },
  { title: "Desinformación", body: "Cansado de consejos contradictorios y de la bro-science que solo te hace perder el tiempo —y la motivación—." },
];

const PILLARS = [
  {
    icon: Dumbbell,
    title: "Entrenamiento personalizado",
    body: "Un plan creado para ti y tu nivel. Cada ejercicio grabado en vídeo para que lo hagas con técnica perfecta.",
    points: ["Vídeo en cada ejercicio", "Registra reps y kilos", "Cambia ejercicios si te lesionas"],
  },
  {
    icon: Salad,
    title: "Nutrición flexible",
    body: "Come bien sin renunciar a lo que te gusta. Plan adaptado a tus objetivos, tu horario y tus preferencias.",
    points: ["Macros y calorías claras", "Lista de la compra", "General, vegetariano o vegano"],
  },
];

const FEATURES = [
  { icon: Dumbbell, title: "Entrenamiento a medida", body: "Tu rutina, tu nivel, tu progresión." },
  { icon: Salad, title: "Nutrición a tu vida", body: "Plan flexible con macros y recetas." },
  { icon: Camera, title: "Fotos de progreso", body: "Compara tu evolución semana a semana." },
  { icon: LineChart, title: "Registro de medidas", body: "Peso, grasa y perímetros en un sitio." },
  { icon: MessageSquare, title: "Tu coach contigo", body: "Revisiones, ajustes y apoyo real." },
  { icon: Smartphone, title: "Todo en tu móvil", body: "Tu app, tu marca, siempre encima." },
];

/**
 * Public, brand-skinned sales landing for a coach: an elite, conversion-shaped page
 * (hero → barriers → pillars → app showcase → benefits → about → plans) that reskins per
 * coach via `--accent`/`--sales-bg` and the brand's hero/logo/about copy. Reuses the
 * landing's ScreensGallery (app mockups) + MotionReveal/SmoothScroll for life. The route
 * resolves brand/plans and passes the server checkout action (untouched).
 */
export function SalesPage({
  brand,
  slug,
  plans,
  canCheckout,
  checkoutAction,
  notice,
}: {
  brand: WorkspaceBrand;
  slug: string;
  plans: CoachPlan[];
  canCheckout: boolean;
  checkoutAction: (formData: FormData) => Promise<void>;
  notice?: string | null;
}) {
  const accent = brand.accentColor || "#078df2";
  const background = brand.backgroundColor || "#0d0d10";
  const markUrl = workspaceBrandMarkUrl(brand);
  const headline = brand.heroHeadline || `Transforma tu cuerpo con ${brand.name}`;
  const subtext =
    brand.heroSubtext ||
    "Entrena con fuerza, come con libertad y construye un cuerpo que se vea —y se sienta— increíble. Con un plan hecho para ti.";
  const heroBg: string | undefined = brand.heroImageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.82)), url(${brand.heroImageUrl})`
    : undefined;

  return (
    <main className="salesPage" style={{ "--accent": accent, "--sales-bg": background } as CSSProperties}>
      <SmoothScroll />

      <header className="salesNav">
        <span className="memberBrandLockup">
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {markUrl ? <img alt="" src={markUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
          </span>
          <strong>{brand.name}</strong>
        </span>
        <nav className="salesNavLinks" aria-label="Secciones del sitio">
          <a href="#planes">Membresías</a>
          <a href={`/c/${slug}/1-1-coaching`}>1-1 Coaching</a>
          <a href={`/c/${slug}/contacto`}>Contacto</a>
        </nav>
        <a className="salesNavCta" href="#planes">Únete ahora</a>
      </header>

      <section className={brand.heroImageUrl ? "salesHero salesHeroImage" : "salesHero"} style={heroBg ? { backgroundImage: heroBg } : undefined}>
        <div className="salesHeroInner">
          <h1 className="salesHeroTitle">{headline}</h1>
          <p className="salesHeroSub">{subtext}</p>
          <a className="salesCta" href="#planes">Transfórmate ahora <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="salesSection salesBarriers" aria-labelledby="sales-barriers-title">
        <MotionReveal>
          <h2 id="sales-barriers-title" className="salesSectionTitle">Rompiendo barreras</h2>
          <div className="salesBarrierGrid">
            {BARRIERS.map((barrier) => (
              <article className="salesBarrierCard" key={barrier.title}>
                <h3>{barrier.title}</h3>
                <p>{barrier.body}</p>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      <section className="salesSection salesPillars" aria-labelledby="sales-pillars-title">
        <MotionReveal>
          <h2 id="sales-pillars-title" className="salesSectionTitle">Lo que vas a conseguir</h2>
          <div className="salesPillarGrid">
            {PILLARS.map((pillar) => (
              <article className="salesPillarCard uiGlass" key={pillar.title}>
                <span className="uiIconChip" aria-hidden="true"><pillar.icon size={20} /></span>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
                <ul className="salesPillarList">
                  {pillar.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      <section className="salesSection salesShowcase" aria-labelledby="sales-showcase-title">
        <MotionReveal>
          <h2 id="sales-showcase-title" className="salesSectionTitle">Mira la app por dentro</h2>
          <p className="salesShowcaseSub">Entreno, comida, progreso y tu coach —todo en un sitio, con la marca de {brand.name}.</p>
        </MotionReveal>
        <ScreensGallery />
      </section>

      <section className="salesSection salesFeatures" aria-labelledby="sales-features-title">
        <MotionReveal>
          <h2 id="sales-features-title" className="salesSectionTitle">Todo incluido en tu membresía</h2>
          <div className="salesFeatureGrid">
            {FEATURES.map((feature) => (
              <article className="salesFeatureCard" key={feature.title}>
                <span className="uiIconChip" aria-hidden="true"><feature.icon size={18} /></span>
                <strong>{feature.title}</strong>
                <span className="muted">{feature.body}</span>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      {brand.welcomeMessage ? (
        <section className="salesSection salesAbout" aria-labelledby="sales-about-title">
          {brand.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="salesAboutPhoto" src={brand.heroImageUrl} alt={`Tu coach, ${brand.name}`} />
          ) : null}
          <MotionReveal className="salesAboutBody">
            <h2 id="sales-about-title" className="salesSectionTitle">Hola, soy {brand.name}</h2>
            <p>{brand.welcomeMessage}</p>
            {brand.signatureUrl ? (
              <img className="salesAboutSignature" src={brand.signatureUrl} alt={`Firma de ${brand.name}`} />
            ) : null}
          </MotionReveal>
        </section>
      ) : null}

      <section id="planes" className="salesSection salesPlans" aria-labelledby="sales-plans-title">
        <MotionReveal>
          <span className="eyebrow" style={{ color: accent }}>Membresías</span>
          <h2 id="sales-plans-title" className="salesSectionTitle">Elige tu plan y empieza hoy</h2>

          {notice ? <p className="formMessage danger" role="alert">{notice}</p> : null}

          {plans.length === 0 ? (
            <p className="muted">Este coach todavía no ha publicado planes. Vuelve pronto.</p>
          ) : (
            <div className="salesPlanGrid">
              {plans.map((plan) => (
                <article key={plan.id} className="salesPlanCard uiGlass">
                  <strong className="salesPlanName">{plan.name}</strong>
                  {plan.description ? <span className="muted">{plan.description}</span> : null}
                  <span className="salesPlanPrice" style={{ color: accent }}>
                    {formatPrice(plan.amountCents, plan.currency, plan.interval)}
                  </span>
                  <form action={checkoutAction} className="salesPlanForm">
                    <input type="hidden" name="workspaceId" value={brand.id} />
                    <input type="hidden" name="planId" value={plan.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <label className="salesPlanField">
                      Tu email
                      <input name="email" type="email" required placeholder="tu@email.com" autoComplete="email" inputMode="email" />
                    </label>
                    <button
                      className="btn primary salesPlanCta"
                      type="submit"
                      disabled={!canCheckout}
                      style={{ background: accent, borderColor: accent }}
                    >
                      {canCheckout ? "Únete ahora" : "No disponible aún"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}

          <p className="salesTrust">
            <ShieldCheck size={15} aria-hidden="true" /> Pago seguro con Stripe · cancela cuando quieras
          </p>
        </MotionReveal>
      </section>

      <footer className="salesFooter">
        <span>{brand.name}</span>
        {brand.supportEmail ? <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> : null}
      </footer>
    </main>
  );
}
