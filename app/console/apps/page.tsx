import { Eye, Globe, Pause, Play, Plus, Save } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { createWorkspaceAction, toggleWorkspaceAction, updateWorkspaceAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChildAppsPage() {
  const { workspaces } = await listWorkspaceSummaries();

  return (
    <>
      <Topbar
        eyebrow="Marcas"
        title="Proyectos white-label en implantación."
        text="Gestiona las marcas que nuestro equipo está preparando junto al cliente: dominio, logo, identidad visual, soporte, vídeos, dietas, rutinas, pagos y equipo operativo."
        actions={<a className="btn primary" href="#crear-app">Nueva implantación <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span12" id="crear-app">
          <div className="sectionHeader">
            <div>
              <h2>Nueva implantación</h2>
              <p>Registra un proyecto premium para que nuestro agente coordine dominio, marca, soporte, contenido y entrega.</p>
            </div>
          </div>
          <form action={createWorkspaceAction} className="formGrid">
            <label>
              Nombre de marca
              <input name="name" placeholder="Ej. Elite Coach Academy" required />
            </label>
            <label>
              Nombre en la app
              <input name="appName" placeholder="Ej. Elite App" />
            </label>
            <label>
              Dominio
              <input name="customDomain" placeholder="app.tudominio.com" />
            </label>
            <label>
              Email soporte
              <input name="supportEmail" placeholder="soporte@tudominio.com" type="email" />
            </label>
            <label>
              Color principal
              <input name="accentColor" type="color" defaultValue="#d8bd6b" />
            </label>
            <div className="formActions">
              <button className="btn primary" type="submit">
                Crear implantación <Plus size={18} />
              </button>
            </div>
          </form>
        </article>
        {workspaces.map((app) => (
          <article className="card span6" key={app.id}>
            <div className="appCardHeader">
              <span className="swatch" style={{ background: app.accentColor }} />
              <Globe color="var(--gold)" />
              <div>
                <h2>{app.name}</h2>
                <p>{app.appName}</p>
              </div>
            </div>
            <ul className="list">
              <li className="row">Dominio <span>{app.domain}</span></li>
              <li className="row">Soporte <span>{app.supportEmail || "Pendiente"}</span></li>
              <li className="row">Estado <span className={app.isActive ? "tag" : "tag danger"}>{app.status}</span></li>
              <li className="row">Miembros <strong>{app.members}</strong></li>
              <li className="row">MRR <strong>{app.mrr}</strong></li>
            </ul>
            <form action={updateWorkspaceAction} className="editForm">
              <input name="id" type="hidden" value={app.id} />
              <label>
                Marca
                <input name="name" defaultValue={app.name} required />
              </label>
              <label>
                App
                <input name="appName" defaultValue={app.appName} />
              </label>
              <label>
                Dominio
                <input name="customDomain" defaultValue={app.domain} />
              </label>
              <label>
                Soporte
                <input name="supportEmail" defaultValue={app.supportEmail} type="email" />
              </label>
              <label>
                Color
                <input name="accentColor" type="color" defaultValue={app.accentColor} />
              </label>
              <div className="actions">
                <button className="btn" type="submit">
                  Guardar <Save size={16} />
                </button>
              </div>
            </form>
            <form action={toggleWorkspaceAction}>
              <input name="id" type="hidden" value={app.id} />
              <input name="isActive" type="hidden" value={String(!app.isActive)} />
              <div className="actions">
                <a className="btn primary" href={`/app/select?brand=${app.id}`}>
                  Vista cliente <Eye size={16} />
                </a>
                <button className="btn" type="submit">
                  {app.isActive ? "Pausar app" : "Activar app"}
                  {app.isActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </>
  );
}
