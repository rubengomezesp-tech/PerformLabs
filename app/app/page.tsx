import { Camera, Check, Droplets, Footprints, Moon, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceProducts } from "@/lib/repositories/member-experience";

export default async function MemberDashboard() {
  const brand = await getSelectedMemberAppBrand();
  const products = await listWorkspaceProducts(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Panel de miembro"
        title={`Bienvenido a ${brand.appName}.`}
        text={`Tu espacio de ${brand.name}: entrenamiento, nutrición, progreso y soporte en una sola experiencia.`}
      />
      <section className="grid">
        <article className="card span8">
          <div className="hero" style={{ minHeight: 260 }}>
            <div>
              <span className="eyebrow">{brand.appName}</span>
              <h1>Tu plan empieza aquí.</h1>
              <p>{brand.name} centraliza tu entrenamiento, comida, progreso y contacto con el equipo.</p>
            </div>
          </div>
        </article>
        <article className="card span4">
          <TrendingUp color="var(--gold)" />
          <h2>Mi Recorrido</h2>
          <ul className="list">
            <li className="row"><Camera size={18} /> Foto <span className="tag">Pendiente</span></li>
            <li className="row">Peso <strong>54.0 kg</strong></li>
            <li className="row">Grasa <strong>16%</strong></li>
          </ul>
          <button className="btn primary" style={{ width: "100%", marginTop: 12 }}>
            Registrar progreso
          </button>
        </article>
        <article className="card span6">
          <h2>Hábitos de hoy</h2>
          <ul className="list">
            <li className="row"><Droplets size={18} /> Beber 2 litros de agua <Check color="var(--green)" /></li>
            <li className="row"><Footprints size={18} /> Caminar 30 minutos <span className="tag">Abrir</span></li>
            <li className="row"><Moon size={18} /> Dormir 8 horas <span className="tag">Noche</span></li>
          </ul>
        </article>
        <article className="card span6">
          <h2>Actualización de plan</h2>
          <p>
            Tras completar el check-in, el coach puede revisar medidas, fotos,
            preferencias y generar una nueva versión del plan.
          </p>
          <div className="actions">
            <Link className="btn" href="/app/onboarding">Completar inicio</Link>
            <button className="btn" type="button">Solicitar actualización</button>
          </div>
        </article>
        {products.map((product) => (
          <article className="card span6" key={product.id}>
            <span className="tag">Programa</span>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <div className="tagCloud">
              {product.includedModules.map((module) => (
                <span className="tag" key={module}>{module}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
