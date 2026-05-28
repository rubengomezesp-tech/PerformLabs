import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { platformBrand } from "@/lib/brand";

const nextSteps = [
  "Revisamos tu marca y objetivo.",
  "Te contacta un agente para ordenar prioridades.",
  "Definimos dominio, logo, contenido y fecha de arranque.",
  "Preparamos una propuesta de implantación clara.",
];

export default function ThanksPage() {
  return (
    <main className="landing">
      <section className="thanksHero">
        <div className="card thanksCard">
          <img className="heroBrandLogo compactLogo" src={platformBrand.logoUrl} alt={platformBrand.name} />
          <CheckCircle2 color="var(--green)" size={42} />
          <span className="eyebrow">Consulta enviada</span>
          <h1>Tu solicitud está en la mesa del equipo.</h1>
          <p>
            Revisaremos tu marca, tus objetivos y el tipo de app que quieres
            crear. El siguiente paso será hablar con un agente para ordenar
            dominio, logo, contenido, pagos y lanzamiento.
          </p>
          <ul className="list">
            {nextSteps.map((step, index) => (
              <li className="row" key={step}>
                {step}
                <span className="tag">Paso {index + 1}</span>
              </li>
            ))}
          </ul>
          <div className="actions">
            <Link className="btn primary" href="/">
              <ArrowLeft size={18} /> Volver a la página
            </Link>
            <a className="btn" href="mailto:contacto@performlabs.app">
              Escribir por email <Mail size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
