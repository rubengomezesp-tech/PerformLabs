import { randomUUID } from "node:crypto";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, Dumbbell, HeartHandshake, Salad, Sparkles, Target, TrendingUp } from "lucide-react";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { workspaceBrandMarkUrl } from "@/lib/workspace-brand-assets";
import { submitCoachInquiryAction } from "../contact-actions";

export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const TRANSFORM = [
  { icon: Dumbbell, body: "Un plan de entrenamiento y alimentación 100% personalizado según tus necesidades y estilo de vida." },
  { icon: Salad, body: "Come mejor y disfruta los alimentos que amas, en las porciones que tu cuerpo realmente necesita." },
  { icon: TrendingUp, body: "Aumenta tu confianza, fortalece tu mentalidad y transforma tu físico." },
  { icon: Target, body: "Un sistema paso a paso que te ayuda a cambiar tus hábitos de forma sostenible." },
];

const CORNER = [
  { title: "Respuestas rápidas y ajustes", body: "Cuando lo necesites, sin esperas." },
  { title: "Mi compañía y apoyo", body: "Contigo en todo momento del proceso." },
  { title: "Un plan real para ti", body: "Cercano y pensado a tu medida." },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getWorkspaceBrand(slug);
  if (brand.id === ZERO_UUID) return { title: "Coach no encontrado" };
  return { title: `Coaching 1-1 · ${brand.name}` };
}

export default async function CoachingOneToOnePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status } = await searchParams;
  const brand = await getWorkspaceBrand(slug);
  if (brand.id === ZERO_UUID) notFound();

  const accent = brand.accentColor || "#078df2";
  const background = brand.backgroundColor || "#0d0d10";
  const markUrl = workspaceBrandMarkUrl(brand);
  const submissionId = randomUUID();

  return (
    <main className="salesPage" style={{ "--accent": accent, "--sales-bg": background } as CSSProperties}>
      <SmoothScroll />

      <header className="salesNav">
        <a className="memberBrandLockup salesNavBrand" href={`/c/${slug}`}>
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {markUrl ? <img alt="" src={markUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
          </span>
          <strong>{brand.name}</strong>
        </a>
        <a className="salesNavCta" href="#aplicar">Aplicar</a>
      </header>

      <section className="salesHero">
        <div className="salesHeroInner">
          <h1 className="salesHeroTitle">Coaching Élite 1:1</h1>
          <p className="salesHeroSub">Trabajo contigo de forma personalizada, con seguimiento constante y apoyo real.</p>
          <a className="salesCta" href="#aplicar">Aplicar ahora <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="salesSection salesFeatures" aria-labelledby="coaching-transform-title">
        <MotionReveal>
          <h2 id="coaching-transform-title" className="salesSectionTitle">La transformación que vas a experimentar</h2>
          <div className="salesFeatureGrid">
            {TRANSFORM.map((item, index) => (
              <article className="salesFeatureCard" key={index}>
                <span className="uiIconChip" aria-hidden="true"><item.icon size={18} /></span>
                <span className="muted">{item.body}</span>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      <section className="salesSection salesPillars" aria-labelledby="coaching-corner-title">
        <MotionReveal>
          <h2 id="coaching-corner-title" className="salesSectionTitle">Imagina que me tienes en tu esquina</h2>
          <div className="salesPillarGrid">
            {CORNER.map((item) => (
              <article className="salesPillarCard uiGlass" key={item.title}>
                <span className="uiIconChip" aria-hidden="true"><HeartHandshake size={20} /></span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </MotionReveal>
      </section>

      <section id="aplicar" className="salesSection salesContact" aria-labelledby="coaching-apply-title">
        <MotionReveal>
          <span className="eyebrow" style={{ color: accent }}><Sparkles size={14} aria-hidden="true" /> Acompañamiento 100% personalizado</span>
          <h2 id="coaching-apply-title" className="salesSectionTitle">¿Lo quieres conmigo? Aplica aquí</h2>
          <p className="salesContactLead">Cuéntame tu objetivo y te escribo en breve para ver si encajamos.</p>

          {status === "sent" ? (
            <p className="formMessage" role="status" style={{ color: "#3ddc97" }}>
              ¡Solicitud enviada! Te escribiré en breve.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="formMessage danger" role="alert">No se pudo enviar. Inténtalo de nuevo.</p>
          ) : null}

          <form action={submitCoachInquiryAction} className="salesContactForm">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="kind" value="coaching" />
            <input type="hidden" name="submissionId" value={submissionId} />
            <label aria-hidden="true" style={{ position: "fixed", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
              Sitio web
              <input autoComplete="off" name="website" tabIndex={-1} />
            </label>
            <label className="salesPlanField">
              Nombre completo
              <input name="fullName" required autoComplete="name" maxLength={80} placeholder="Tu nombre" />
            </label>
            <label className="salesPlanField">
              Email
              <input name="email" type="email" required autoComplete="email" inputMode="email" maxLength={160} placeholder="tu@email.com" />
            </label>
            <label className="salesPlanField">
              Tu objetivo
              <textarea name="message" rows={4} maxLength={2000} placeholder="¿Qué quieres conseguir?" />
            </label>
            <button className="btn primary salesPlanCta" type="submit" style={{ background: accent, borderColor: accent }}>
              Enviar solicitud
            </button>
          </form>
        </MotionReveal>
      </section>

      <footer className="salesFooter">
        <span>{brand.name}</span>
        {brand.supportEmail ? <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> : null}
      </footer>
    </main>
  );
}
