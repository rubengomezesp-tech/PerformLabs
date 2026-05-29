import { Eye, Palette, Smartphone } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { updateBrandingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachBrandPage() {
  const brand = await getSelectedMemberAppBrand();
  const accent = brand.accentColor || "#d8bd6b";
  const background = brand.backgroundColor || "#101014";

  return (
    <>
      <Topbar
        eyebrow="Marca"
        title={`Personaliza ${brand.name}.`}
        text="Tu marca, tus colores, tu logo y tus mensajes en la landing de acceso, la home y toda la app del cliente."
        actions={<Link className="btn primary" href="/app">Ver app <Smartphone size={18} /></Link>}
      />
      <section className="grid">
        <article className="card span7 motionCard">
          <Palette color="var(--gold)" />
          <h2>Editable por ti</h2>
          <form action={updateBrandingAction} className="editForm brandForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <div className="brandFormRow">
              <label>Color de acento<input name="accentColor" type="color" defaultValue={accent} /></label>
              <label>Color de fondo<input name="backgroundColor" type="color" defaultValue={background} /></label>
            </div>
            <label className="spanFull">Logo (URL de imagen)
              <input name="logoUrl" type="url" placeholder="https://.../logo.png" defaultValue={brand.logoUrl ?? ""} />
            </label>
            <label className="spanFull">Titular de la landing
              <input name="heroHeadline" type="text" placeholder="Entrena conmigo" defaultValue={brand.heroHeadline ?? ""} />
            </label>
            <label className="spanFull">Subtítulo de la landing
              <textarea name="heroSubtext" rows={2} placeholder="Tu plan de entrenamiento y nutrición, en un solo sitio." defaultValue={brand.heroSubtext ?? ""} />
            </label>
            <label className="spanFull">Imagen de fondo de la landing (URL)
              <input name="heroImageUrl" type="url" placeholder="https://.../portada.jpg" defaultValue={brand.heroImageUrl ?? ""} />
            </label>
            <label className="spanFull">Mensaje de bienvenida (home)
              <textarea name="welcomeMessage" rows={2} placeholder="¡Bienvenido! Aquí tienes tu plan de hoy." defaultValue={brand.welcomeMessage ?? ""} />
            </label>
            <button className="btn primary spanFull" type="submit">Guardar marca</button>
          </form>
        </article>

        <article className="card span5 motionCard">
          <div className="sectionHeader">
            <div>
              <Eye color="var(--gold)" />
              <h2>Vista previa</h2>
            </div>
            <Link className="tag" href="/m">Ver landing</Link>
          </div>
          <div
            className="brandPreviewHero"
            style={{
              background: brand.heroImageUrl
                ? `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.75)), url(${brand.heroImageUrl}) center/cover`
                : `radial-gradient(120% 120% at 0% 0%, ${accent}22, ${background})`,
              borderColor: `${accent}55`,
            }}
          >
            <span className="brandPreviewMark" style={{ borderColor: accent, color: accent }}>
              {brand.logoUrl ? <img alt="" src={brand.logoUrl} /> : brand.appName.slice(0, 3).toUpperCase()}
            </span>
            <strong>{brand.heroHeadline || brand.name}</strong>
            <p>{brand.heroSubtext || `Tu espacio de ${brand.name}.`}</p>
            <span className="btn primary sm" style={{ background: accent, borderColor: accent }}>Entrar</span>
          </div>
          <ul className="list">
            <li className="row">Nombre <strong>{brand.name}</strong></li>
            <li className="row">Acento <span className="tag">{accent}</span></li>
            <li className="row">Soporte <span>{brand.supportEmail}</span></li>
          </ul>
        </article>
      </section>
    </>
  );
}
