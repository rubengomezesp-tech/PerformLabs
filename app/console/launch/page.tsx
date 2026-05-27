import { AlertTriangle, BadgeCheck, Rocket, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { getLaunchReadiness } from "@/lib/repositories/launch-readiness";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";

export const dynamic = "force-dynamic";

type LaunchPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

const statusCopy = {
  ready: { label: "Listo", icon: BadgeCheck, className: "tag" },
  warning: { label: "Revisar", icon: AlertTriangle, className: "tag strategyNext" },
  missing: { label: "Pendiente", icon: AlertTriangle, className: "tag danger" },
};

export default async function LaunchPage({ searchParams }: LaunchPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const readiness = await getLaunchReadiness(selectedWorkspace?.id);

  return (
    <>
      <Topbar
        eyebrow="QA"
        title="Verificación de lanzamiento."
        text="Antes de vender una app, nuestro equipo revisa marca, dominio, contenido, planes, nutrición, producto, soporte y experiencia móvil."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/launch" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver QA</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <>
            <article className="card span4 launchScoreCard">
              <Rocket color="var(--gold)" />
              <p className="metric">Readiness<strong>{readiness.score}%</strong></p>
              <div className="progressTrack">
                <span style={{ width: `${readiness.score}%` }} />
              </div>
              <p>
                {readiness.score >= 85
                  ? "La app está cerca de salir a venta real."
                  : "Aún faltan piezas para vender con confianza."}
              </p>
            </article>

            <article className="card span8">
              <ShieldCheck color="var(--gold)" />
              <h2>{selectedWorkspace.name}</h2>
              <p>{selectedWorkspace.domain}</p>
              <ul className="list">
                <li className="row">App <strong>{selectedWorkspace.appName}</strong></li>
                <li className="row">Soporte <span>{selectedWorkspace.supportEmail || "Pendiente"}</span></li>
                <li className="row">Estado <span className={selectedWorkspace.isActive ? "tag" : "tag danger"}>{selectedWorkspace.status}</span></li>
              </ul>
            </article>

            {readiness.checks.map((check) => {
              const copy = statusCopy[check.status];
              const Icon = copy.icon;

              return (
                <article className="card span4 launchCheckCard" key={check.key}>
                  <div className="sectionHeader">
                    <Icon color="var(--gold)" />
                    <span className={copy.className}>{copy.label}</span>
                  </div>
                  <h3>{check.title}</h3>
                  <p>{check.description}</p>
                  <strong>{check.value}</strong>
                </article>
              );
            })}
          </>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No hay marcas para verificar."
            text="Crea una implantación o convierte un lead en proyecto para empezar el QA de lanzamiento."
          />
        )}
      </section>
    </>
  );
}
