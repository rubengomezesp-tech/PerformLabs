import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { MotionReveal } from "@/components/motion-reveal";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { submitCoachInquiryAction } from "../contact-actions";

export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getWorkspaceBrand(slug);
  if (brand.id === ZERO_UUID) return { title: "Coach no encontrado" };
  return { title: `Contacto · ${brand.name}` };
}

export default async function CoachContactPage({
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

  return (
    <main className="salesPage" style={{ "--accent": accent, "--sales-bg": background } as CSSProperties}>
      <header className="salesNav">
        <a className="memberBrandLockup salesNavBrand" href={`/c/${slug}`}>
          <span className="memberBrandMark" style={{ borderColor: accent, color: accent }}>
            {brand.logoUrl ? <img alt="" src={brand.logoUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
          </span>
          <strong>{brand.name}</strong>
        </a>
        <a className="salesNavCta" href={`/c/${slug}#planes`}>Únete ahora</a>
      </header>

      <section className="salesSection salesContact" aria-labelledby="sales-contact-title">
        <MotionReveal>
          <h1 id="sales-contact-title" className="salesSectionTitle">Ponte en contacto</h1>
          <p className="salesContactLead">Escríbeme un mensaje y te responderé lo antes posible.</p>

          {status === "sent" ? (
            <p className="formMessage" role="status" style={{ color: "#3ddc97" }}>
              ¡Mensaje enviado! Te responderé lo antes posible.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="formMessage danger" role="alert">No se pudo enviar. Inténtalo de nuevo.</p>
          ) : null}

          <form action={submitCoachInquiryAction} className="salesContactForm">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="kind" value="contact" />
            <label className="salesPlanField">
              Nombre completo
              <input name="fullName" required autoComplete="name" placeholder="Tu nombre" />
            </label>
            <label className="salesPlanField">
              Email
              <input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="tu@email.com" />
            </label>
            <label className="salesPlanField">
              ¿Cómo puedo ayudarte?
              <textarea name="message" rows={4} placeholder="Cuéntame tu objetivo…" />
            </label>
            <button className="btn primary salesPlanCta" type="submit" style={{ background: accent, borderColor: accent }}>
              Enviar
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
