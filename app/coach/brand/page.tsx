import { Palette, Smartphone } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export default async function CoachBrandPage() {
  const brand = await getSelectedMemberAppBrand();

  return (
    <>
      <Topbar
        eyebrow="Marca"
        title={`Ajustes visibles de ${brand.name}.`}
        text="Zona del entrenador para editar identidad basica, soporte, tono y vista previa sin entrar en la consola PerformLabs."
        actions={<Link className="btn primary" href="/app">Ver app <Smartphone size={18} /></Link>}
      />
      <section className="grid">
        <article className="card span5 motionCard">
          <Palette color="var(--gold)" />
          <h2>Identidad</h2>
          <div className="brandPreview">
            <span className="brandMark" style={{ borderColor: brand.accentColor, color: brand.accentColor }}>
              {brand.appName.slice(0, 3).toUpperCase()}
            </span>
            <div>
              <strong>{brand.name}</strong>
              <p>{brand.supportEmail}</p>
            </div>
          </div>
        </article>
        <article className="card span7 motionCard">
          <h2>Editable por el coach</h2>
          <ul className="list">
            <li className="row">Nombre visible <strong>{brand.name}</strong></li>
            <li className="row">App name <strong>{brand.appName}</strong></li>
            <li className="row">Color principal <span className="tag">{brand.accentColor}</span></li>
            <li className="row">Soporte <span>{brand.supportEmail}</span></li>
          </ul>
        </article>
      </section>
    </>
  );
}
